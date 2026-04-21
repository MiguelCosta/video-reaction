FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

RUN mkdir -p /app/reactions

EXPOSE 5000

ENV FLASK_APP=app/main.py
ENV FLASK_ENV=production
ENV YOUTUBE_VIDEO_ID=dQw4w9WgXcQ

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app.main:app"]
