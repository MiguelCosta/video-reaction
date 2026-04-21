/* ── Video Reaction Recorder ── */

(function () {
  'use strict';

  // DOM references
  const screens = {
    permission: document.getElementById('screen-permission'),
    ready:      document.getElementById('screen-ready'),
    watch:      document.getElementById('screen-watch'),
    thankyou:   document.getElementById('screen-thankyou'),
  };

  const btnAllow      = document.getElementById('btn-allow');
  const btnStart      = document.getElementById('btn-start');
  const btnStop       = document.getElementById('btn-stop');
  const permError     = document.getElementById('permission-error');
  const previewEl     = document.getElementById('preview');
  const camLiveEl     = document.getElementById('cam-live');
  const recBadge      = document.getElementById('rec-badge');
  const recBadgeWatch = document.getElementById('rec-badge-watch');
  const savedFilename = document.getElementById('saved-filename');

  let mediaStream   = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let ytPlayer      = null;

  // ── Screen helper ──
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ── Step 1: Request camera + mic ──
  btnAllow.addEventListener('click', async () => {
    btnAllow.disabled = true;
    permError.classList.add('hidden');
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          // sampleRate and channelCount omitted — iOS Safari throws
          // OverconstrainedError if the device doesn't support exact values
        },
      });

      // Verify audio tracks were granted
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('Nenhuma faixa de áudio encontrada no stream');
      }

      previewEl.srcObject = mediaStream;
      camLiveEl.srcObject = mediaStream;
      showScreen('ready');
    } catch (err) {
      permError.textContent = 'Não foi possível aceder à câmara/microfone: ' + err.message +
        '. Por favor, permite o acesso nas definições do browser e recarrega a página.';
      permError.classList.remove('hidden');
      btnAllow.disabled = false;
    }
  });

  // ── Step 2: Start watching ──
  btnStart.addEventListener('click', () => {
    showScreen('watch');
    // Small delay so the YouTube iframe is visible/attached before play
    setTimeout(() => {
      startRecording();
      if (ytPlayer && ytPlayer.playVideo) {
        ytPlayer.playVideo();
      }
    }, 500);
  });

  // ── Step 3: Manual stop ──
  btnStop.addEventListener('click', stopAndSave);

  // ── MediaRecorder ──
  function getBestMimeType() {
    const candidates = [
      // Desktop browsers (Chrome, Firefox, Edge) — WebM preferred
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      // iOS Safari (14.3+) — only supports MP4/H.264/AAC
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
    ];
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
  }

  function startRecording() {
    recordedChunks = [];
    const mimeType = getBestMimeType();
    const options  = mimeType ? { mimeType, audioBitsPerSecond: 128000 } : { audioBitsPerSecond: 128000 };
    mediaRecorder  = new MediaRecorder(mediaStream, options);

    mediaRecorder.addEventListener('dataavailable', e => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    });

    mediaRecorder.addEventListener('stop', uploadReaction);
    // No timeslice: record as a single continuous blob.
    // Using start(N) creates WebM cluster boundaries every N ms which
    // causes audio gaps/discontinuities when the chunks are concatenated.
    mediaRecorder.start();
  }

  function stopAndSave() {
    if (ytPlayer && ytPlayer.stopVideo) ytPlayer.stopVideo();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.requestData(); // flush buffered data (not supported on iOS — ignored)
      } catch (_) {}
      mediaRecorder.stop();
    }
  }

  // ── Upload to server ──
  async function uploadReaction() {
    showScreen('thankyou');

    const mimeType = mediaRecorder.mimeType || 'video/webm';
    const ext      = mimeType.includes('webm') ? 'webm' : 'mp4';
    const blob     = new Blob(recordedChunks, { type: mimeType });

    const formData = new FormData();
    formData.append('reaction', blob, `reaction.${ext}`);

    try {
      const response = await fetch('/upload', { method: 'POST', body: formData });
      if (response.ok) {
        const data = await response.json();
        savedFilename.textContent = `Guardado como: ${data.filename}`;
      } else {
        savedFilename.textContent = 'Ocorreu um problema ao guardar a tua reação. Por favor contacta-nos!';
      }
    } catch {
      savedFilename.textContent = 'Erro de rede ao guardar a reação.';
    }

    // Release camera
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
    }
  }

  // ── YouTube IFrame API ──
  // Called by YouTube script when API is ready
  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('yt-player', {
      videoId: window.YOUTUBE_VIDEO_ID,
      playerVars: {
        autoplay:       0,
        controls:       1,
        rel:            0,
        modestbranding: 1,
        fs:             1,
      },
      events: {
        onStateChange: onPlayerStateChange,
      },
    });
  };

  function onPlayerStateChange(event) {
    // YT.PlayerState.ENDED = 0
    if (event.data === YT.PlayerState.ENDED) {
      stopAndSave();
    }
  }

})();
