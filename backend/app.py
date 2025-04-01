from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import random
from pytubefix import YouTube
from pytubefix.cli import on_progress
from youtube_clips import YOUTUBE_CLIPS, PRE_CACHED_CLIPS


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})   # Enable CORS for React frontend

selected_animes = set(YOUTUBE_CLIPS.values())

@app.route('/get_anime_list', methods=['GET'])
def get_anime_list():
    """Return a list of available animes for the game."""
    return jsonify({"animes": list(set(YOUTUBE_CLIPS.values()))}) 


# Set to track used URLs
used_urls = set()

def get_random_song_clip(difficulty):
    """Fetch a random song and extract a clip, ensuring no duplicate link.""" 
    global selected_animes  # Ensure we use the modified list

    filtered_clips = {k: v for k, v in YOUTUBE_CLIPS.items() if v in selected_animes}
    
    if not filtered_clips:  # If the user unselects everything, use all animes
        filtered_clips = YOUTUBE_CLIPS  

    if len(used_urls) == len(filtered_clips):
        used_urls.clear()  # Reset if all links are used
 
    url = random.choice(list(filtered_clips.keys()))
    while url in used_urls: 
        url = random.choice(list(filtered_clips.keys()))

    try: 
        cached_data = PRE_CACHED_CLIPS[url]
        duration = cached_data["duration"]
        start_time = random.randint(0, min(89 - difficulty, duration - difficulty))
        used_urls.add(url)

        return {
            "url": cached_data["stream_url"],
            "start_time": start_time, 
            "correct_answer": filtered_clips[url],  # Get anime title
            "title": filtered_clips[url],
            "youtube_id": cached_data["youtube_id"]
        }
    except Exception as e:
        app.logger.error(f"Error fetching YouTube clip: {e}")
        return {"error": str(e)}

@app.route('/start_game', methods=['POST'])
def start_game():
    """Start a new game and return questions as JSON."""
    global selected_animes
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        difficulty = int(data.get("difficulty", 3))

        is_death_mode = data.get("death_mode", False)

        is_multi_track_mode = data.get("multi_track_mode", False)  # New flag for Multi-Track Mode

        selected_animes = set(data["selected_animes"]) 

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