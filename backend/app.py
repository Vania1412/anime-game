from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
from pytubefix import YouTube
from pytubefix.cli import on_progress

app = Flask(__name__, static_folder='dist', static_url_path='/')
CORS(app)  # Enable CORS for React frontend

# Sample YouTube Playlist and Answers
YOUTUBE_PLAYLIST = [
    "https://youtu.be/zkOYWw0u8as",
    "https://youtu.be/wOleNo7T6_4",
    "https://youtu.be/asyT-N1Ip70",
    "https://youtu.be/60_2zt9l3Yk",
    "https://youtu.be/S3v5gcwNeE8",
    "https://youtu.be/S0_qFgkDJxg",
    "https://youtu.be/iOrkj_MFXm8",
    "https://youtu.be/_5WvUPHF5f8",
    "https://youtu.be/oG4eu4HMtbo",
    "https://youtu.be/VekCU4YJiR8",
    "https://youtu.be/-jYqJCzZ8zs",
    "https://youtu.be/FWXkipC-vqs",
]

ANSWER_LIST = [
    "SAKAMOTO DAYS",
    "The Apothecary Diaries",
    "Danjon Meshi",
    "Danjon Meshi",
    "Moriarty the Patriot",
    "Moriarty the Patriot",
    "GOSICK",
    "DEADMAN WONDERLAND",
    "My Dress-Up Darling",
    "Banana Fish",
    "Banana Fish",
    "BanG Dream! Ave Mujica",
]

# Set to keep track of used links
used_urls = set()

def get_random_song_clip(difficulty):
    """Fetch a random song and extract a clip, ensuring no duplicate link."""
    if len(used_urls) == len(YOUTUBE_PLAYLIST):
        used_urls.clear()  # Reset if all links are used

    r = random.randint(0, len(YOUTUBE_PLAYLIST) - 1)
    url = YOUTUBE_PLAYLIST[r]
    while url in used_urls:
        r = random.randint(0, len(YOUTUBE_PLAYLIST) - 1)
        url = YOUTUBE_PLAYLIST[r]

    try:
        yt = YouTube(url, on_progress_callback=on_progress)
        stream = yt.streams.filter(only_audio=True).first()
        
        if not stream:
            raise ValueError("No audio stream available.")
        
        duration = yt.length
        start_time = random.randint(0, min(90 - difficulty, duration - difficulty))
        used_urls.add(url)

        return {
            "url": stream.url,
            "start_time": start_time,
            "correct_answer": ANSWER_LIST[r],
            "title": ANSWER_LIST[r], 
            "youtube_id": yt.video_id
        }
    except Exception as e:
        app.logger.error(f"Error fetching YouTube clip: {e}")
        return {"error": str(e)}

@app.route('/start_game', methods=['POST'])
def start_game():
    """Start a new game and return questions as JSON."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        difficulty = int(data.get("difficulty", 3))
        question_count = int(data.get("question_count", 5))

        questions = [get_random_song_clip(difficulty) for _ in range(question_count)]

        return jsonify({
            "questions": questions,
            "difficulty": difficulty,
            "current_question": 0,
            "score": 0
        })
    except Exception as e:
        app.logger.error(f"Error in start_game: {e}")
        return jsonify({"error": "Internal server error"}), 500
 
# =========================
# SERVE REACT FRONTEND
# =========================
@app.route('/')
def serve_react():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static_files(path):
    return send_from_directory(app.static_folder, path)

# =========================
# RUN FLASK SERVER
# =========================
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
