# ZeroClick — Realistic Winning Build Plan
**4 People | 6 Days | First-time AWS | Working Prototype URL**

---

## ⚡ The Core Decision: What We're Actually Building

### KEEP (must work perfectly on demo day)
| Feature | Why |
|---|---|
| 60-second onboarding chat | First thing judge experiences — must be fast and impressive |
| Style Card reveal | Visual payoff after onboarding — makes the AI feel real |
| 3 draft cards with scores | Core product value — judge sees this within 90 seconds |
| Walk & Talk (voice → post) | The wow moment — nothing else does this |
| LinkedIn post (your account) | Proof it's real — non-negotiable |

### CUT (show on architecture diagram, not in demo)
| Cut | Replace With |
|---|---|
| Step Functions | Plain Lambda chains — same result, 2 days saved |
| OpenSearch Serverless | DynamoDB stores examples + manual context injection to Bedrock |
| Cognito auth | Streamlit session state + one pre-seeded demo account |
| Amazon Comprehend | Bedrock does trend enrichment directly — one less service |
| Telegram/WhatsApp nudge | Show as "Coming Soon" badge in UI |
| Continuous style patching | Show the concept in UI, don't wire the loop |
| Google Trends / pytrends | NewsAPI + Serper only — simpler, more reliable |

### AWS Services (10 — all visible, all functional)
`Bedrock` `Lambda` `API Gateway` `DynamoDB` `S3` `Transcribe` `Translate` `EventBridge` `SNS` `App Runner`

---

## 👥 Team Split

| Person | Owns | Days |
|---|---|---|
| **You** | AWS infra setup, all Lambda functions, Bedrock prompts architecture, API Gateway, LinkedIn OAuth | All 6 |
| **Teammate 1** | All 4 Streamlit screens — given exact component specs by you | Day 2–5 |
| **Teammate 2** | Prompt engineering — testing + iterating all Bedrock prompts until outputs are great | Day 1–5 |
| **Teammate 3** | AWS service setup (following docs), end-to-end testing, demo video, README | Day 1–6 |

**Rule: You are not touching the UI. Teammate 1 is not touching Lambda. Nobody crosses lanes after Day 1.**

---

## 🗺️ Simplified Architecture

```
Judge opens URL (App Runner)
        ↓
Streamlit Dashboard
        ↓
API Gateway (REST)
        ↓
┌───────────────────────────────────────┐
│           AWS Lambda Functions         │
│                                       │
│  onboarding_chat.py                   │
│  style_extractor.py     ←→ Bedrock    │
│  fetch_trends.py        ←→ NewsAPI    │
│  generate_drafts.py     ←→ Bedrock    │
│  score_drafts.py        ←→ Bedrock    │
│  voice_processor.py     ←→ Transcribe │
│  translate_draft.py     ←→ Translate  │
│  linkedin_post.py       ←→ LinkedIn   │
│  notify_user.py         ←→ SNS        │
└───────────────────────────────────────┘
        ↓               ↓
    DynamoDB            S3
(users, style,      (audio blobs,
 drafts, history)    transcripts)
        
EventBridge → fetch_trends + generate_drafts (9AM daily cron)
```

---

## 📦 PHASE 0 — Infrastructure Setup
**Owner: You + Teammate 3 | Day 1 morning | 3 hours**

### DynamoDB Tables (simplified — 3 tables only)

```
Table: users
  PK: user_id (String)   ← for demo: "demo_user_001"
  - name, email
  - onboarding_complete: Boolean
  - interests: List<String>
  - style_vector: Map      ← stored directly, no separate table needed
  - linkedin_access_token: String  ← your OAuth token, pre-seeded

Table: drafts
  PK: user_id (String)
  SK: draft_id (String, timestamp-based)
  - topic, trend_source
  - variant_type: "viral_hook" | "value_add" | "the_story"
  - content_en: String
  - content_hi: String     ← translated version
  - score: Map { hook, clarity, engagement, overall }
  - status: "pending" | "posted" | "rejected"
  - generated_at: String

Table: post_history
  PK: user_id (String)
  SK: posted_at (Timestamp)
  - draft_id, topic, variant_type, linkedin_post_id
```

