import streamlit as st
import uuid
from api import *

st.set_page_config(
    page_title="ZeroClick Creator",
    page_icon="🚀",
    layout="wide"
)

st.title("🚀 ZeroClick AI Content Creator")
st.write("Turn voice, ideas, or live news into LinkedIn posts in seconds.")

# -------------------------
# SESSION
# -------------------------

if "user_id" not in st.session_state:
    st.session_state.user_id = "user_" + str(uuid.uuid4())[:6]

if "profile_created" not in st.session_state:
    st.session_state.profile_created = False

user_id = st.session_state.user_id

# -------------------------
# SIDEBAR PROFILE
# -------------------------

with st.sidebar:

    st.header("👤 Profile")

    email = st.text_input("Email")

    language = st.selectbox(
        "Preferred Language",
        ["en", "hi", "ml", "kn", "ta"]
    )

    interests = st.text_input(
        "Interests",
        "AI,startups"
    )

    if st.button("Create / Update Profile"):

        with st.spinner("Saving profile..."):

            response = setup_user(
                user_id,
                email,
                language,
                interests.split(",")
            )

        if "success" in response:
            st.success("Profile saved")
            st.session_state.profile_created = True
        else:
            st.error(response)

# -------------------------
# TABS
# -------------------------

tab1, tab2, tab3 = st.tabs([
    "🎤 Voice → Post",
    "💡 Idea → Post",
    "🔥 News → Post"
])

# -------------------------
# VOICE TAB
# -------------------------

with tab1:

    st.subheader("Speak → LinkedIn Post")

    st.write(
        "Upload a voice recording and convert it into a LinkedIn post."
    )

    audio_file = st.file_uploader(
        "Upload audio (wav)",
        type=["wav"]
    )

    if audio_file:

        s3_key = f"audio/{user_id}/{audio_file.name}"

        st.info(
            "For this MVP demo, upload the audio file to S3 using the same key before generating."
        )

        if st.button("Generate Post from Voice"):

            with st.spinner("Processing voice..."):

                response = generate_voice_post(
                    user_id,
                    s3_key
                )

            if "content_primary" in response:

                st.success("Post generated")

                st.subheader("Transcript")
                st.write(response.get("transcript", ""))

                st.subheader("LinkedIn Post")

                st.code(
                    response["content_primary"],
                    language="markdown"
                )

                st.download_button(
                    "Download Post",
                    response["content_primary"],
                    file_name="linkedin_post.txt"
                )

            else:

                st.error(response)

# -------------------------
# IDEA TAB
# -------------------------

with tab2:

    st.subheader("Idea → LinkedIn Post")

    idea = st.text_area(
        "Describe your idea",
        height=150
    )

    if st.button("Generate Post from Idea"):

        if not idea:

            st.warning("Please enter an idea")

        else:

            with st.spinner("Generating post..."):

                response = generate_from_idea(
                    user_id,
                    idea
                )

            if "content" in response:

                st.success("Post generated")

                st.code(
                    response["content"],
                    language="markdown"
                )

                st.download_button(
                    "Download Post",
                    response["content"],
                    file_name="linkedin_post.txt"
                )

            else:

                st.error(response)

# -------------------------
# TREND TAB
# -------------------------

with tab3:

    st.subheader("Trending News → LinkedIn Post")

    topic = st.text_input(
        "Optional Topic (example: AI regulation, startup layoffs, Iran war)"
    )

    if st.button("Generate Trend Post"):

        with st.spinner("Finding latest news..."):

            response = generate_trend_post(
                user_id,
                topic
            )

        if "content" in response:

            st.success("Post generated")

            st.subheader("News Source")

            if "headline" in response:
                st.write("Headline:", response["headline"])

            if "source" in response:
                st.write("Source:", response["source"])

            if "article_url" in response:
                st.write(response["article_url"])

            st.subheader("Generated LinkedIn Post")

            st.code(
                response["content"],
                language="markdown"
            )

            st.download_button(
                "Download Post",
                response["content"],
                file_name="linkedin_post.txt"
            )

        else:

            st.error(response)