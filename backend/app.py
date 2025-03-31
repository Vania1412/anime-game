from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
from pytubefix import YouTube
from pytubefix.cli import on_progress
from youtube_clips import YOUTUBE_CLIPS 


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})   # Enable CORS for React frontend


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
        yt = YouTube(url, on_progress_callback=on_progress, use_oauth=False, allow_oauth_cache=True)
        stream = yt.streams.filter(only_audio=True).first()
        
        if not stream:
            raise ValueError("No audio stream available.")
        
        duration = yt.length
        start_time = random.randint(0, min(89 - difficulty, duration - difficulty))
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
        
        is_multi_track_mode = data.get("multi_track_mode", False)  # New flag for Multi-Track Mode

        # If Multi-Track Mode is enabled
        if is_multi_track_mode:
            if is_death_mode:
                # In Death Mode with Multi-Track: Generate two songs for each question
                questions = [
                    [get_random_song_clip(difficulty), get_random_song_clip(difficulty)] 
                    for _ in range(5)  # You can change the number of questions
                ]
            else:
                # In Normal Mode with Multi-Track: Generate two songs for each question
                question_count = int(data.get("question_count", 5))
                questions = [
                    [get_random_song_clip(difficulty), get_random_song_clip(difficulty)] 
                    for _ in range(question_count)
                ]
        else:
            # If Multi-Track Mode is not enabled, handle as normal or death mode
            if is_death_mode:
                # Generate one random song for each question in Death Mode
                questions = [get_random_song_clip(difficulty) for _ in range(5)]
            else:
                # Generate one random song for each question in Normal Mode
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
        is_multi_track_mode = data.get("multi_track_mode", False)  # New flag for Multi-Track Mode

        if is_death_mode:
            if is_multi_track_mode:
                questions = [[get_random_song_clip(difficulty), get_random_song_clip(difficulty)] for _ in range(5)]
                return jsonify({"questions": questions})
            else:
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
def home():
    """API root endpoint."""
    return jsonify({"message": "Anime Game Backend API. Use /start_game or /next_question."})

# =========================
# RUN FLASK SERVER
# =========================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Use Render's PORT or default to 5000 locally
    app.run(host='0.0.0.0', port=port, debug=False)