### S3 Bucket
```
zeroclick-demo/
├── audio/{user_id}/{timestamp}.webm    ← voice recordings
└── transcripts/{user_id}/{timestamp}.txt
```

### API Gateway — 6 endpoints
```
POST /onboarding/chat      → onboarding_chat Lambda
POST /onboarding/lock      → style_extractor Lambda
GET  /drafts/{user_id}     → DynamoDB read (via Lambda)
POST /voice/transcribe     → voice_processor Lambda
POST /drafts/{id}/post     → linkedin_post Lambda
POST /drafts/{id}/feedback → update DynamoDB status
```

### Teammate 3 sets up (following AWS docs):
- Create AWS account + IAM user with correct permissions
- Create DynamoDB tables above
- Create S3 bucket
- Deploy App Runner service pointing to Streamlit repo
- Set all env vars: `BEDROCK_REGION`, `NEWSAPI_KEY`, `SERPER_KEY`, `LINKEDIN_TOKEN`

---

## 🎭 PHASE 1 — Onboarding Pipeline
**Owner: You (Lambda) + Teammate 1 (UI) + Teammate 2 (prompts) | Day 1–2**

### The 60-Second Onboarding Flow

**What the judge experiences:**
```
[10s] Bot: "Hey! I'm going to learn how YOU write in about 60 seconds.
            What do you do and what topics do you love posting about?"
[15s] Judge types answer
[5s]  Bot asks ONE sharp follow-up based on their answer
[15s] Judge answers
[5s]  Bot: "Last one — show me how you'd start a post. 
            Just the first line, off the top of your head."
[10s] Judge types opener
[5s]  Style Card appears ✨
```

**Three questions maximum. No more.**

### `onboarding_chat` Lambda

```python
# The system prompt that powers the whole conversation
SYSTEM_PROMPT = """
You are ZeroClick's onboarding assistant. Your job: learn this 
person's LinkedIn writing style in under 60 seconds.

Ask MAXIMUM 3 questions, one at a time:
Q1: Their professional topic/niche (what they post about)
Q2: A natural follow-up based on Q1 — dig into their personality.
    If they sound formal → ask "do you ever get sarcastic in posts?"
    If they sound casual → ask "do you use emojis or keep it clean?"
Q3: "Show me your first line of a post — just the opener, raw."

While they answer, silently track in style_signals{}:
- tone: formal/casual/witty/motivational/sarcastic
- emoji_use: detected from their actual messages to you
- sentence_length: short(<8 words) / medium / long
- language_mix: english / hinglish / hindi
- opener_style: what their Q3 answer reveals
- interests: extracted from Q1

After Q3: set ready_to_lock: true.
Return JSON: { bot_reply, style_signals, ready_to_lock, turn_number }
"""

def handler(event, context):
    user_id = event['user_id']
    message = event['message']
    history = event.get('history', [])
    
    history.append({"role": "user", "content": message})
    
    response = bedrock.invoke_model(
        modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps({
            "system": SYSTEM_PROMPT,
            "messages": history,
            "max_tokens": 300
        })
    )
    
    result = json.loads(response['body'].read())
    # Parse bot_reply + style_signals + ready_to_lock from result
    
    history.append({"role": "assistant", 
                    "content": result['bot_reply']})
    
    return {
        "bot_reply": result['bot_reply'],
        "style_signals": result['style_signals'],
        "ready_to_lock": result['ready_to_lock'],
        "history": history
    }
```

### `style_extractor` Lambda
*Called once when judge hits "Lock My Style" after Q3*

```python
EXTRACTION_PROMPT = """
Based on this conversation, produce a StyleVector JSON.
Be specific. Use evidence from exactly what they said and how they said it.

Return this exact structure:
{
  "tone": "...",
  "emoji_frequency": "never|low|medium|high",
  "avg_sentence_length": "short|medium|long",
  "opener_style": "...",
  "closer_style": "...",
  "language_mix": "english|hinglish|hindi",
  "signature_phrases": [],
  "avoid_patterns": [],
  "interests": [],
  "detected_evidence": {
    "tone": "one sentence explaining what in their messages shows this",
    "opener_style": "one sentence of evidence"
  }
}
"""
# Call Bedrock with full chat history + extraction prompt
# Write result to DynamoDB users table (style_vector field)
# Return style_vector + detected_evidence for Style Card UI
```

