/**
 * workoutLogic.js
 * Pure JS port of the Python push-up detection logic from detector.py.
 *
 * Landmark indices follow MediaPipe's standard 33-point pose model:
 *   https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 *
 * Exported state is consumed by ui.js each frame.
 */

// ── MediaPipe landmark indices ──────────────────────────────────────────────
const LM = {
  RIGHT_SHOULDER: 12,
  RIGHT_ELBOW:    14,
  RIGHT_WRIST:    16,
  LEFT_SHOULDER:  11,
  LEFT_ELBOW:     13,
  LEFT_WRIST:     15,
  RIGHT_HIP:      24,
  RIGHT_ANKLE:    28,
};

// ── State ───────────────────────────────────────────────────────────────────
const workoutState = {
  counter:         0,
  stage:           'DOWN',
  feedback:        '—',
  postureFeedback: '—',
  angle:           0,
  bodyAngle:       0,
  bodyDetected:    false,
};

let previousAngle = 0;

// ── Utility ─────────────────────────────────────────────────────────────────

/**
 * Calculate the angle (degrees) at joint B, formed by points A–B–C.
 * @param {[number, number]} a
 * @param {[number, number]} b
 * @param {[number, number]} c
 * @returns {number}
 */
function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c[1] - b[1], c[0] - b[0]) -
    Math.atan2(a[1] - b[1], a[0] - b[0]);

  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Extract [x, y] from a single MediaPipe landmark object.
 * @param {object} lm
 * @returns {[number, number]}
 */
function xy(lm) {
  return [lm.x, lm.y];
}

// ── Main processing function ─────────────────────────────────────────────────

/**
 * Process one frame of MediaPipe results and update workoutState.
 * Called by poseDetector.js on every frame.
 * @param {object} results  - MediaPipe Pose results object
 */
function processFrame(results) {
  if (!results.poseLandmarks) return;

  const lms = results.poseLandmarks;

  // Pick whichever side has a more visible shoulder as the "active" arm.
  // Falls back to the right side (matching original Python code).
  const useLeft =
    lms[LM.LEFT_SHOULDER].visibility > lms[LM.RIGHT_SHOULDER].visibility;

  const shoulderIdx = useLeft ? LM.LEFT_SHOULDER  : LM.RIGHT_SHOULDER;
  const elbowIdx    = useLeft ? LM.LEFT_ELBOW     : LM.RIGHT_ELBOW;
  const wristIdx    = useLeft ? LM.LEFT_WRIST     : LM.RIGHT_WRIST;
  const hipIdx      = useLeft ? 23                : LM.RIGHT_HIP;
  const ankleIdx    = useLeft ? 27                : LM.RIGHT_ANKLE;

  const shoulder = xy(lms[shoulderIdx]);
  const elbow    = xy(lms[elbowIdx]);
  const wrist    = xy(lms[wristIdx]);
  const hip      = xy(lms[hipIdx]);
  const ankle    = xy(lms[ankleIdx]);

  // Smoothed elbow angle
  const rawAngle = calculateAngle(shoulder, elbow, wrist);
  const smoothed = Math.round((rawAngle + previousAngle) / 2);
  previousAngle  = smoothed;
  workoutState.angle = smoothed;

  // Body visibility check
  const hipVisible   = lms[hipIdx].visibility   > 0.7;
  const ankleVisible = lms[ankleIdx].visibility > 0.7;
  workoutState.bodyDetected = hipVisible && ankleVisible;

  if (workoutState.bodyDetected) {
    const bodyAngle = calculateAngle(shoulder, hip, ankle);
    workoutState.bodyAngle = Math.round(bodyAngle);

    // ── Rep counting (push-up logic) ────────────────────────────────────────
    if (smoothed > 150 && bodyAngle > 145) {
      workoutState.stage = 'UP';
    }
    if (smoothed < 90 && bodyAngle > 145 && workoutState.stage === 'UP') {
      workoutState.stage = 'DOWN';
      workoutState.counter++;
    }

    // ── Posture feedback ─────────────────────────────────────────────────────
    if (bodyAngle > 160) {
      workoutState.postureFeedback = 'Body Straight';
    } else if (bodyAngle > 140) {
      workoutState.postureFeedback = 'Lower Hips';
    } else {
      workoutState.postureFeedback = 'Fix Posture';
    }
  } else {
    workoutState.postureFeedback = 'Full Body Not Visible';
  }

  // ── Depth feedback ──────────────────────────────────────────────────────
  if (smoothed > 160) {
    workoutState.feedback = 'Lockout';
  } else if (smoothed > 90) {
    workoutState.feedback = 'Go Lower';
  } else {
    workoutState.feedback = 'Good Depth';
  }
}

/**
 * Reset all counters and state (called by the Reset button).
 */
function resetWorkout() {
  workoutState.counter         = 0;
  workoutState.stage           = 'DOWN';
  workoutState.feedback        = '—';
  workoutState.postureFeedback = '—';
  workoutState.angle           = 0;
  workoutState.bodyAngle       = 0;
  workoutState.bodyDetected    = false;
  previousAngle                = 0;
}
