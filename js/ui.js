/**
 * ui.js
 * Handles all DOM updates: rep ring, stage, feedback, posture card,
 * timer, reps/min, session quality, and motivational messages.
 *
 * Call ui.update(workoutState) each frame (or at your chosen cadence).
 * Call ui.startTimer() / ui.resetTimer() for session timing.
 */

const ui = (() => {

  // ── Constants ──────────────────────────────────────────────────────────────
  const REP_TARGET      = 20;
  const RING_CIRCUMFERENCE = 276.5;

  const motivMessages = [
    { word: "LET'S GO 🔥",    sub: "keep your core tight and breathe"   },
    { word: "PUSH IT 💪",     sub: "feel that burn — you're earning it"  },
    { word: "DON'T STOP ⚡",  sub: "halfway there, stay locked in"       },
    { word: "GRIND TIME 🏋️",  sub: "form first, speed second"           },
    { word: "YOU GOT THIS 🎯", sub: "focus on your breathing"            },
  ];

  // ── DOM refs ────────────────────────────────────────────────────────────────
  const els = {
    feedbackVal:  document.getElementById('feedback-val'),
    rpmVal:       document.getElementById('rpm-val'),
    qualityVal:   document.getElementById('quality-val'),
    motivText:    document.getElementById('motiv-text'),
    motivSub:     document.getElementById('motiv-sub'),
    ringFill:     document.getElementById('ring-fill'),
    ringCount:    document.getElementById('ring-count'),
    ringPct:      document.getElementById('ring-pct'),
    stageVal:     document.getElementById('stage-val'),
    stageSub:     document.getElementById('stage-sub'),
    postureCard:  document.getElementById('posture-card'),
    postureVal:   document.getElementById('posture-val'),
    postureSub:   document.getElementById('posture-sub'),
    postureLabel: document.querySelector('#posture-card .stat-label'),
    timerDisplay: document.getElementById('timer-display'),
    loadingOverlay: document.getElementById('loading-overlay'),
  };

  // ── Internal state ───────────────────────────────────────────────────────────
  let seconds       = 0;
  let timerInterval = null;
  let lastRepCount  = 0;
  let motivIdx      = 0;
  let motivTimer    = null;

  // ── Timer ─────────────────────────────────────────────────────────────────
  function startTimer() {
    timerInterval = setInterval(() => {
      seconds++;
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      els.timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }

  function resetTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    els.timerDisplay.textContent = '00:00';
    startTimer();
  }

  function getSeconds() { return seconds; }

  // ── Motivational messages ─────────────────────────────────────────────────
  function rotateMotiv() {
    const m = motivMessages[motivIdx % motivMessages.length];
    els.motivText.textContent = m.word;
    els.motivSub.textContent  = m.sub;
    motivIdx++;
  }

  function startMotivRotation() {
    motivTimer = setInterval(rotateMotiv, 8000);
  }

  function stopMotivRotation() {
    clearInterval(motivTimer);
  }

  // ── Ring ─────────────────────────────────────────────────────────────────
  function updateRing(count) {
    const pct    = Math.min(count / REP_TARGET, 1);
    const offset = RING_CIRCUMFERENCE - pct * RING_CIRCUMFERENCE;
    els.ringFill.style.strokeDashoffset = offset;
    els.ringCount.textContent = count;
    els.ringPct.textContent   = `${Math.round(pct * 100)}% of goal`;

    if (count >= REP_TARGET) {
      stopMotivRotation();
      els.motivText.textContent = 'CRUSHED IT 🏆';
      els.motivSub.textContent  = 'goal reached — reset for another round';
    }
  }

  function pulseRing() {
    els.ringFill.style.stroke = '#993C1D';
    setTimeout(() => { els.ringFill.style.stroke = '#D85A30'; }, 300);
  }

  // ── Posture card ─────────────────────────────────────────────────────────
  const postureMap = {
    'Body Straight': {
      bg: '#EAF3DE', label: '#3B6D11', val: '#27500A', sub: '#639922',
      valText: 'Body straight ✓', subText: 'looking good, keep it up',
    },
    'Lower Hips': {
      bg: '#FAEEDA', label: '#854F0B', val: '#633806', sub: '#BA7517',
      valText: 'Lower your hips', subText: 'bring hips down slightly',
    },
    'Fix Posture': {
      bg: '#FAECE7', label: '#993C1D', val: '#712B13', sub: '#D85A30',
      valText: 'Fix posture ⚠️', subText: 'body alignment off',
    },
    'Full Body Not Visible': {
      bg: '#F5F5F0', label: '#888780', val: '#555550', sub: '#B4B2A9',
      valText: 'Not visible', subText: 'step back for full body',
    },
  };

  function updatePostureCard(posture) {
    const style = postureMap[posture] || postureMap['Body Straight'];
    els.postureCard.style.background  = style.bg;
    els.postureLabel.style.color      = style.label;
    els.postureVal.style.color        = style.val;
    els.postureVal.textContent        = style.valText;
    els.postureSub.style.color        = style.sub;
    els.postureSub.textContent        = style.subText;
  }

  // ── Feedback ─────────────────────────────────────────────────────────────
  function updateFeedback(feedback) {
    els.feedbackVal.textContent = feedback;
    els.feedbackVal.className   =
      feedback === 'Good Depth' ? 'analytic-val green' : 'analytic-val coral';
  }

  // ── Loading overlay ───────────────────────────────────────────────────────
  function hideLoading() {
    els.loadingOverlay.classList.add('hidden');
  }

  // ── Main update (called every frame) ─────────────────────────────────────
  function update(state) {
    // Rep ring
    updateRing(state.counter);
    if (state.counter > lastRepCount) {
      pulseRing();
      lastRepCount = state.counter;
    }

    // Stage
    els.stageVal.textContent = state.stage;
    els.stageSub.textContent =
      state.stage === 'UP' ? 'arms extended' : 'going down';

    // Feedback & posture
    updateFeedback(state.feedback);
    updatePostureCard(state.postureFeedback);

    // RPM and quality (derived from timer)
    const rpm = seconds > 0 ? Math.round((state.counter / seconds) * 60) : 0;
    els.rpmVal.textContent = rpm;

    const q = state.counter > 0
      ? Math.min(10, 7.5 + rpm * 0.08).toFixed(1)
      : '—';
    els.qualityVal.textContent = state.counter > 0 ? `${q}/10` : '—';
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    lastRepCount = 0;
    resetTimer();
    stopMotivRotation();
    motivIdx = 0;
    startMotivRotation();
    updateRing(0);
    els.rpmVal.textContent     = '0';
    els.qualityVal.textContent = '—';
    els.stageVal.textContent   = '—';
    updateFeedback('—');
    updatePostureCard('Body Straight');
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return { startTimer, resetTimer, getSeconds, startMotivRotation, update, reset, hideLoading };

})();
