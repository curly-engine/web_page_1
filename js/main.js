/* -----------------------------------
   MAIN JS — COUNTDOWN → CAKE → BLOW
----------------------------------- */

const $ = (s) => document.querySelector(s);

/* Elements */
const countdownEl = $('#countdown');
const timer = $('#countdown-timer');
const exp = $('#experience');
const cakeContainer = $('#cake-container');
const blowBtn = $('#blow-button');
const msgCard = $('#message-card');
const confettiLayer = $('#confetti-layer');

/* Start Countdown -------------------------------- */
function startCountdown() {
  let t = 3;
  timer.textContent = t + "s";

  const iv = setInterval(() => {
    t--;
    timer.textContent = t + "s";

    if (t < 0) {
      clearInterval(iv);
      countdownEl.style.opacity = "0";
      setTimeout(() => countdownEl.remove(), 600);
      activateExperience();
    }
  }, 1000);
}

/* Build Cake DOM -------------------------------- */
const CANDLE_COUNT = 19;
let CANDLES = [];

function buildCake() {
  cakeContainer.innerHTML = `
    <img src="assets/black_cake.png" class="cake-img">

    <div class="candles"></div>
  `;

  const group = cakeContainer.querySelector('.candles');

  // Create candles
  for (let i = 0; i < CANDLE_COUNT; i++) {
    const c = document.createElement('div');
    c.className = 'candle';
    c.dataset.index = i;

    c.innerHTML = `
      <div class="candle-body"></div>
      <div class="wick"></div>
      <div class="flame"></div>
      <div class="smoke"></div>
    `;

    group.appendChild(c);
    CANDLES.push(c);
  }

  setTimeout(() => cakeContainer.classList.add('show'), 50);
  setTimeout(positionCandles, 60);
  window.addEventListener('resize', () => setTimeout(positionCandles, 120));
}

/* Candle Ring Positioning ------------------------ */
function positionCandles() {
  const group = cakeContainer.querySelector('.candles');
  const W = group.offsetWidth;
  const H = group.offsetHeight;

  const cx = W / 2;
  const cy = H / 2;

  const rx = W * 0.4;
  const ry = H * 0.2;

  CANDLES.forEach((c, i) => {
    const ang = (i / CANDLE_COUNT) * Math.PI * 2;
    const x = cx + Math.cos(ang) * rx;
    const y = cy + Math.sin(ang) * ry;

    c.style.left = x + "px";
    c.style.top = y + "px";
    c.style.zIndex = Math.round(y + 200);

    // Fade in
    setTimeout(() => c.classList.add('visible'), 200 + i * 80);
  });
}

/* Extinguish ------------------------------------- */
function extinguish() {
  CANDLES.forEach((c, i) => {
    setTimeout(() => c.classList.add('extinguished'), i * 90);
  });

  setTimeout(spawnConfetti, 500);

  setTimeout(() => {
    msgCard.classList.add('show');
  }, 1500);
}

/* ---------------------------------------------------
   Confetti using canvas-confetti (beautiful + explosive)
--------------------------------------------------- */

function spawnConfetti() {
  // Main burst
  confetti({
    particleCount: 140,
    spread: 80,
    startVelocity: 40,
    gravity: 0.9,
    origin: { y: 0.5 }
  });

  // Side bursts for chaos
  setTimeout(() => {
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 55,
      startVelocity: 52,
      origin: { x: 0 }
    });
  }, 200);

  setTimeout(() => {
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 55,
      startVelocity: 52,
      origin: { x: 1 }
    });
  }, 300);

  // Floating long-tail confetti for beauty
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      startVelocity: 20,
      gravity: 0.4,
      origin: { y: 0 }
    });
  }, 600);
}


/* Experience Activate ---------------------------- */
function activateExperience() {
  exp.classList.add('active');
  buildCake();
}

/* Mic Blow Detection ----------------------------- */
function startMicDetection() {
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      const data = new Uint8Array(analyser.fftSize);
      src.connect(analyser);

      function listen() {
        analyser.getByteTimeDomainData(data);
        let amp = 0;

        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          amp += v * v;
        }
        amp = Math.sqrt(amp / data.length);

        if (amp > 0.18) {
          extinguish();
          ctx.close();
          return;
        }

        requestAnimationFrame(listen);
      }
      listen();
    })
    .catch(() => {
        blowBtn.disabled = false;
        blowBtn.textContent = "Tap again to blow";

        // Remove mic listener completely
        blowBtn.onclick = null;

        // Next tap will extinguish the candles
        blowBtn.addEventListener("click", function manualExtinguish() {
            blowBtn.removeEventListener("click", manualExtinguish);
        extinguish();
    });
});

}

/* Button ------------------------- */
blowBtn.onclick = () => {
  blowBtn.disabled = true;
  blowBtn.textContent = "Listening…";
  startMicDetection();
};

/* Start -------------------------- */
document.addEventListener("DOMContentLoaded", startCountdown);

