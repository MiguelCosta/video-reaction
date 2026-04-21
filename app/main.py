import os
import subprocess
import uuid
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

REACTIONS_DIR = Path(os.environ.get("REACTIONS_DIR", "/app/reactions"))
REACTIONS_DIR.mkdir(parents=True, exist_ok=True)

YOUTUBE_VIDEO_ID = os.environ.get("YOUTUBE_VIDEO_ID", "dQw4w9WgXcQ")


@app.route("/")
def index():
    return render_template("index.html", youtube_video_id=YOUTUBE_VIDEO_ID)


@app.route("/upload", methods=["POST"])
def upload():
    if "reaction" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    blob = request.files["reaction"]
    if blob.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique = uuid.uuid4().hex[:6]
    webm_path = REACTIONS_DIR / f"reaction_{timestamp}_{unique}.webm"
    mp4_path = REACTIONS_DIR / f"reaction_{timestamp}_{unique}.mp4"

    blob.save(str(webm_path))

    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y",
                "-i", str(webm_path),
                "-c:v", "libx264",
                "-c:a", "aac",
                "-movflags", "+faststart",
                str(mp4_path),
            ],
            capture_output=True,
            timeout=120,
        )
        if result.returncode != 0:
            app.logger.error("ffmpeg error: %s", result.stderr.decode())
            return jsonify({"error": "Conversion failed"}), 500
    finally:
        webm_path.unlink(missing_ok=True)

    return jsonify({"filename": mp4_path.name}), 201


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
