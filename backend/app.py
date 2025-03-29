from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
from pytubefix import YouTube
from pytubefix.cli import on_progress

app = Flask(__name__, static_folder='dist', static_url_path='/')
CORS(app)  # Enable CORS for React frontend

# Dictionary mapping YouTube links to anime titles
YOUTUBE_CLIPS = {
    "https://youtu.be/zkOYWw0u8as": "SAKAMOTO DAYS",
    "https://youtu.be/wOleNo7T6_4": "The Apothecary Diaries",
    "https://youtu.be/asyT-N1Ip70": "Danjon Meshi",
    "https://youtu.be/60_2zt9l3Yk": "Danjon Meshi",
    "https://youtu.be/S3v5gcwNeE8": "Moriarty the Patriot",
    "https://youtu.be/S0_qFgkDJxg": "Moriarty the Patriot",
    "https://youtu.be/iOrkj_MFXm8": "GOSICK",
    "https://youtu.be/_5WvUPHF5f8": "DEADMAN WONDERLAND",
    "https://youtu.be/oG4eu4HMtbo": "My Dress-Up Darling",
    "https://youtu.be/VekCU4YJiR8": "Banana Fish",
    "https://youtu.be/-jYqJCzZ8zs": "Banana Fish",
    "https://youtu.be/FWXkipC-vqs": "BanG Dream! Ave Mujica",
}

# Set to track used URLs
used_urls = set()

def get_random_song_clip(difficulty):
    """Fetch a random song and extract a clip, ensuring no duplicate link."""
    if len(used_urls) == len(YOUTUBE_CLIPS):
        used_urls.clear()  # Reset if all links are used

    url = random.choice(list(YOUTUBE_CLIPS.keys()))
    while url in used_urls:
        url = random.choice(list(YOUTUBE_CLIPS.keys()))

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
            "correct_answer": YOUTUBE_CLIPS[url],  # Get anime title
            "title": YOUTUBE_CLIPS[url],
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
 
        is_death_mode = data.get("death_mode", False)

        if is_death_mode:
            # Generate the first 10 questions for Death Mode
            questions = [get_random_song_clip(difficulty) for _ in range(5)]
        else:
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
 
@app.route('/next_question', methods=['POST'])
def next_question():
    """Handles fetching a new question when in Death Mode."""
    print("getting new questions")
    try:
        data = request.get_json()
        if not data or "difficulty" not in data:
            return jsonify({"error": "Invalid request format"}), 400

        difficulty = int(data["difficulty"])
        is_death_mode = data.get("is_death_mode", False)

        if is_death_mode:
            # Generate the next batch of 10 questions
            questions = [get_random_song_clip(difficulty) for _ in range(5)]
            return jsonify({"questions": questions})

        return jsonify({"error": "This endpoint is only for Death Mode"}), 400
    except Exception as e:
        app.logger.error(f"Error in next_question: {e}")
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