### Teammate 1 builds — Screen 1 (Onboarding UI spec):

```
SCREEN LAYOUT:
┌──────────────────────────────────────────┐
│  ⚡ ZeroClick                            │
│  "Let's figure out how you write."       │
│                                          │
│  [Chat window]                           │
│  🤖 Bot message here                    │
│  👤 User message here                   │
│                                          │
│  [████████░░ 70% — Learning your style] │
│                                          │
│  [Text input field]  [🎙️ mic]  [Send →] │
│                                          │
│  [Lock My Style ✅]  ← only after Q3    │
└──────────────────────────────────────────┘

AFTER LOCK — Style Card appears:
┌──────────────────────────────────────────┐
│  🎭 Your Style DNA                       │
│  ─────────────────────────────────────  │
│  Tone         Conversational with wit    │
│  Emojis       Rarely                    │
│  Sentences    Short & punchy            │
│  Language     Hinglish                  │
│  Opener       Rhetorical question       │
│  Topics       AI, startups              │
│                                          │
│  💡 "You said 'bhai' and used sarcasm   │
│      about your job — that's your voice"│
│                                          │
│  [✅ That's me — Show my drafts]        │
└──────────────────────────────────────────┘

COMPONENTS NEEDED:
- st.chat_message() for conversation
- st.progress() for confidence meter
- st.audio() for mic input
- Custom styled card for Style Card reveal
- Session state: history[], style_signals{}, ready_to_lock
```

---

## 📡 PHASE 2 — Draft Generation Pipeline
**Owner: You (Lambda) + Teammate 2 (prompts) | Day 2–3**

### `fetch_trends` Lambda

```python
def fetch_trends(interests: list) -> list:
    trends = []
    
    for interest in interests[:2]:  # top 2 interests only
        # NewsAPI
        news = requests.get(
            "https://newsapi.org/v2/everything",
            params={
                "q": f"{interest} startup founder",
                "language": "en",
                "sortBy": "publishedAt",
                "pageSize": 5,
                "apiKey": NEWSAPI_KEY
            }
        )
        
        # Serper — finds real viral LinkedIn post angles
        serper = requests.post(
            "https://google.serper.dev/search",
            json={"q": f"site:linkedin.com {interest} viral post 2025"},
            headers={"X-API-KEY": SERPER_KEY}
        )
        
        trends.append({
            "interest": interest,
            "top_headline": news.json()['articles'][0],
            "linkedin_angle": serper.json()['organic'][0]['snippet']
        })
    
    return trends
```

### `generate_drafts` Lambda — The 3 Sub-Prompts

```python
VARIANT_PROMPTS = {
    "viral_hook": """
        STRUCTURE RULES (non-negotiable):
        - Line 1: ONE sentence. Bold claim, surprising stat, or direct 
          challenge. NO "I've been thinking..." NO intro. Start mid-thought.
        - Body: 2-3 short punchy lines. No bullets.
        - Close: A question that invites debate.
        - Max 120 words.
        
        Bad opener: "I've been reflecting on AI lately..."
        Good opener: "AI won't take your job. Your hesitation will."
    """,
    
    "value_add": """
        STRUCTURE RULES (non-negotiable):
        - Line 1: A clear promise. "X things about Y that nobody tells you"
        - Body: Exactly 3-4 numbered points. One sentence each. No fluff.
        - Close: One actionable takeaway the reader can use TODAY.
        - Max 180 words.
    """,
    
    "the_story": """
        STRUCTURE RULES (non-negotiable):
        - Act 1 (1-2 sentences): A specific moment. Not general.
          Bad: "I used to struggle with X"
          Good: "Tuesday. 11pm. My laptop screen was the only light on."
        - Act 2 (2-3 sentences): The tension, the surprise, what changed.
        - Act 3 (1-2 sentences): What you learned.
        - Close: One line that connects to the reader's life.
        - First person. No bullets. No headers. Max 180 words.
    """
}

BASE_PROMPT = """
You are writing a LinkedIn post FOR {name}.
Their writing style: {style_vector}
Examples of their best posts for reference: {rag_examples}

Topic/trend to write about: {trend}

{VARIANT_SPECIFIC_PROMPT}

CRITICAL: Write in their voice. If they use Hinglish, use it naturally.
If their style shows short sentences, keep them short.
Mimic their detected opener style.
Return ONLY the post text. No explanation. No title.
"""

# For RAG examples — just fetch last 3 approved posts from DynamoDB
# No OpenSearch needed. Simple DynamoDB query.
def get_style_examples(user_id):
    response = dynamodb.query(
        TableName='post_history',
        KeyConditionExpression='user_id = :uid',
        ExpressionAttributeValues={':uid': user_id},
        ScanIndexForward=False,
        Limit=3
    )
    return [item['content_en'] for item in response['Items']]
```

