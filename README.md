# 💍 Ana & Sérgio — Video Reaction Website

A romantic web application that plays a YouTube video of a marriage proposal while recording the visitor's webcam and microphone reaction. Reactions are saved as MP4 files on the server.

---

## Features

- 🎥 Plays a configurable YouTube video (marriage proposal)
- 📹 Captures visitor's webcam + microphone reaction
- 💾 Saves reactions as MP4 files via server-side ffmpeg conversion
- 💍 Romantic marriage-proposal themed UI (soft pinks, gold, floating petals)
- 🐳 Fully containerised with Docker — no local Python/ffmpeg needed
- 📁 Reactions folder mapped as a Docker volume (data persists across restarts)

---

## Requirements

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) (bundled with Docker Desktop)
- `make` (optional but recommended — available on macOS/Linux; on Windows use [Git Bash](https://git-scm.com/) or [WSL](https://learn.microsoft.com/en-us/windows/wsl/))

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/MiguelCosta/video-reaction.git
cd video-reaction

# 2. Start the website (uses default YouTube video)
make run

# 3. Open in your browser
open http://localhost:5000
```

> On Windows without `make`, use: `docker compose up --build -d`

---

## Configuration

The YouTube video is configured via the `YOUTUBE_VIDEO_ID` environment variable.

### Option A — override at runtime

```bash
make run YOUTUBE_VIDEO_ID=<youtube-video-id>
```

### Option B — `.env` file

Create a `.env` file in the project root:

```env
YOUTUBE_VIDEO_ID=your_video_id_here
```

Docker Compose picks it up automatically.

### Option C — edit `docker-compose.yml`

```yaml
environment:
  - YOUTUBE_VIDEO_ID=your_video_id_here
```

To find a YouTube video ID, look at the URL:
`https://www.youtube.com/watch?v=`**`dQw4w9WgXcQ`** ← this part is the ID.

---

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make run` | Build & start the website at http://localhost:5000 |
| `make stop` | Stop the containers |
| `make restart` | Restart the containers |
| `make logs` | Tail live application logs |
| `make build` | Build the Docker image without starting |
| `make reactions` | Export saved MP4s to `./reactions-export/` on the host |
| `make clean` | Stop containers **and delete all saved reactions** ⚠️ |

---

## Project Structure

```
video-reaction/
├── app/
│   ├── main.py                 # Flask application (routes + ffmpeg conversion)
│   ├── static/
│   │   ├── css/style.css       # Romantic marriage-proposal theme
│   │   └── js/recorder.js      # MediaRecorder + YouTube sync logic
│   └── templates/
│       └── index.html          # Main page
├── reactions/                  # Local placeholder (mapped as Docker volume)
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

---

## How It Works

1. Visitor opens the site → romantic landing page asks for camera & microphone access
2. Browser permission granted → webcam preview shown
3. Visitor clicks **Start** → YouTube video plays & recording begins simultaneously
4. When the YouTube video ends (or visitor clicks **Stop**) → recording stops
5. The WebM blob is uploaded to `POST /upload` on the Flask server
6. Server runs `ffmpeg` to convert WebM → MP4 and saves it in `/app/reactions/`
7. Visitor sees a thank-you message 💖

---

## Recording Format

Reactions are saved as **WebM** files (VP8/VP9 video + Opus audio) — the browser's native recording format.

| | WebM | MP4 |
|---|---|---|
| Quality | ✅ Lossless (no re-encoding) | ⚠️ Re-encoded |
| Processing | ✅ Instant (no conversion) | ⚠️ CPU-intensive |
| Chrome / Firefox / Edge | ✅ | ✅ |
| VLC / modern players | ✅ | ✅ |
| QuickTime (older Mac) | ⚠️ Needs codec | ✅ |

WebM plays natively in all modern browsers and VLC. If you need MP4 you can convert locally with:
```bash
ffmpeg -i reaction_file.webm -c:v libx264 -c:a aac output.mp4
```

---

## Development (without Docker)

```bash
# Install dependencies (Python 3.12+ required)
pip install -r requirements.txt

# Install ffmpeg (macOS: brew install ffmpeg, Ubuntu: apt install ffmpeg)

# Run locally
YOUTUBE_VIDEO_ID=dQw4w9WgXcQ REACTIONS_DIR=./reactions flask --app app/main.py run --debug
```

Open http://localhost:5000

---

## Browser Compatibility

The site uses the [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder) which is supported in all modern browsers (Chrome, Firefox, Edge, Safari 14.1+). **HTTPS or localhost is required** for camera/microphone access.

---

## License

MIT
