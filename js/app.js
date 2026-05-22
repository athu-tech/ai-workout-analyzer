/**
 * app.js
 * Entry point. Wires together PoseDetector, workoutLogic, and ui.
 *
 * Boot sequence:
 *   1. Start UI timer + motivational rotation
 *   2. Init PoseDetector (requests webcam, loads MediaPipe WASM)
 *   3. On each frame: processFrame() → ui.update()
 *   4. Hide loading overlay once the first result arrives
 */

(async () => {

  // ── Start UI systems ──────────────────────────────────────────────────────
  ui.startTimer();
  ui.startMotivRotation();

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const videoEl  = document.getElementById('webcam');
  const canvasEl = document.getElementById('overlay-canvas');
  const resetBtn = document.getElementById('reset-btn');

  let modelReady = false;

  // ── Frame callback ────────────────────────────────────────────────────────
  function onPoseResults(results) {
    // Hide loading spinner on first successful frame
    if (!modelReady) {
      modelReady = true;
      ui.hideLoading();
    }

    // Run workout logic
    processFrame(results);

    // Push updated state to UI
    ui.update(workoutState);
  }

  // ── Init pose detector ────────────────────────────────────────────────────
  const detector = new PoseDetector(videoEl, canvasEl, onPoseResults);

  try {
    await detector.init();
  } catch (err) {
    console.error('Failed to initialise pose detector:', err);

    // Show a user-friendly error in the loading overlay
    const overlay  = document.getElementById('loading-overlay');
    const spinner  = overlay.querySelector('.loading-spinner');
    const text     = overlay.querySelector('.loading-text');
    spinner.style.display = 'none';
    text.textContent = '⚠️ Camera access denied or model failed to load.';
    text.style.color = '#D85A30';
  }

  // ── Reset button ──────────────────────────────────────────────────────────
  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset session? This will clear your rep count and timer.')) return;
    resetWorkout();   // workoutLogic.js
    ui.reset();       // ui.js
  });

})();
