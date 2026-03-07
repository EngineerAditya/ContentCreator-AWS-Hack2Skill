import streamlit as st
import uuid
from api import *

st.set_page_config(
    page_title="ZeroClick Creator",
    page_icon="🚀",
    layout="wide"
)

st.title("🚀 ZeroClick AI Content Creator")


# -------------------------
# USER SESSION
# -------------------------

if "user_id" not in st.session_state:
    st.session_state.user_id = "user_" + str(uuid.uuid4())[:6]


user_id = st.session_state.user_id


# -------------------------
# ONBOARDING
# -------------------------

st.header("👤 Setup Profile")

email = st.text_input("Email")

language = st.selectbox(
    "Preferred Language",
    ["en", "hi", "ml", "kn", "ta"]
)

interests = st.text_input(
    "Interests (comma separated)",
    "AI,startups"
)

if st.button("Create Profile"):

    response = setup_user(
        user_id,
        email,
        language,
        interests.split(",")
    )

    st.success("Profile Created")

    st.json(response)


st.divider()


# -------------------------
# VOICE IDEA
# -------------------------

st.header("🎤 Speak Idea")

st.write(
    "Upload a voice recording and convert it into a LinkedIn post."
)

audio_file = st.file_uploader(
    "Upload audio (wav)",
    type=["wav"]
)

if audio_file:

    s3_key = f"audio/{user_id}/{audio_file.name}"

    st.info("Upload audio to S3 manually for now")

    if st.button("Generate Post from Voice"):

        with st.spinner("AI is thinking..."):

            response = generate_voice_post(
                user_id,
                s3_key
            )

        if "content_primary" in response:

            st.subheader("Transcript")

            st.write(response["transcript"])

            st.subheader("Generated Post")

            st.code(response["content_primary"])

        else:

            st.error(response)


st.divider()


# -------------------------
# IDEA GENERATION
# -------------------------

st.header("💡 Generate from Idea")

idea = st.text_area(
    "Enter an idea"
)

if st.button("Generate Post"):

    with st.spinner("Generating..."):

        response = generate_from_idea(
            user_id,
            idea
        )

    if "content" in response:

        st.code(response["content"])

    else:

        st.error(response)


st.divider()


# -------------------------
# TREND POSTS
# -------------------------

st.header("🔥 Trending Post")

topic = st.text_input("Optional Topic")

if st.button("Generate Trend Post"):

    with st.spinner("Finding trends..."):

        response = generate_trend_post(
            user_id,
            topic
        )

    if "content" in response:

        st.code(response["content"])

    else:

        st.error(response)