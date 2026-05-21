# AI Workout Analyzer

Real-time push-up counter and posture analyzer using computer vision.

## Tech Stack
Python · Flask · OpenCV · MediaPipe

## Features
- Real-time rep counting
- Posture feedback (body angle analysis)
- Session timer
- Live AI coaching cues

## Setup
```bash
pip install -r requirements.txt
python app.py
```
Then open http://localhost:5000

## How It Works
1. OpenCV captures webcam frames
2. MediaPipe detects 33 body landmarks
3. Joint angles are calculated to determine rep stage
4. AI feedback is generated based on depth and posture