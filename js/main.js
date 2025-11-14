/* main.js
   Countdown -> reveal -> cake build -> mic blow detection -> confetti
   Comments included. Change the TARGET_DATE constant to your desired unlock moment.
*/

/* ----------------------
   CONFIG
   ---------------------- */
const TARGET_DATE = "November 14, 2025 15:00:00"; // change here for exact unlock date/time
const CANDLE_COUNT = 19;
const MOBILE_THRESHOLD = 0.01;  // lower RMS threshold on phones (easier to trigger)
const DESKTOP_THRESHOLD = 0.12; // desktop threshold
const SUSTAIN_FRAMES = 10;      // frames above threshold required to consider it a blow

/* ----------------------
   DOM short-hands
   ---------------------- */
const $ = (s) => document.querySelector(s);
const countdownEl = $('#countdown');
const timer = $('#countdown-timer');
const exp = $('#experience');
const cakeContainer = $('#cake-container');
const blowBtn = $('#blow-button');
const msgCard = $('#message-card');
const confettiLayer = $('#confetti-layer');

/* ----------------------
   Countdown (real target date)
   - Uses requestAnimationFrame for smooth updates and formatting
   ---------------------- */
function startCountdown() {
  const target = new Date(TARGET_DATE).getTime();

  function update() {
    const now = Date.now();
    const diff = target - now;

    if (diff <= 0) {
      timer.textContent = "0s";
      // fade out the countdown and activate experience
      countdownEl.style.transition = "opacity .6s";
      countdownEl.style.opacity = "0";
      setTimeout(() => {
        countdownEl.remove();
        activateExperience();
      }, 650);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hrs  = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    timer.textContent = `${days}d ${hrs}h ${mins}m ${secs}s`;

    requestAnimationFrame(update);
  }

  update();
}

/* ----------------------
   Build cake DOM: single PNG + overlay candle ring
   ---------------------- */
let CANDLES = [];
function buildCake() {
  if (!cakeContainer) return;

  cakeContainer.innerHTML = `
    <img src="assets/black_cake.png" alt="Cake" class="cake-img" />
    <div class="candles" aria-hidden="true"></div>
  `;

  const group = cakeContainer.querySelector('.candles');
  group.innerHTML = "";
  CANDLES = [];

  for (let i = 0; i < CANDLE_COUNT; i++) {
    const candle = document.createElement('div');
    candle.className = 'candle';
    candle.dataset.index = String(i);
    candle.innerHTML = `
      <div class="candle-body"></div>
      <div class="wick"></div>
      <div class="flame"></div>
      <div class="smoke"></div>
    `;
    group.appendChild(candle);
    CANDLES.push(candle);
  }

  // entrance + layout
  setTimeout(() => cakeContainer.classList.add('show'), 50);
  setTimeout(positionCandles, 80);
  // reposition on resize (debounced)
  let rId = null;
  window.addEventListener('resize', () => {
    if (rId) clearTimeout(rId);
    rId = setTimeout(positionCandles, 110);
  });
}

/* ----------------------
   Position candles in an ellipse above the cake image (works across devices)
   ---------------------- */
function positionCandles() {
  const group = cakeContainer.querySelector('.candles');
  if (!group) return;

  const W = Math.max(1, group.offsetWidth);
  const H = Math.max(1, group.offsetHeight);
  const cx = W / 2;
  const cy = H / 2;
  const rx = W * 0.3; // horizontal radius
  const ry = H * 0.2; // vertical radius (flattened)

  CANDLES.forEach((c, i) => {
    // evenly around full circle
    const ang = (i / CANDLE_COUNT) * Math.PI * 2;
    // slight organic jitter stored once per candle
    let jitter = Number(c.dataset.jitter || NaN);
    if (Number.isNaN(jitter)) {
      jitter = 1 - Math.random() * 0.08;
      c.dataset.jitter = String(jitter);
    }
    const x = cx + Math.cos(ang) * rx * jitter;
    const y = cy + Math.sin(ang) * ry * jitter;

    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    // depth sorting by y
    c.style.zIndex = `${Math.round(y + 200)}`;

    // appear animation staggered
    setTimeout(() => c.classList.add('visible'), 220 + i * 60);
  });
}

/* ----------------------
   Extinguish animation sequence
   ---------------------- */
function extinguishSequence() {
  CANDLES.forEach((c, idx) => {
    setTimeout(() => c.classList.add('extinguished'), idx * 80);
  });

  // confetti after short delay
  setTimeout(() => spawnConfetti(), 500);

  // show message card after confetti
  setTimeout(() => {
    msgCard.classList.add('show');
    msgCard.setAttribute('aria-hidden', 'false');
  }, 1400);
}

/* ----------------------
   Confetti — using canvas-confetti CDN for richer effects
   - multiple bursts, side blasts, and floating stream
   ---------------------- */
function spawnConfetti() {
  if (typeof confetti !== 'function') {
    // fallback: create small DOM confetti if library missing
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 10}%`;
      el.style.width = `${6 + Math.random() * 10}px`;
      el.style.height = `${10 + Math.random() * 20}px`;
      el.style.background = `hsl(${Math.random() * 360}, 85%, 60%)`;
      confettiLayer.appendChild(el);
      setTimeout(() => el.remove(), 6500);
    }
    return;
  }

  // big center burst
  confetti({
    particleCount: 180,
    spread: 85,
    startVelocity: 48,
    gravity: 0.9,
    origin: { y: 0.5 }
  });

  // left side blast
  setTimeout(() => confetti({
    particleCount: 80,
    angle: 55,
    spread: 60,
    startVelocity: 54,
    origin: { x: 0 }
  }), 150);

  // right side blast
  setTimeout(() => confetti({
    particleCount: 80,
    angle: 125,
    spread: 60,
    startVelocity: 54,
    origin: { x: 1 }
  }), 250);

  // long slow stream from top
  setTimeout(() => confetti({
    particleCount: 60,
    spread: 120,
    startVelocity: 22,
    gravity: 0.35,
    origin: { y: 0 }
  }), 600);
}

/* ----------------------
   Experience activation
   ---------------------- */
function activateExperience() {
  exp.classList.add('active');
  exp.setAttribute('aria-hidden', 'false');
  buildCake();
  // focus the blow button gently
  setTimeout(() => blowBtn.focus({preventScroll:true}), 900);
}

/* ----------------------
   Blow detection (Web Audio RMS)
   - adaptive threshold: easier on mobile devices
   - stops when blow detected, cleans up audio resources
   ---------------------- */
let audioState = {
  audioContext: null,
  analyser: null,
  source: null,
  dataArray: null,
  rafId: null
};

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function startAirflowDetection(onDetected, onDenied) {
  const threshold = isMobile() ? MOBILE_THRESHOLD : DESKTOP_THRESHOLD;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    onDenied && onDenied(new Error('getUserMedia not available'));
    return;
  }

  navigator.mediaDevices.getUserMedia({ audio: { echoCancellation:false, noiseSuppression:false, autoGainControl:false } })
    .then(stream => {
      // cleanup any previous
      cleanupAudio();

      audioState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioState.analyser = audioState.audioContext.createAnalyser();
      audioState.analyser.fftSize = 1024; // good resolution
      audioState.dataArray = new Uint8Array(audioState.analyser.fftSize);

      audioState.source = audioState.audioContext.createMediaStreamSource(stream);
      audioState.source.connect(audioState.analyser);

      // detect sustained RMS above threshold
      let framesAbove = 0;
      function tick() {
        audioState.analyser.getByteTimeDomainData(audioState.dataArray);
        let sum = 0;
        for (let i = 0; i < audioState.dataArray.length; i++) {
          const v = (audioState.dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / audioState.dataArray.length);

        if (rms > threshold) {
          framesAbove++;
          if (framesAbove >= SUSTAIN_FRAMES) {
            // detected blow
            onDetected && onDetected(rms);
            cleanupAudio();
            return;
          }
        } else {
          framesAbove = Math.max(framesAbove - 1, 0);
        }

        audioState.rafId = requestAnimationFrame(tick);
      }
      tick();

    }).catch(err => {
      onDenied && onDenied(err);
    });
}

function cleanupAudio() {
  if (audioState.rafId) { cancelAnimationFrame(audioState.rafId); audioState.rafId = null; }
  if (audioState.source) { try { audioState.source.disconnect(); } catch(e){} audioState.source = null; }
  if (audioState.audioContext) { try { audioState.audioContext.close(); } catch(e){} audioState.audioContext = null; }
  audioState.analyser = null;
  audioState.dataArray = null;
}

/* ----------------------
   Button handlers & fallback logic
   - First click: try mic and show "Listening…"
   - If mic denied: change button text and allow manual second click
   - On detection: change text to success and run sequence
   ---------------------- */

let celebrationTriggered = false;

function onBlowDetected() {
  if (celebrationTriggered) return;
  celebrationTriggered = true;
  blowBtn.textContent = "You blew the candles! 🎉";
  blowBtn.disabled = true;
  extinguishSequence();
}

function onBlowDenied() {
  // show friendly fallback text and enable manual tap
  blowBtn.classList.remove('listening');
  blowBtn.disabled = false;
  blowBtn.textContent = "Tap again to blow (no mic)";
  // attach once-only manual extinguish
  const manualHandler = () => {
    blowBtn.removeEventListener('click', manualHandler);
    if (celebrationTriggered) return;
    celebrationTriggered = true;
    blowBtn.textContent = "You blew the candles! 🎉";
    blowBtn.disabled = true;
    extinguishSequence();
  };
  blowBtn.addEventListener('click', manualHandler, { once: true });
}

blowBtn.addEventListener('click', () => {
  if (celebrationTriggered) return;
  // UX: listening state
  blowBtn.classList.add('listening');
  blowBtn.disabled = true;
  blowBtn.textContent = "Listening…";

  // start mic detection with callbacks
  startAirflowDetection(() => {
    // blow detected
    onBlowDetected();
  }, (err) => {
    // mic denied or unavailable
    onBlowDenied();
  });
});

/* ----------------------
   Manual extinguish helper for pages without mic support
   (keeps behavior consistent)
   ---------------------- */
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  // allow tap-to-blow in all cases
  blowBtn.addEventListener('click', () => {
    if (celebrationTriggered) {
      return;
    }
    celebrationTriggered = true;
    blowBtn.textContent = "You blew the candles! 🎉";
    blowBtn.disabled = true;
    extinguishSequence();
  }, { once: false });
}

/* ----------------------
   Start everything on DOMContentLoaded
   ---------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // begin countdown (uses TARGET_DATE)
  startCountdown();
});

