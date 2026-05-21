# detector.py
import cv2
import mediapipe as mp
import numpy as np

# MediaPipe setup
mp_pose = mp.solutions.pose
posture_feedback = "—"

pose = mp_pose.Pose(
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7,
    smooth_landmarks=True
)

# Webcam setup
camera = cv2.VideoCapture(0)

camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

# Global variables
counter = 0
stage = "DOWN"
feedback = ""
previous_angle = 0


def calculate_angle(a, b, c):

    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - \
              np.arctan2(a[1]-b[1], a[0]-b[0])

    angle = np.abs(radians * 180.0 / np.pi)

    if angle > 180:
        angle = 360 - angle

    return angle


def generate_frames():

    global counter, stage, feedback, previous_angle, posture_feedback
    

    while True:

        success, frame = camera.read()

        if not success:
            break

        frame = cv2.flip(frame, 1)

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = pose.process(rgb_frame)

        try:

            landmarks = results.pose_landmarks.landmark

            shoulder = [
                landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y
            ]

            elbow = [
                landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y
            ]

            wrist = [
                landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y
            ]
            
            
            hip = [
                landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y
            ]

            ankle = [
                landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x,
                landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y
            ]
            
            hip_visibility = landmarks[
                mp_pose.PoseLandmark.RIGHT_HIP.value
            ].visibility

            ankle_visibility = landmarks[
                mp_pose.PoseLandmark.RIGHT_ANKLE.value
            ].visibility
            
            raw_angle = calculate_angle(shoulder, elbow, wrist)
            
            body_detected = False

            if hip_visibility > 0.7 and ankle_visibility > 0.7:

                body_detected = True

                body_angle = calculate_angle(
                    shoulder,
                    hip,
                    ankle
                )
                

            angle = int((raw_angle + previous_angle) / 2)

            previous_angle = angle

            # Push-up logic
            if body_detected:

                if angle > 150 and body_angle > 145:
                    stage = "UP"

                if angle < 90 and body_angle > 145 and stage == "UP":
                    stage = "DOWN"
                    counter += 1

            # Feedback logic
            if angle > 160:
                feedback = "Lockout"

            elif angle > 90:
                feedback = "Go Lower"

            else:
                feedback = "Good Depth"
                
            # Posture analysis
            if body_detected:

                if body_angle > 160:
                    posture_feedback = "Body Straight"

                elif body_angle > 140:
                    posture_feedback = "Lower Hips"

                else:
                    posture_feedback = "Fix Posture"

            else:

                posture_feedback = "Full Body Not Visible"

            # Dynamic feedback colors
            if feedback == "Good Depth":
                feedback_color = (0, 255, 0)
            else:
                feedback_color = (0, 165, 255)

            # Frame dimensions
            h, w, _ = frame.shape

            # Coordinate conversion
            shoulder_coords = tuple(np.multiply(shoulder, [w, h]).astype(int))
            elbow_coords = tuple(np.multiply(elbow, [w, h]).astype(int))
            wrist_coords = tuple(np.multiply(wrist, [w, h]).astype(int))
            hip_coords = tuple(np.multiply(hip, [w, h]).astype(int))
            ankle_coords = tuple(np.multiply(ankle, [w, h]).astype(int))

            # Draw arm lines
            cv2.line(frame, shoulder_coords, elbow_coords, (0,255,200), 2)
            cv2.line(frame, elbow_coords, wrist_coords, (0,255,200), 2)
            cv2.line(frame, shoulder_coords, hip_coords, (255,255,0), 2)
            cv2.line(frame, hip_coords, ankle_coords, (255,255,0), 2)

            # UI Overlay
            # overlay = frame.copy()

            # cv2.rectangle(
            #     overlay,
            #     (10, 10),
            #     (420, 340),
            #     (20, 20, 20),
            #     -1
            # )

            # frame = cv2.addWeighted(
            #     overlay,
            #     0.75,
            #     frame,
            #     0.25,
            #     0
            # )

            # Title
            # cv2.putText(
            #     frame,
            #     'AI Workout Analyzer',
            #     (20, 50),
            #     cv2.FONT_HERSHEY_SIMPLEX,
            #     1,
            #     (255,255,255),
            #     2,
            #     cv2.LINE_AA
            # )

            # Divider
            # cv2.line(frame, (20, 70), (360, 70), (80,80,80), 1)

            # Metrics
            # cv2.putText(
            #     frame,
            #     f'Angle: {angle}',
            #     (20, 110),
            #     cv2.FONT_HERSHEY_SIMPLEX,
            #     0.8,
            #     (0,255,200),
            #     2,
            #     cv2.LINE_AA
            # )

            # cv2.putText(
            #     frame,
            #     f'Reps: {counter}',
            #     (20, 150),
            #     cv2.FONT_HERSHEY_SIMPLEX,
            #     0.8,
            #     (255,255,255),
            #     2,
            #     cv2.LINE_AA
            # )

            # cv2.putText(
            #     frame,
            #     f'Stage: {stage}',
            #     (20, 190),
            #     cv2.FONT_HERSHEY_SIMPLEX,
            #     0.8,
            #     (255,255,255),
            #     2,
            #     cv2.LINE_AA
            # )

            # cv2.putText(
            #     frame,
            #     f'Feedback: {feedback}',
            #     (20, 230),
            #     cv2.FONT_HERSHEY_SIMPLEX,
            #     0.8,
            #     feedback_color,
            #     2,
            #     cv2.LINE_AA
            # )
            
            # cv2.putText(
            #     frame,
            #     f'Body Angle: {int(body_angle)}',
            #     (20, 270),
            #     cv2.FONT_HERSHEY_SIMPLEX,
            #     0.8,
            #     (255,255,0),
            #     2,
            #     cv2.LINE_AA
            # )

            # cv2.putText(
            #     frame,
            #     f'Posture: {posture_feedback}',
            #     (20, 310),
            #     cv2.FONT_HERSHEY_SIMPLEX,
            #     0.8,
            #     (255,255,255),
            #     2,
            #     cv2.LINE_AA
            # )

        except:
            pass

        # Convert frame to JPEG
        ret, buffer = cv2.imencode('.jpg', frame)

        frame = buffer.tobytes()

        yield (
            b'--frame\r\n'
            b'Content-Type: image/jpeg\r\n\r\n' +
            frame +
            b'\r\n'
        )