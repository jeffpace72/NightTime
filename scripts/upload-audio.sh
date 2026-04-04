#!/usr/bin/env bash
# Usage: ./scripts/upload-audio.sh [bucket-name] [aws-region]
# Example: ./scripts/upload-audio.sh nighttime-skill-audio us-east-1
set -e

BUCKET_NAME=${1:-"nighttime-skill-audio"}
REGION=${2:-"us-east-1"}
AUDIO_DIR="$(cd "$(dirname "$0")/../audio" && pwd)"

echo "==> Bucket: $BUCKET_NAME ($REGION)"

# Create bucket
if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION"
else
  aws s3api create-bucket --bucket "$BUCKET_NAME" --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
fi

# Allow public access (required for Alexa to reach the files)
aws s3api delete-public-access-block --bucket "$BUCKET_NAME"

aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicReadGetObject\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\"
  }]
}"

# Upload MP3 files
echo "==> Uploading audio files from $AUDIO_DIR"
for file in "$AUDIO_DIR"/*.mp3; do
  [ -f "$file" ] || { echo "No .mp3 files found in audio/"; exit 1; }
  filename=$(basename "$file")
  echo "    $filename"
  aws s3 cp "$file" "s3://${BUCKET_NAME}/audio/${filename}" \
    --content-type "audio/mpeg" \
    --cache-control "max-age=86400"
done

echo ""
echo "==> Done. Set this Lambda environment variable:"
echo "    S3_BUCKET_URL = https://${BUCKET_NAME}.s3.amazonaws.com"
echo ""
echo "==> Audio URLs:"
for file in "$AUDIO_DIR"/*.mp3; do
  filename=$(basename "$file")
  echo "    https://${BUCKET_NAME}.s3.amazonaws.com/audio/${filename}"
done
