from flask import Flask, request, jsonify
import random
from pytubefix import YouTube  # Use pytubefix instead of pytube
from pytubefix.cli import on_progress

app = Flask(__name__)

# Sample YouTube Playlist (Replace with your own playlist links)
YOUTUBE_PLAYLIST = [
    "https://youtu.be/zkOYWw0u8as",  # Cleaned link
    "https://youtu.be/dQw4w9WgXcQ",  # Example: Rick Astley
    "https://youtu.be/9bZkp7q19f0",  # Example: Gangnam Style
    "https://youtu.be/zkOYWw0u8as",  # Cleaned link
    "https://youtu.be/dQw4w9WgXcQ",  # Example: Rick Astley
    "https://youtu.be/9bZkp7q19f0",  # Example: Gangnam Style
]

def get_random_song_clip():
    """Fetch a random song and extract a random clip"""
    url = random.choice(YOUTUBE_PLAYLIST)
    try:
        yt = YouTube(url, on_progress_callback=on_progress)  # Using pytubefix
        yt.streams.filter(progressive=True, file_extension='mp4')  # Fetch available streams
        
        # Filter for audio only (or choose any other stream type you prefer)
        stream = yt.streams.filter(only_audio=True).first()
        
        if not stream:
            raise ValueError("No audio stream available.")
        
        # Download audio (temporary)
        file_path = stream.download(filename='temp_audio.mp4')
        
        # Generate random start time (1-30 sec for example)
        duration = yt.length  # Total duration in sec
        start_time = random.randint(0, max(1, duration - 5))  # Ensure clip is playable
        
        return {"url": url, "start_time": start_time}
    except Exception as e:
        app.logger.error(f"Error fetching YouTube clip: {e}")
        return {"error": str(e)}

@app.route('/start_game', methods=['POST'])
def start_game():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        difficulty = data.get("difficulty", 3)
        question_count = data.get("question_count", 5)
        
        questions = [get_random_song_clip() for _ in range(question_count)]
        
        return jsonify({"questions": questions, "difficulty": difficulty})
    except Exception as e:
        app.logger.error(f"Error in start_game route: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)
