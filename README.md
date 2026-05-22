# AI Workout Analyzer

A **fully browser-based** push-up counter and form analyser powered by MediaPipe Pose.  
No Python, no server, no wearables — just open `index.html` and go.

---

## Project structure

```
AI-Workout-Analyzer/
│
├── index.html          ← Entry point / UI markup
├── README.md
│
├── css/
│   └── style.css       ← All styles (CSS variables, layout, components)
│
├── js/
│   ├── app.js          ← Boot / wiring layer (loads after all other scripts)
│   ├── poseDetector.js ← Webcam init + MediaPipe Pose wrapper + skeleton draw
│   ├── workoutLogic.js ← Angle calc, rep counting, feedback (port of detector.py)
│   └── ui.js           ← All DOM updates: ring, timer, cards, motivational text
│
├── assets/
│   ├── icons/          ← SVG / PNG icons (if needed)
│   └── images/         ← Static images (if needed)
│
└── models/             ← Reserved for locally-hosted WASM model files (optional)
```

---

## How it works

| Layer | Technology | Role |
|---|---|---|
| Capture | WebRTC (`getUserMedia`) | Streams webcam at 1280×720 |
| Pose estimation | [MediaPipe Pose JS](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) via CDN | 33 landmark detection on every frame, fully on-device via WASM |
| Skeleton overlay | Canvas 2D API | Draws mirrored arm/body lines and joint dots on top of the video |
| Workout logic | `workoutLogic.js` | Calculates elbow + body angles, counts reps, emits feedback strings |
| UI | `ui.js` | Updates rep ring, stage card, posture card, timer, RPM, quality score |

### Rep counting algorithm

1. Extract `shoulder → elbow → wrist` angle (smoothed with a 2-frame running average).
2. Extract `shoulder → hip → ankle` body angle to verify plank position.
3. When `elbow angle > 150°` **and** `body angle > 145°` → stage = **UP**.
4. When `elbow angle < 90°` **and** `body angle > 145°` **and** stage was UP → stage = **DOWN**, increment counter.

---

## Running locally

Because MediaPipe loads WASM files from a CDN, the page must be served over HTTP (not opened as a `file://` URL). The simplest options:

**VS Code Live Server**
Install the *Live Server* extension, right-click `index.html` → *Open with Live Server*.

**Python**
```bash
python -m http.server 8080
# then open http://localhost:8080
```

**Node (npx)**
```bash
npx serve .
```

---

## Offline / self-hosted model (optional)

If you need the app to work without internet access, download the MediaPipe Pose WASM bundle and place the files in `models/`. Then update the `locateFile` callback in `js/poseDetector.js`:

```js
this.pose = new Pose({
  locateFile: (file) => `models/${file}`,
});
```

And update the CDN `<script>` tags in `index.html` to point to locally-hosted copies of the MediaPipe JS utilities.

---

## Tech stack

- **MediaPipe Pose** — on-device ML pose estimation
- **WebRTC** — browser webcam access  
- **Canvas 2D API** — skeleton overlay rendering  
- **Vanilla JS (ES2020)** — no build step, no bundler  
- **CSS custom properties** — consistent theming

---

## Extending to other exercises

Each exercise needs its own logic module. To add squats, for example:

1. Create `js/exercises/squats.js` with a `processSquatFrame(results)` function and its own state object.
2. Export it similarly to `workoutLogic.js`.
3. In `app.js`, switch between exercise modules based on `#exercise-select` value.
4. Enable the squats `<option>` in `index.html`.
