from flask import Flask, render_template, Response, jsonify
from detector import generate_frames, counter, stage, feedback

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@app.route('/stats')
def stats():
    import detector
    return jsonify({
        'counter': detector.counter,
        'stage': detector.stage,
        'feedback': detector.feedback,
        'posture': getattr(detector, 'posture_feedback', '—')
    })

if __name__ == "__main__":
    app.run(debug=True)