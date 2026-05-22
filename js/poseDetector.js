/**
 * poseDetector.js
 * Wraps the MediaPipe Pose library.
 * Initialises webcam access, sets up the Pose model, and fires a callback
 * with landmark results on every processed frame.
 */

class PoseDetector {
  /**
   * @param {HTMLVideoElement} videoEl
   * @param {HTMLCanvasElement} canvasEl
   * @param {function(object): void} onResults  - called each frame with MediaPipe results
   */
  constructor(videoEl, canvasEl, onResults) {
    this.videoEl   = videoEl;
    this.canvasEl  = canvasEl;
    this.ctx       = canvasEl.getContext('2d');
    this.onResults = onResults;
    this.camera    = null;
    this.pose      = null;
  }

  async init() {
    // Initialise MediaPipe Pose
    this.pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    this.pose.setOptions({
      modelComplexity:        1,
      smoothLandmarks:        true,
      enableSegmentation:     false,
      smoothSegmentation:     false,
      minDetectionConfidence: 0.7,
      minTrackingConfidence:  0.7,
    });

    this.pose.onResults((results) => this._handleResults(results));

    // Request webcam access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
      audio: false,
    });

    this.videoEl.srcObject = stream;
    await new Promise((resolve) => {
      this.videoEl.onloadedmetadata = resolve;
    });

    // Use MediaPipe Camera utility to feed frames into the model
    this.camera = new Camera(this.videoEl, {
      onFrame: async () => {
        await this.pose.send({ image: this.videoEl });
      },
      width:  1280,
      height: 720,
    });

    await this.camera.start();
  }

  _handleResults(results) {
    const { canvasEl, ctx, videoEl } = this;

    // Match canvas size to the video element's display size
    canvasEl.width  = videoEl.videoWidth  || videoEl.clientWidth;
    canvasEl.height = videoEl.videoHeight || videoEl.clientHeight;

    ctx.save();

    // Mirror canvas to match the CSS-mirrored video
    ctx.translate(canvasEl.width, 0);
    ctx.scale(-1, 1);

    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    if (results.poseLandmarks) {
      this._drawSkeleton(results.poseLandmarks);
    }

    ctx.restore();

    // Fire the workout logic callback
    this.onResults(results);
  }

  _drawSkeleton(landmarks) {
    const { ctx, canvasEl } = this;
    const W = canvasEl.width;
    const H = canvasEl.height;

    // Helper to convert normalised coords → pixels
    const pt = (idx) => ({
      x: landmarks[idx].x * W,
      y: landmarks[idx].y * H,
    });

    // Define the connections to draw
    const armConnections = [
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
    ];

    const bodyConnections = [
      [11, 12], // shoulders
      [11, 23], [12, 24], // torso sides
      [23, 24], // hips
      [23, 25], [25, 27], // left leg
      [24, 26], [26, 28], // right leg
    ];

    // Body lines — yellow
    ctx.strokeStyle = 'rgba(255, 220, 50, 0.85)';
    ctx.lineWidth   = 2.5;
    for (const [a, b] of bodyConnections) {
      if (landmarks[a].visibility > 0.5 && landmarks[b].visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(pt(a).x, pt(a).y);
        ctx.lineTo(pt(b).x, pt(b).y);
        ctx.stroke();
      }
    }

    // Arm lines — cyan
    ctx.strokeStyle = 'rgba(0, 255, 200, 0.9)';
    ctx.lineWidth   = 2.5;
    for (const [a, b] of armConnections) {
      if (landmarks[a].visibility > 0.5 && landmarks[b].visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(pt(a).x, pt(a).y);
        ctx.lineTo(pt(b).x, pt(b).y);
        ctx.stroke();
      }
    }

    // Joint dots
    const keyJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    for (const idx of keyJoints) {
      if (landmarks[idx].visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(pt(idx).x, pt(idx).y, 5, 0, Math.PI * 2);
        ctx.fillStyle   = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(216, 90, 48, 0.9)';
        ctx.lineWidth   = 2;
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  stop() {
    if (this.camera) this.camera.stop();
  }
}