### `score_drafts` Lambda

```python
SCORING_PROMPT = """
Score this LinkedIn post. Return ONLY this JSON, nothing else:
{
  "hook": <0-10>,
  "clarity": <0-10>, 
  "engagement": <0-10>,
  "overall": <one decimal 0-10>,
  "top_strength": "<one sentence>",
  "top_weakness": "<one sentence>",
  "style_match": <true/false>
}

Scoring guide:
- hook: Does line 1 make you stop scrolling?
- clarity: Is the core message obvious in 5 seconds?
- engagement: Does it invite comments or shares?

Post to score:
{draft_text}
"""
```

### EventBridge Cron (autonomous daily pipeline)
```
# serverless cron — fires at 9AM IST (3:30 UTC)
Rule: cron(30 3 * * ? *)
Target: Lambda ARN → fetch_trends → generate_drafts → score → save to DynamoDB
```

### Teammate 1 builds — Screen 2 (Drafts Dashboard spec):

```
SCREEN LAYOUT:
┌────────────────────────────────────────────────────────┐
│  ⚡ ZeroClick   [Riya's Style ✓]   [🌐 EN | हिं toggle]│
│  "3 drafts ready for you."                             │
├──────────────────┬─────────────────┬───────────────────┤
│  🔥 Viral Hook   │  📚 Value Add   │  📖 The Story     │
│                  │                 │                   │
│  [post text]     │  [post text]    │  [post text]      │
│  ~120 words      │  ~180 words     │  ~180 words       │
│                  │                 │                   │
│  Topic: AI tools │  Topic: VCs     │  Topic: Burnout   │
│                  │                 │                   │
│  Hook     ████▒  │  Hook    ███▒▒  │  Hook     █████  │
│  Clarity  ████▒  │  Clarity ████▒  │  Clarity  ████▒  │
│  Engage   █████  │  Engage  ███▒▒  │  Engage   ████▒  │
│  Score    8.4 ⭐ │  Score   7.2    │  Score    8.8 ⭐ │
│                  │                 │                   │
│  [🎙️ Edit]       │  [🎙️ Edit]      │  [🎙️ Edit]        │
│  [✅ Post Now]   │  [✅ Post Now]  │  [✅ Post Now]    │
│  [❌ Skip]       │  [❌ Skip]      │  [❌ Skip]        │
└──────────────────┴─────────────────┴───────────────────┘

COMPONENTS NEEDED:
- 3 columns with st.columns(3)
- Score bars: st.progress(score/10)
- Language toggle: st.toggle('हिं') → swaps content_en for content_hi
- Edit modal: pops up with mic + text input when Edit clicked
- Post button: calls /drafts/{id}/post API endpoint
- After post: show green success card with "View on LinkedIn →" link
```

---

## 🎙️ PHASE 3 — Walk & Talk
**Owner: You (Lambda) + Teammate 1 (UI) | Day 3–4**

### Exact Step-by-Step Flow:

```
1. Judge presses mic button → browser records audio (st.audio recorder)
2. Audio blob uploaded to S3: audio/{user_id}/{timestamp}.webm
3. Frontend calls POST /voice/transcribe with S3 key
4. voice_processor Lambda starts Transcribe job
5. Lambda polls until complete (synchronous for demo — max 15s for short audio)
6. Transcript returned → displayed on screen in real time
7. Lambda immediately calls generate_voice_post with transcript
8. Structured post appears below transcript
9. Judge can hit mic again to say "make it more casual" → edit loop
10. Judge hits Post → linkedin_post Lambda → success card
```

### `voice_processor` Lambda

