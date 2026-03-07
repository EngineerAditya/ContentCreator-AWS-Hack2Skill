import boto3
import time
import json

REGION = "us-east-1"
BUCKET = "zeroclick-voice-256766085533"

s3 = boto3.client("s3", region_name=REGION)
transcribe = boto3.client("transcribe", region_name=REGION)


def upload_audio(local_path: str, user_id: str) -> str:
    key = f"audio/{user_id}/{int(time.time())}.wav"
    s3.upload_file(local_path, BUCKET, key)
    print("Uploaded:", key)
    return key


def transcribe_audio(s3_key: str, user_id: str) -> str:
    job_name = f"zc-{user_id}-{int(time.time())}"

    transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        MediaFormat="wav",
        Media={"MediaFileUri": f"s3://{BUCKET}/{s3_key}"},
        OutputBucketName=BUCKET,
        OutputKey=f"transcripts/{user_id}/{job_name}.json",
        LanguageCode="hi-IN"
    )

    print("Job started:", job_name)

    while True:
        resp = transcribe.get_transcription_job(
            TranscriptionJobName=job_name
        )
        status = resp["TranscriptionJob"]["TranscriptionJobStatus"]
        print("Status:", status)

        if status == "COMPLETED":
            break
        if status == "FAILED":
            raise Exception(
                resp["TranscriptionJob"].get("FailureReason")
            )

        time.sleep(3)

    result = s3.get_object(
        Bucket=BUCKET,
        Key=f"transcripts/{user_id}/{job_name}.json"
    )

    data = json.loads(result["Body"].read())
    transcript = data["results"]["transcripts"][0]["transcript"]

    print("\nTranscript:\n", transcript)
    return transcript


if __name__ == "__main__":
    s3_key = upload_audio("test_audio.wav", "test_user")
    transcribe_audio(s3_key, "test_user")
