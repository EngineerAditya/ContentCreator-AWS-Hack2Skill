import streamlit as st
import os
from zc_api import *

# ─────────────────────────────────
# PAGE CONFIG (must be first)
# ─────────────────────────────────
st.set_page_config(
    page_title="ZeroClick",
    page_icon="⚡",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# ─────────────────────────────────
# LOAD CSS
# ─────────────────────────────────
css_path = os.path.join(os.path.dirname(__file__), "style.css")
with open(css_path) as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

# ─────────────────────────────────
# SESSION STATE DEFAULTS
# ─────────────────────────────────
defaults = {
    "logged_in": False,
    "user_id": None,
    "user_name": "",
    "user_email": "",
    "user_interests": [],
    "profile_complete": False,
    "auth_mode": "login",  # "login" or "register"
    "current_nav": "Home",
    "voice_counter": 0,
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v


# ─────────────────────────────────
# HELPER: image render
# ─────────────────────────────────
def render_image(url):
    if url and isinstance(url, str) and url.startswith("http"):
        st.image(url, use_container_width=True)


# ══════════════════════════════════════════
#  PAGE 1: AUTH (Login / Register)
# ══════════════════════════════════════════
def render_auth_page():
    # Logo
    st.markdown("""
    <div style='text-align:center; padding: 40px 0 10px;'>
        <h1 style='color:#0EA5E9; font-size:42px; margin:0;'>⚡ ZeroClick</h1>
        <p style='color:#64748B; font-size:16px; margin-top:8px;'>Voice → Idea → LinkedIn Post in seconds</p>
    </div>
    """, unsafe_allow_html=True)

    # Auth card
    st.markdown("<div style='max-width:440px; margin:20px auto; background:#1E293B; padding:36px; border-radius:16px; border:1px solid #334155;'>", unsafe_allow_html=True)

    # Tabs
    c1, c2 = st.columns(2)
    with c1:
        if st.button("Login", use_container_width=True,
                      type="primary" if st.session_state.auth_mode == "login" else "secondary",
                      key="auth_login_tab"):
            st.session_state.auth_mode = "login"
            st.rerun()
    with c2:
        if st.button("Register", use_container_width=True,
                      type="primary" if st.session_state.auth_mode == "register" else "secondary",
                      key="auth_register_tab"):
            st.session_state.auth_mode = "register"
            st.rerun()

    st.markdown("<br>", unsafe_allow_html=True)

    if st.session_state.auth_mode == "register":
        _render_register_form()
    else:
        _render_login_form()

    st.markdown("</div>", unsafe_allow_html=True)


def _render_login_form():
    email = st.text_input("Email", placeholder="you@example.com", key="login_email")
    password = st.text_input("Password", type="password", placeholder="••••••••", key="login_password")

    st.markdown("<br>", unsafe_allow_html=True)

    if st.button("Sign In →", use_container_width=True, type="primary", key="login_submit"):
        if not email or not password:
            st.error("Please fill in both fields")
            return

        with st.spinner("Signing in..."):
            res = login_user(email.strip(), password)

        if res.get("success") and res.get("user"):
            user = res["user"]
            st.session_state.logged_in = True
            st.session_state.user_id = user["user_id"]
            st.session_state.user_name = user.get("name", "Creator")
            st.session_state.user_email = user.get("email", email)
            st.session_state.user_interests = user.get("interests", [])
            st.session_state.user_language = user.get("language_preference", "en")
            st.session_state.user_writing_style = user.get("writing_style", ["Professional"])
            st.session_state.user_audience = user.get("audience", "General")
            # Returning user — always skip profile setup
            st.session_state.profile_complete = True
            st.rerun()
        else:
            st.error(res.get("error", "Login failed. Check your credentials."))


def _render_register_form():
    name = st.text_input("Full Name", placeholder="Aditya", key="reg_name")
    email = st.text_input("Email", placeholder="you@example.com", key="reg_email")
    password = st.text_input("Password", type="password", placeholder="Min 6 characters", key="reg_password")

    st.markdown("<br>", unsafe_allow_html=True)

    if st.button("Create Account →", use_container_width=True, type="primary", key="reg_submit"):
        if not name or not email or not password:
            st.error("All fields are required")
            return
        if len(password) < 6:
            st.error("Password must be at least 6 characters")
            return

        with st.spinner("Creating account..."):
            res = register_user(email.strip(), password, name.strip())

        if res.get("success") and res.get("user"):
            user = res["user"]
            st.session_state.logged_in = True
            st.session_state.user_id = user["user_id"]
            st.session_state.user_name = user.get("name", name)
            st.session_state.user_email = user.get("email", email)
            st.session_state.profile_complete = False
            st.rerun()
        else:
            st.error(res.get("error", "Registration failed. Try a different email."))


# ══════════════════════════════════════════
#  PAGE 2: PROFILE SETUP (after register)
# ══════════════════════════════════════════
def render_profile_setup():
    st.markdown(f"""
    <div style='text-align:center; padding:30px 0 5px;'>
        <h2 style='color:white; margin:0;'>Create Your Creator Profile</h2>
        <p style='color:#94A3B8; margin-top:8px;'>Tell us about yourself to personalize your AI drafts</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<div style='max-width:560px; margin:20px auto; background:#1E293B; padding:36px; border-radius:16px; border:1px solid #334155;'>", unsafe_allow_html=True)

    role = st.text_input("Role / Profession", placeholder="e.g. Founder, Developer, Marketer", key="setup_role")
    industry = st.text_input("Industry", placeholder="e.g. Tech, SaaS, Finance", key="setup_industry")

    st.markdown("<p style='color:#F8FAFC; font-size:14px; margin:20px 0 5px;'>Target Audience</p>", unsafe_allow_html=True)
    audience = st.selectbox("Audience", ["Founders", "Developers", "Marketers", "Students", "General"], label_visibility="collapsed", key="setup_audience")

    st.markdown("<p style='color:#F8FAFC; font-size:14px; margin:20px 0 5px;'>Preferred Language</p>", unsafe_allow_html=True)
    language = st.selectbox("Language", [
        ("English", "en"),
        ("Hindi", "hi"),
        ("Kannada", "kn"),
        ("Tamil", "ta"),
        ("Malayalam", "ml"),
        ("English + Hindi", "en+hi"),
        ("English + Kannada", "en+kn"),
        ("English + Tamil", "en+ta"),
        ("English + Malayalam", "en+ml"),
    ], format_func=lambda x: x[0], label_visibility="collapsed", key="setup_lang")

    st.markdown("<p style='color:#F8FAFC; font-size:14px; margin:20px 0 5px;'>Writing Style</p>", unsafe_allow_html=True)
    writing_styles = st.multiselect("Style", ["Professional", "Witty", "Storytelling", "Educational", "Motivational", "Opinionated"],
                                      default=["Professional"], label_visibility="collapsed", key="setup_style")

    st.markdown("<p style='color:#F8FAFC; font-size:14px; margin:20px 0 5px;'>Topics You Post About</p>", unsafe_allow_html=True)
    interests = st.multiselect("Interests", ["Tech", "AI", "Startups", "Career", "Finance", "Marketing", "Leadership", "Productivity", "Design", "Web3"],
                                 default=["Tech", "AI"], label_visibility="collapsed", key="setup_interests")

    st.markdown("<br><br>", unsafe_allow_html=True)

    if st.button("Create My AI Profile ⚡", use_container_width=True, type="primary", key="setup_submit"):
        with st.spinner("Setting up your profile..."):
            combined_interests = interests + ([role] if role else []) + ([industry] if industry else [])
            res = setup_user(
                user_id=st.session_state.user_id,
                email=st.session_state.user_email,
                language=language[1],  # code part of tuple
                interests=combined_interests,
                name=st.session_state.user_name,
                role=role,
                audience=audience,
                writing_style=writing_styles,
            )

        st.session_state.user_interests = interests
        st.session_state.profile_complete = True
        st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)


# ══════════════════════════════════════════
#  PAGE 3: MAIN DASHBOARD
# ══════════════════════════════════════════
def render_dashboard():
    # ── Header ──
    st.markdown(f"""
    <div style='display:flex; justify-content:space-between; align-items:center; padding:10px 0 5px;'>
        <h3 style='color:#0A66C2; margin:0; font-size:28px;'>⚡ ZeroClick</h3>
        <span style='color:#94A3B8; font-size:15px;'>Hi, {st.session_state.user_name} 👋</span>
    </div>
    <hr style='border-color:#1E293B; margin:5px 0 25px;'>
    """, unsafe_allow_html=True)

    # ── Content area ──
    nav = st.session_state.current_nav
    if nav == "Home":
        _page_home()
    elif nav == "Record":
        _page_voice()
    elif nav == "Ideas":
        _page_idea()
    elif nav == "News":
        _page_news()
    elif nav == "Profile":
        _page_profile()


# ─────────────────────────────────
# HOME — Clean 5-button dashboard
# ─────────────────────────────────
def _nav_card(icon, title, subtitle, key):
    """Renders a clickable card and returns True if clicked."""
    st.markdown(f"""
    <div style='background:#1E293B; border-radius:14px; padding:22px 20px; border:1px solid #334155;
                cursor:pointer; transition:all 0.2s; margin-bottom:4px;'
         onmouseover="this.style.borderColor='#0A66C2'; this.style.transform='translateY(-2px)'"
         onmouseout="this.style.borderColor='#334155'; this.style.transform='translateY(0)'">
        <div style='font-size:28px; margin-bottom:10px;'>{icon}</div>
        <p style='color:#F8FAFC; font-size:16px; font-weight:600; margin:0 0 4px;'>{title}</p>
        <p style='color:#64748B; font-size:13px; margin:0;'>{subtitle}</p>
    </div>
    """, unsafe_allow_html=True)
    return st.button(f"Open {title}", use_container_width=True, key=key, type="secondary")


def _page_home():
    st.markdown("""
    <p style='color:#94A3B8; font-size:15px; margin-bottom:25px;'>What would you like to create today?</p>
    """, unsafe_allow_html=True)

    # Row 1: Record + Ideas
    c1, c2 = st.columns(2)
    with c1:
        if _nav_card("🎤", "Voice → Post", "Speak an idea, get a post", "home_record"):
            st.session_state.current_nav = "Record"
            st.rerun()
    with c2:
        if _nav_card("💡", "Idea → Post", "Type a thought, get a post", "home_ideas"):
            st.session_state.current_nav = "Ideas"
            st.rerun()

    # Row 2: News + Profile
    c3, c4 = st.columns(2)
    with c3:
        if _nav_card("📰", "News → Post", "React to trending news", "home_news"):
            st.session_state.current_nav = "News"
            st.rerun()
    with c4:
        if _nav_card("👤", "My Profile", "View & edit your profile", "home_profile"):
            st.session_state.current_nav = "Profile"
            st.rerun()

    st.markdown("<br><hr style='border-color:#1E293B;'><br>", unsafe_allow_html=True)

    # ── Approved Posts Feed ──
    st.markdown("<h4 style='color:white; margin-bottom:15px;'>📚 My Approved Posts</h4>", unsafe_allow_html=True)
    
    with st.spinner("Loading posts..."):
        res = get_approved_posts(st.session_state.user_id)
        
    posts = res.get("posts", [])
    
    if not posts:
        st.markdown("<p style='color:#64748B; text-align:center; padding:20px;'>You don't have any approved posts yet. Create one above!</p>", unsafe_allow_html=True)
    else:
        # Sort newest first based on created_at
        posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        
        for p in posts:
            st.markdown("""
            <div style='background:#1E293B; border-radius:14px; padding:20px; border:1px solid #334155; margin-bottom:15px;'>
                <div style='display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;'>
                    <span style='background:rgba(14,165,233,0.12); color:#0EA5E9; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600;'>LinkedIn Draft</span>
                </div>
            """, unsafe_allow_html=True)
            
            # Use expander so long posts don't clutter the feed out of control
            with st.expander(f"{p.get('content_primary', 'Draft')[:60]}..."):
                st.write(p.get("content_primary", ""))
                
                img_url = p.get("image_url")
                if img_url:
                    try:
                        st.image(get_presigned_url(img_url), use_container_width=True)
                    except Exception:
                        pass
                
                if p.get("transcript"):
                    st.markdown("**Original Voice Transcript:**")
                    st.write(p.get("transcript"))
            
            st.markdown("</div>", unsafe_allow_html=True)

    # Back-to-home hint on sub-pages
    if st.session_state.current_nav != "Home":
        pass  # sub-pages handle themselves


# ─────────────────────────────────
# VOICE → POST
# ─────────────────────────────────
def _back_button():
    if st.button("← Home", key="back_home", type="secondary"):
        st.session_state.current_nav = "Home"
        st.rerun()

def _page_voice():
    _back_button()
    st.markdown("<h4 style='color:white; margin-bottom:5px;'>🎤 Speak → LinkedIn Post</h4>", unsafe_allow_html=True)
    st.markdown("<p style='color:#94A3B8; font-size:14px;'>Record a voice note and AI will turn it into a polished LinkedIn post.</p>", unsafe_allow_html=True)

    # ── If we already have a generated post, show the card ──
    if st.session_state.get("voice_result"):
        _render_post_card(st.session_state.voice_result)
        return

    # ── Otherwise show the recorder ──
    audio_data = st.audio_input("Record your voice", key=f"voice_{st.session_state.voice_counter}")

    if audio_data:
        st.audio(audio_data)
        if st.button("Generate Post ⚡", type="primary", use_container_width=True, key="voice_gen_btn"):
            s3_key = f"audio/{st.session_state.user_id}/voice_{st.session_state.voice_counter}.wav"

            with st.spinner("📤 Uploading audio..."):
                try:
                    upload_audio_to_s3(audio_data.getvalue(), s3_key)
                except Exception as e:
                    st.error(f"Upload failed: {e}")
                    return

            with st.spinner("🧠 Transcribing & generating post..."):
                res = generate_voice_post(st.session_state.user_id, s3_key)

            if res.get("content_primary"):
                # Convert S3 image URL to presigned
                img = get_presigned_url(res.get("image_url"))
                st.session_state.voice_result = {
                    "post_id": res.get("post_id", ""),
                    "transcript": res.get("transcript", ""),
                    "content": res["content_primary"],
                    "image_url": img,
                    "source": "voice"
                }
                st.rerun()
            else:
                st.error(res.get("error", "Something went wrong. Try again."))


def _render_post_card(result, card_key="voice"):
    """Renders a generated post as a premium editable card with approve/reject."""
    st.success("✅ Post generated!")

    # Transcript expander (voice only)
    if result.get("transcript"):
        with st.expander("📝 View Transcript", expanded=False):
            st.write(result["transcript"])

    # News sources expander
    if result.get("articles_used"):
        with st.expander("📰 Sources Used", expanded=False):
            for a in result["articles_used"]:
                st.markdown(f"• **{a.get('headline', a.get('title', 'Article'))}**")

    # ── Card header ──
    st.markdown("""
    <div style='background:#1E293B; border-radius:16px 16px 0 0; padding:20px 24px 12px; border:1px solid #334155; border-bottom:none; margin-top:10px;'>
        <div style='display:flex; justify-content:space-between; align-items:center;'>
            <span style='background:rgba(10,102,194,0.12); color:#0A66C2; padding:5px 14px; border-radius:20px; font-size:13px; font-weight:600;'>✨ AI Generated</span>
            <span style='color:#64748B; font-size:13px;'>LinkedIn Post</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # ── Image (if available) ──
    if result.get("image_url"):
        try:
            st.image(result["image_url"], use_container_width=True)
        except Exception:
            pass

    # ── Editable text ──
    edited_content = st.text_area(
        "Edit your post before approving",
        value=result["content"],
        height=200,
        key=f"{card_key}_post_editor",
        label_visibility="collapsed"
    )

    # ── Action buttons ──
    c1, c2, c3 = st.columns(3)

    # Map source to session state key
    state_key = f"{result.get('source', card_key)}_result"

    with c1:
        if st.button("✅ Approve", use_container_width=True, type="primary", key=f"{card_key}_approve"):
            with st.spinner("Saving..."):
                approve_post(
                    user_id=st.session_state.user_id,
                    post_id=result.get("post_id", ""),
                    content=edited_content,
                    image_url=result.get("image_url", "")
                )
            st.session_state[state_key] = None
            st.success("🎉 Post approved and saved!")
            st.balloons()
            import time; time.sleep(1.5)
            st.rerun()
    with c2:
        if st.button("🔄 Regenerate", use_container_width=True, key=f"{card_key}_regen"):
            st.session_state[state_key] = None
            st.rerun()
    with c3:
        if st.button("❌ Reject", use_container_width=True, key=f"{card_key}_reject"):
            st.session_state[state_key] = None
            st.rerun()

    # ── Download ──
    st.download_button("📥 Download Post", edited_content, file_name="linkedin_post.txt",
                       use_container_width=True, key=f"{card_key}_download")


# ─────────────────────────────────
# IDEA → POST
# ─────────────────────────────────
def _page_idea():
    _back_button()
    st.markdown("<h4 style='color:white; margin-bottom:5px;'>💡 Idea → LinkedIn Post</h4>", unsafe_allow_html=True)
    st.markdown("<p style='color:#94A3B8; font-size:14px;'>Type a raw idea and AI converts it into a structured, engaging post.</p>", unsafe_allow_html=True)

    if st.session_state.get("idea_result"):
        _render_post_card(st.session_state.idea_result, card_key="idea")
        if st.button("💡 Write Another", use_container_width=True, key="idea_new"):
            st.session_state.idea_result = None
            st.rerun()
        return

    idea = st.text_area("Your idea", height=150, placeholder="e.g. AI is making junior dev roles obsolete faster than we think...", key="idea_input", label_visibility="collapsed")

    if st.button("Generate Post ⚡", type="primary", use_container_width=True, key="idea_gen_btn"):
        if not idea:
            st.warning("Type an idea first")
            return

        with st.spinner("🧠 Generating post..."):
            res = generate_from_idea(st.session_state.user_id, idea)

        if res.get("content"):
            img = get_presigned_url(res.get("image_url"))
            st.session_state.idea_result = {
                "post_id": res.get("post_id", ""),
                "content": res["content"],
                "image_url": img,
                "source": "idea"
            }
            st.rerun()
        else:
            st.error(res.get("error", "Something went wrong. Try again."))


# ─────────────────────────────────
# NEWS → POST
# ─────────────────────────────────
def _page_news():
    _back_button()
    st.markdown("<h4 style='color:white; margin-bottom:5px;'>🔥 Trending News → Post</h4>", unsafe_allow_html=True)
    st.markdown("<p style='color:#94A3B8; font-size:14px;'>Enter a topic and AI will find the latest news and write a commentary post.</p>", unsafe_allow_html=True)

    if st.session_state.get("news_result"):
        _render_post_card(st.session_state.news_result, card_key="news")
        if st.button("📰 Write Another", use_container_width=True, key="news_new"):
            st.session_state.news_result = None
            st.rerun()
        return

    topic = st.text_input("Topic", placeholder="e.g. AI regulation, startup layoffs, OpenAI", key="news_topic", label_visibility="collapsed")

    if st.button("Generate News Post ⚡", type="primary", use_container_width=True, key="news_gen_btn"):
        with st.spinner("📡 Fetching news & generating post..."):
            res = generate_trend_post(st.session_state.user_id, topic)

        if res.get("content"):
            img = get_presigned_url(res.get("image_url"))
            st.session_state.news_result = {
                "post_id": res.get("post_id", ""),
                "content": res["content"],
                "image_url": img,
                "articles_used": res.get("articles_used", []),
                "source": "news"
            }
            st.rerun()
        else:
            st.error(res.get("error", "Something went wrong. Try again."))


# ─────────────────────────────────
# PROFILE PAGE
# ─────────────────────────────────
def _page_profile():
    _back_button()
    st.markdown("<h4 style='color:white;'>👤 My Profile</h4>", unsafe_allow_html=True)
    st.markdown("<p style='color:#94A3B8; font-size:14px; margin-bottom:20px;'>Edit your profile to change how AI generates your posts.</p>", unsafe_allow_html=True)

    # ── Editable fields ──
    st.markdown("<div style='background:#1E293B; padding:28px; border-radius:14px; border:1px solid #334155;'>", unsafe_allow_html=True)

    new_name = st.text_input("Name", value=st.session_state.user_name, key="profile_name")

    st.markdown("<p style='color:#94A3B8; font-size:13px; margin:0 0 2px;'>EMAIL (read-only)</p>", unsafe_allow_html=True)
    st.markdown(f"<p style='color:#64748B; font-size:14px; margin:0 0 16px;'>{st.session_state.user_email}</p>", unsafe_allow_html=True)

    lang_options = [
        ("English", "en"), ("Hindi", "hi"), ("Kannada", "kn"),
        ("Tamil", "ta"), ("Malayalam", "ml"),
        ("English + Hindi", "en+hi"), ("English + Kannada", "en+kn"),
        ("English + Tamil", "en+ta"), ("English + Malayalam", "en+ml"),
    ]
    current_lang = st.session_state.get("user_language", "en")
    lang_idx = next((i for i, l in enumerate(lang_options) if l[1] == current_lang), 0)
    new_lang = st.selectbox("Post Language", lang_options, index=lang_idx, format_func=lambda x: x[0], key="profile_lang")

    style_options = ["Professional", "Witty", "Storytelling", "Educational", "Motivational", "Opinionated"]
    saved_styles = st.session_state.get("user_writing_style", ["Professional"])
    if isinstance(saved_styles, str):
        saved_styles = [saved_styles]
    valid_styles = [s for s in saved_styles if s in style_options] or ["Professional"]
    new_style = st.multiselect("Writing Style", style_options, default=valid_styles, key="profile_style")

    interest_options = ["Tech", "AI", "Startups", "Career", "Finance", "Marketing", "Leadership", "Productivity", "Design", "Web3"]
    saved_interests = st.session_state.get("user_interests", ["Tech", "AI"])
    if isinstance(saved_interests, str):
        saved_interests = [saved_interests]
    valid_interests = [i for i in saved_interests if i in interest_options] or ["Tech", "AI"]
    new_interests = st.multiselect("Topics You Post About", interest_options, default=valid_interests, key="profile_interests")

    new_audience = st.selectbox(
        "Target Audience",
        ["Founders", "Developers", "Marketers", "Students", "General"],
        index=["Founders", "Developers", "Marketers", "Students", "General"].index(
            st.session_state.get("user_audience", "General")
        ),
        key="profile_audience"
    )

    st.markdown("</div>", unsafe_allow_html=True)
    st.markdown("<br>", unsafe_allow_html=True)

    c1, c2 = st.columns(2)
    with c1:
        if st.button("💾 Save Changes", use_container_width=True, type="primary", key="profile_save"):
            with st.spinner("Saving..."):
                res = setup_user(
                    user_id=st.session_state.user_id,
                    email=st.session_state.user_email,
                    language=new_lang[1],
                    interests=new_interests,
                    name=new_name,
                    audience=new_audience,
                    writing_style=new_style,
                )
            # Update session state
            st.session_state.user_name = new_name
            st.session_state.user_language = new_lang[1]
            st.session_state.user_writing_style = new_style
            st.session_state.user_interests = new_interests
            st.session_state.user_audience = new_audience
            st.success("✅ Profile updated!")
    with c2:
        if st.button("🚪 Logout", use_container_width=True, key="logout_btn"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()


# ══════════════════════════════════════════
#  ROUTER
# ══════════════════════════════════════════
if not st.session_state.logged_in:
    render_auth_page()
elif not st.session_state.profile_complete:
    render_profile_setup()
else:
    render_dashboard()