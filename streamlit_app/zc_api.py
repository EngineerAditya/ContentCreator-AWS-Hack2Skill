import os
import requests
import boto3
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv(
    "API_URL",
    "https://zxjdh4vana.execute-api.us-east-1.amazonaws.com"
)

# Lazy-load S3 client to ensure secrets are available at call-time
def get_s3_client():
    bucket = os.environ.get("S3_BUCKET", "zeroclick-voice-256766085533")
    region = os.environ.get("AWS_REGION", "us-east-1")
    
    access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")

    # If not in env, check Streamlit secrets comprehensively
    try:
        if not access_key and getattr(st, "secrets", None):
            bucket = st.secrets.get("S3_BUCKET", bucket)
            region = st.secrets.get("AWS_REGION", region)
            
            # Check standard uppercase
            access_key = st.secrets.get("AWS_ACCESS_KEY_ID")
            secret_key = st.secrets.get("AWS_SECRET_ACCESS_KEY")
            
            # Check lowercase
            if not access_key:
                access_key = st.secrets.get("aws_access_key_id")
                secret_key = st.secrets.get("aws_secret_access_key")
                
            # Check nested under [default] exactly as user might have pasted from cat ~/.aws/credentials
            if not access_key and "default" in st.secrets:
                access_key = st.secrets["default"].get("aws_access_key_id")
                secret_key = st.secrets["default"].get("aws_secret_access_key")
    except Exception:
        pass

    if access_key and secret_key:
        return boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key
        ), bucket
    else:
        # Fallback to default credential chain
        return boto3.client("s3", region_name=region), bucket


# -------------------------
# Core API caller
# -------------------------
def call_api(endpoint, payload, timeout=60):
    try:
        r = requests.post(
            f"{BASE_URL}/{endpoint}",
            json=payload,
            timeout=timeout
        )

        data = r.json()

        if not isinstance(data, dict):
            # Sometimes API Gateway wraps body as string
            if isinstance(data, str):
                import json
                data = json.loads(data)

        # If the Lambda returned a body field (API Gateway proxy format)
        if "body" in data and isinstance(data["body"], str):
            import json
            data = json.loads(data["body"])

        return data

    except requests.exceptions.Timeout:
        return {"error": "Request timeout — try again"}
    except Exception as e:
        return {"error": str(e)}


# -------------------------
# Auth: Register
# -------------------------
def register_user(email, password, name):
    return call_api("setup", {
        "action": "register",
        "email": email,
        "password": password,
        "name": name
    })


# -------------------------
# Auth: Login
# -------------------------
def login_user(email, password):
    return call_api("setup", {
        "action": "login",
        "email": email,
        "password": password
    })


# -------------------------
# Setup / Update profile
# -------------------------
def setup_user(user_id, email, language, interests, name="", role="", audience="", writing_style=None, emoji_pref=""):
    payload = {
        "action": "setup",
        "user_id": user_id,
        "email": email,
        "language": language,
        "interests": interests,
    }
    if name:
        payload["name"] = name
    if role:
        payload["role"] = role
    if audience:
        payload["audience"] = audience
    if writing_style:
        payload["writing_style"] = writing_style
    if emoji_pref:
        payload["emoji_pref"] = emoji_pref
    return call_api("setup", payload)


# -------------------------
# Idea → Post
# -------------------------
def generate_from_idea(user_id, idea):
    return call_api(
        "drafts/generate-from-idea",
        {"user_id": user_id, "idea": idea}
    )


# -------------------------
# Trend → Post
# -------------------------
def generate_trend_post(user_id, topic=None):
    payload = {"user_id": user_id}
    if topic:
        payload["topic"] = topic
    return call_api("posts/from-trend", payload)


# -------------------------
# Voice → Post
# -------------------------
def generate_voice_post(user_id, s3_key):
    return call_api(
        "posts/from-voice",
        {"user_id": user_id, "s3_key": s3_key},
        timeout=180
    )


# -------------------------
# Upload audio to S3
# -------------------------
def upload_audio_to_s3(audio_bytes, s3_key):
    try:
        s3_client, bucket_name = get_s3_client()
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=audio_bytes,
            ContentType="audio/wav"
        )
        return s3_key
    except Exception as e:
        raise RuntimeError(f"S3 upload failed: {e}")


# -------------------------
# Get presigned URL for S3 images
# -------------------------
def get_presigned_url(s3_url):
    """Convert an S3 URL to a presigned URL so the browser can load it."""
    if not s3_url or not isinstance(s3_url, str):
        return None
    try:
        s3_client, default_bucket = get_s3_client()
        # Extract bucket and key from URL like https://bucket.s3.amazonaws.com/key
        if ".s3.amazonaws.com/" in s3_url:
            parts = s3_url.split(".s3.amazonaws.com/", 1)
            bucket = parts[0].replace("https://", "").replace("http://", "")
            key = parts[1]
        elif "s3.amazonaws.com/" in s3_url:
            path = s3_url.split("s3.amazonaws.com/", 1)[1]
            bucket = path.split("/", 1)[0]
            key = path.split("/", 1)[1]
        else:
            return s3_url  # Not an S3 URL, return as-is

        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=3600
        )
        return url
    except Exception as e:
        print(f"Presign error: {e}")
        return s3_url


# -------------------------
# Approve / Save post
# -------------------------
def approve_post(user_id, post_id, content, image_url=""):
    return call_api("setup", {
        "action": "approve_post",
        "user_id": user_id,
        "post_id": post_id,
        "content": content,
        "image_url": image_url
    })


# -------------------------
# Get Approved Posts
# -------------------------
def get_approved_posts(user_id):
    return call_api("setup", {
        "action": "get_posts",
        "user_id": user_id
    })


# -------------------------
# EventBridge Suggestions API
# -------------------------
def get_suggestions():
    return call_api("suggestions", {
        "action": "get"
    })

def approve_suggestion(suggestion_id):
    return call_api("suggestions", {
        "action": "approve",
        "suggestion_id": suggestion_id
    })

def reject_suggestion(suggestion_id):
    return call_api("suggestions", {
        "action": "reject",
        "suggestion_id": suggestion_id
    })

def edit_suggestion(suggestion_id, content):
    return call_api("suggestions", {
        "action": "edit",
        "suggestion_id": suggestion_id,
        "content": content
    })