```python
def handler(event, context):
    s3_key = event['s3_key']
    user_id = event['user_id']
    mode = event['mode']  # "transcribe" | "edit_command"
    current_draft = event.get('current_draft', None)
    
    # Start Transcribe job
    job_name = f"zeroclick-{user_id}-{int(time.time())}"
    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        MediaFormat='webm',
        Media={'MediaFileUri': f's3://zeroclick-demo/{s3_key}'},
        OutputBucketName='zeroclick-demo',
        OutputKey=f'transcripts/{user_id}/{job_name}.txt',
        LanguageCode='en-IN'   # handles Hinglish
    )
    
    # Poll until done (for demo — acceptable latency)
    while True:
        status = transcribe.get_transcription_job(
            TranscriptionJobName=job_name
        )['TranscriptionJob']['TranscriptionJobStatus']
        if status in ['COMPLETED', 'FAILED']:
            break
        time.sleep(2)
    
    # Read transcript from S3
    transcript = s3.get_object(...)['Body'].read().decode()
    
    if mode == "transcribe":
        # First pass — structure the voice note into a post
        return structure_voice_post(transcript, user_id)
    
    if mode == "edit_command":
        # Edit pass — apply the voice instruction to current draft
        return apply_edit(current_draft, transcript, user_id)
```

```python
VOICE_TO_POST_PROMPT = """
This is a raw voice note. The person is a LinkedIn creator.
Their style: {style_vector}

Transform this voice note into a LinkedIn post that:
- Keeps their exact words and phrasing wherever possible
- Structures it naturally — don't over-polish it
- Preserves Hinglish if they used it
- Keeps their authentic messiness — don't sanitize

Voice note: "{transcript}"

Return ONLY the post. No explanation.
"""

EDIT_PROMPT = """
Current LinkedIn post draft:
"{current_draft}"

The creator wants this change: "{edit_instruction}"

Apply ONLY that change. Keep everything else exactly the same.
Return ONLY the updated post. No explanation.
"""
```

### Teammate 1 builds — Screen 3 (Walk & Talk spec):

```
SCREEN LAYOUT:
┌─────────────────────────────────────────┐
│  🎙️ Walk & Talk                         │
│  "Just talk. We'll make it a post."     │
│                                         │
│  [       🎙️ BIG MIC BUTTON            ]│
│  [    Tap to speak, tap to stop        ]│
│  [    pulsing animation while active   ]│
│                                         │
│  ── Transcript ────────────────────────│
│  "Bhai aaj office mein jo hua..."      │
│  [live text streams in as it arrives]  │
│                                         │
│  ── Your Post ─────────────────────────│
│  [Generated post appears here]          │
│                                         │
│  [🎙️ Edit by voice]  [📝 Edit by text] │
│  [📊 Score This]                       │
│  [✅ Post to LinkedIn]                 │
└─────────────────────────────────────────┘

COMPONENTS NEEDED:
- audio_recorder component (use streamlit-audiorecorder library)
- st.empty() placeholder for streaming transcript
- st.spinner() during generation
- Reuse score card component from Screen 2
- Reuse post success card from Screen 2
```

---

## 🔗 PHASE 4 — LinkedIn Integration
**Owner: You | Day 5 | 3 hours max**

```python
# Pre-setup (Day 1): 
# Go to LinkedIn Developer Portal
# Create app → get client_id, client_secret
# Do OAuth flow manually ONCE to get your access_token
# Store access_token in DynamoDB users table for demo_user_001
# This token lasts 60 days — plenty for the hackathon

def linkedin_post(draft_text: str, access_token: str) -> dict:
    response = requests.post(
        "https://api.linkedin.com/v2/ugcPosts",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json={
            "author": f"urn:li:person:{LINKEDIN_PERSON_ID}",
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {"text": draft_text},
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }
    )
    
    post_id = response.json().get('id', '')
    post_url = f"https://www.linkedin.com/feed/update/{post_id}"
    
    # Update DynamoDB
    update_draft_status(draft_id, 'posted', post_id)
    
    return {"success": True, "post_url": post_url}

# UI response after posting:
# ✅ Posted to LinkedIn!
# [View Post →]  ← clickable link to actual LinkedIn post
```

---

## 🎨 PHASE 5 — Style Profile Screen + Polish
**Owner: Teammate 1 (UI) + You (wire-up) | Day 5**

