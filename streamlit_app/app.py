import requests

BASE_URL = "https://zxjdh4vana.execute-api.us-east-1.amazonaws.com"


def setup_user(user_id, email, language, interests):

    r = requests.post(
        f"{BASE_URL}/setup",
        json={
            "user_id": user_id,
            "email": email,
            "language": language,
            "interests": interests
        }
    )

    return r.json()


def generate_from_idea(user_id, idea):

    r = requests.post(
        f"{BASE_URL}/drafts/generate-from-idea",
        json={
            "user_id": user_id,
            "idea": idea
        }
    )

    return r.json()


def generate_trend_post(user_id, topic=None):

    payload = {"user_id": user_id}

    if topic:
        payload["topic"] = topic

    r = requests.post(
        f"{BASE_URL}/posts/from-trend",
        json=payload
    )

    return r.json()


def generate_voice_post(user_id, s3_key):

    r = requests.post(
        f"{BASE_URL}/posts/from-voice",
        json={
            "user_id": user_id,
            "s3_key": s3_key
        }
    )

    return r.json()