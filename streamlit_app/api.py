import requests

BASE_URL = "https://zxjdh4vana.execute-api.us-east-1.amazonaws.com"


def call_api(endpoint, payload, timeout=60):

    try:

        r = requests.post(
            f"{BASE_URL}/{endpoint}",
            json=payload,
            timeout=timeout
        )

        if r.status_code != 200:

            return {
                "error": f"API error {r.status_code}",
                "details": r.text
            }

        return r.json()

    except Exception as e:

        return {"error": str(e)}


# -------------------------
# Setup user
# -------------------------

def setup_user(user_id, email, language, interests):

    payload = {
        "user_id": user_id,
        "email": email,
        "language": language,
        "interests": interests
    }

    return call_api("setup", payload)


# -------------------------
# Idea → Post
# -------------------------

def generate_from_idea(user_id, idea):

    payload = {
        "user_id": user_id,
        "idea": idea
    }

    return call_api(
        "drafts/generate-from-idea",
        payload
    )


# -------------------------
# Trend → Post
# -------------------------

def generate_trend_post(user_id, topic=None):

    payload = {
        "user_id": user_id
    }

    if topic:
        payload["topic"] = topic

    return call_api(
        "posts/from-trend",
        payload
    )


# -------------------------
# Voice → Post
# -------------------------

def generate_voice_post(user_id, s3_key):

    payload = {
        "user_id": user_id,
        "s3_key": s3_key
    }

    return call_api(
        "posts/from-voice",
        payload,
        timeout=120
    )