```
SCREEN 4 — My Style DNA:
┌──────────────────────────────────────┐
│  🎭 Your Style Profile               │
│                                      │
│  Tone         Conversational + wit   │
│  Emojis       Rarely                 │
│  Sentences    Short & punchy         │
│  Language     Hinglish               │
│  Opener       Rhetorical question    │
│  Topics       AI · Startups          │
│  Avoid        Corporate jargon       │
│                                      │
│  📊 Posts this session: 3            │
│  ✅ Posted: 2  ❌ Skipped: 1         │
│                                      │
│  [🔄 Retrain My Style]               │
└──────────────────────────────────────┘
```

---

## 📅 6-Day Schedule

| Day | You | Teammate 1 | Teammate 2 | Teammate 3 |
|-----|-----|------------|------------|------------|
| **1** | Phase 0: full infra, all Lambda skeletons, API Gateway, get Bedrock hello-world working | Set up Streamlit project, App Runner deploy, Screen 1 layout (no logic yet) | Write + test onboarding system prompt — iterate until Style Card output looks great | Set up DynamoDB tables, S3 bucket, all env vars. Test Transcribe with a sample audio file |
| **2** | onboarding_chat + style_extractor Lambda complete. Wire to API Gateway. Test end-to-end | Connect Screen 1 to real API. Confidence meter working. Style Card renders real data | Write + test all 3 draft generation sub-prompts. Run 20+ test generations. Fix weak outputs | Test full onboarding flow. Log all bugs. Start README outline |
| **3** | fetch_trends + generate_drafts + score_drafts Lambda complete | Screen 2 Drafts Dashboard — all 3 cards, score bars, language toggle | Write + test score_drafts prompt. Calibrate scoring (make sure scores feel accurate) | Test draft generation end-to-end. Verify scores make sense. Stress test with different styles |
| **4** | voice_processor + structure_voice_post Lambda. Walk & Talk end-to-end working | Screen 3 Walk & Talk — mic button, transcript display, post display, edit loop | Write + test voice-to-post prompt. Test with Hinglish audio. Fix weird transcript artifacts | Test Walk & Talk with real voice recordings. Try Hinglish. Find edge cases |
| **5** | LinkedIn OAuth token setup. linkedin_post Lambda. Wire approve & post flow | Screen 4 Style Profile. Wire Post button to LinkedIn Lambda. Success card UI | Final prompt polish across all features. Write project summary + problem statement | End-to-end full demo run. List all broken things. Fix blockers. Start demo video script |
| **6** | Bug fixes, edge cases, final Lambda tweaks | UI polish — spacing, colors, loading states, error messages | README final version. Architecture diagram. Project summary for submission | Record demo video (3 min max). Edit video. Final submission package |

---

## 🎬 Demo Video Script (3 minutes)

```
0:00–0:20  Problem: "Every LinkedIn creator faces this. 
            Generic AI tools don't know how YOU write."

0:20–0:50  Onboarding: Show 60-second chat → Style Card reveal
           Narrate: "ZeroClick learns your voice in 60 seconds"

0:50–1:30  Drafts Dashboard: Show 3 cards with scores
           Switch language toggle EN → HI
           Narrate: "Three drafts. Three different angles. 
                     Already scored. Already personalized."

1:30–2:00  Walk & Talk: Record a 15-second Hinglish voice rant
           Watch transcript appear → post appears
           Narrate: "No typing. Just talk."

2:00–2:30  Post to LinkedIn: Hit Post on the best draft
           Show the green success card + View on LinkedIn link
           Narrate: "One click. That's it. You're done."

2:30–3:00  Architecture slide: Show AWS services diagram
           Narrate: "Built on 10 AWS services. 
                     Fully serverless. Under $15/month."
```

---

## 📋 Submission Checklist

- [ ] GitHub repo — clean README, setup instructions, architecture diagram
- [ ] Working prototype URL (App Runner) — pre-seeded demo account ready
- [ ] Demo video — 3 min, follows script above
- [ ] Project summary — lead with "Writer to Approver" framing
- [ ] Problem statement — 4 pain points from your slide deck
- [ ] LinkedIn OAuth token set up and stored in DynamoDB
- [ ] Tested full flow on the live URL at least 3 times before submitting
