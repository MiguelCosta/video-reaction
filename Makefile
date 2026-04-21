# Video Reaction – Makefile
# Usage: make <target>  (requires Docker & docker-compose)

COMPOSE = docker compose
IMAGE   = video-reaction

# Default YouTube video ID (override with: make run YOUTUBE_VIDEO_ID=<id>)
YOUTUBE_VIDEO_ID ?= dQw4w9WgXcQ

.PHONY: build run stop restart logs clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

build: ## Build the Docker image
	$(COMPOSE) build

run: ## Start the website (builds if needed)
	YOUTUBE_VIDEO_ID=$(YOUTUBE_VIDEO_ID) $(COMPOSE) up --build -d
	@echo ""
	@echo "  ✅  Running at http://localhost:5000"
	@echo "  🎥  YouTube video ID: $(YOUTUBE_VIDEO_ID)"
	@echo "  📁  Reactions saved in Docker volume 'video-reaction_reactions'"
	@echo ""

stop: ## Stop the website
	$(COMPOSE) down

restart: ## Restart the website
	$(COMPOSE) restart

logs: ## Tail application logs
	$(COMPOSE) logs -f web

clean: ## Stop containers and delete saved reactions (⚠ deletes ./reactions/*.mp4)
	$(COMPOSE) down
	@rm -f reactions/*.mp4 reactions/*.webm
	@echo "  🗑  Reactions deleted."

reactions: ## List saved reaction files in ./reactions/
	@ls -lh reactions/*.mp4 2>/dev/null || echo "  No reactions saved yet."
