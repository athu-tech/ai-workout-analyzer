const REP_TARGET = 20;

const motivMessages = [
  { word: "LET'S GO 🔥", sub: "keep your core tight and breathe" },
  { word: "PUSH IT 💪", sub: "feel that burn — you're earning it" },
  { word: "DON'T STOP ⚡", sub: "halfway there, stay locked in" },
  { word: "GRIND TIME 🏋️", sub: "form first, speed second" },
  { word: "YOU GOT THIS 🎯", sub: "focus on your breathing" },
];

let seconds = 0;
let timerInterval = null;
let lastRepCount = 0;

function startTimer() {
  timerInterval = setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${m}:${s}`;
  }, 1000);
}

startTimer();

// Rotate motivational message every 8s
let motivIdx = 0;
function rotateMotiv() {
  const m = motivMessages[motivIdx % motivMessages.length];
  document.getElementById('motiv-text').textContent = m.word;
  document.getElementById('motiv-sub').textContent = m.sub;
  motivIdx++;
}
setInterval(rotateMotiv, 8000);

// Update progress ring
function updateRing(count) {
  const pct = Math.min(count / REP_TARGET, 1);
  const circumference = 276.5;
  const offset = circumference - pct * circumference;
  document.getElementById('ring-fill').style.strokeDashoffset = offset;
  document.getElementById('ring-count').textContent = count;
  document.getElementById('ring-pct').textContent = `${Math.round(pct * 100)}% of goal`;

  if (count >= REP_TARGET) {
    document.getElementById('motiv-text').textContent = "CRUSHED IT 🏆";
    document.getElementById('motiv-sub').textContent = "goal reached — reset for another round";
  }
}

// Pulse ring on new rep
function pulseRing() {
  const ring = document.getElementById('ring-fill');
  ring.style.stroke = '#993C1D';
  setTimeout(() => { ring.style.stroke = '#D85A30'; }, 300);
}

// Update posture card color
function updatePostureCard(posture) {
  const card = document.getElementById('posture-card');
  const val = document.getElementById('posture-val');
  const sub = document.getElementById('posture-sub');

  const map = {
    'Body Straight': { bg: '#EAF3DE', label: '#3B6D11', val: '#27500A', sub: '#639922', valText: 'Body straight ✓', subText: 'looking good, keep it up' },
    'Lower Hips':    { bg: '#FAEEDA', label: '#854F0B', val: '#633806', sub: '#BA7517', valText: 'Lower your hips', subText: 'bring hips down slightly' },
    'Fix Posture':   { bg: '#FAECE7', label: '#993C1D', val: '#712B13', sub: '#D85A30', valText: 'Fix posture ⚠️', subText: 'body alignment off' },
  };

  const style = map[posture] || map['Body Straight'];
  card.style.background = style.bg;
  card.querySelector('.stat-label').style.color = style.label;
  val.style.color = style.val;
  val.textContent = style.valText;
  sub.style.color = style.sub;
  sub.textContent = style.subText;
}

// Update feedback color
function updateFeedback(feedback) {
  const el = document.getElementById('feedback-val');
  el.textContent = feedback;
  if (feedback === 'Good Depth') {
    el.className = 'analytic-val green';
  } else {
    el.className = 'analytic-val coral';
  }
}

// Poll /stats
async function fetchStats() {
  try {
    const res = await fetch('/stats');
    if (!res.ok) return;
    const data = await res.json();

    if (data.counter !== undefined) {
      updateRing(data.counter);
      if (data.counter > lastRepCount) {
        pulseRing();
        lastRepCount = data.counter;
      }
    }

    if (data.stage) {
      document.getElementById('stage-val').textContent = data.stage;
      document.getElementById('stage-sub').textContent =
        data.stage === 'UP' ? 'arms extended' : 'going down';
    }

    if (data.feedback) updateFeedback(data.feedback);
    if (data.posture) updatePostureCard(data.posture);

    const rpm = seconds > 0 ? Math.round((data.counter / seconds) * 60) : 0;
    document.getElementById('rpm-val').textContent = rpm;

    const q = data.counter > 0 ? Math.min(10, (7.5 + rpm * 0.08)).toFixed(1) : '—';
    document.getElementById('quality-val').textContent = data.counter > 0 ? `${q}/10` : '—';

  } catch (e) {}
}

setInterval(fetchStats, 800);

// Reset
document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('Reset session? This will clear your rep count and timer.')) return;
  clearInterval(timerInterval);
  seconds = 0;
  lastRepCount = 0;
  document.getElementById('timer-display').textContent = '00:00';
  updateRing(0);
  document.getElementById('rpm-val').textContent = '0';
  document.getElementById('quality-val').textContent = '—';
  startTimer();
});