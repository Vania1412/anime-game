from flask import Flask, request, jsonify, render_template, redirect, url_for
import random
from pytubefix import YouTube  # Use pytubefix instead of pytube
from pytubefix.cli import on_progress

app = Flask(__name__)

# Sample YouTube Playlist (Replace with your own playlist links)
YOUTUBE_PLAYLIST = [
    "https://youtu.be/zkOYWw0u8as",  # Cleaned link
    "https://youtu.be/wOleNo7T6_4",   
    "https://youtu.be/asyT-N1Ip70",   
    "https://youtu.be/60_2zt9l3Yk",  # Cleaned link
    "https://youtu.be/S3v5gcwNeE8",   
    "https://youtu.be/S0_qFgkDJxg",   
    "https://youtu.be/iOrkj_MFXm8",   
    "https://youtu.be/_5WvUPHF5f8",  
    "https://youtu.be/oG4eu4HMtbo",   
    "https://youtu.be/VekCU4YJiR8",   
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
    "BanG Dream! Ave Mujica",   
]

# Store game state (for simplicity, storing it globally)
game_data = {}

# Set to keep track of used links
used_urls = set()

def get_random_song_clip():
    """Fetch a random song and extract a random clip, ensuring no duplicate link is selected"""
    if len(used_urls) == len(YOUTUBE_PLAYLIST):
        # If all links have been used, reset the used_urls set
        used_urls.clear()

    # Randomly select a YouTube URL
    r = random.randint(0, len(YOUTUBE_PLAYLIST) - 1)
    url = YOUTUBE_PLAYLIST[r]
    
    # Skip already used URLs
    while url in used_urls:
        r = random.randint(0, len(YOUTUBE_PLAYLIST) - 1)
        url = YOUTUBE_PLAYLIST[r]

    try:
        yt = YouTube(url, on_progress_callback=on_progress)  # Using pytubefix
        yt.streams.filter(progressive=True, file_extension='mp4')  # Fetch available streams
        
        # Filter for audio only (or choose any other stream type you prefer)
        stream = yt.streams.filter(only_audio=True).first()
        
        if not stream:
            raise ValueError("No audio stream available.")
        
        # Generate random start time (1-30 sec for example)
        duration = yt.length  # Total duration in sec
        start_time = random.randint(0, max(1, duration - 5))  # Ensure clip is playable
        
        # Mark the URL as used
        used_urls.add(url)

        return {"url": stream.url, "start_time": start_time, "correct_answer": ANSWER_LIST[r]}
    except Exception as e:
        app.logger.error(f"Error fetching YouTube clip: {e}")
        return {"error": str(e)}
  
@app.route('/')
def home():
    """Start game page"""
    return render_template('index.html')
 
@app.route('/start_game', methods=['POST'])
def start_game():
    """Start the game, save questions, and return a JSON response"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON format"}), 400

        difficulty = int(data.get("difficulty", 3))  # Difficulty should correspond to the duration in seconds
        question_count = int(data.get("question_count", 5))  # Get the number of questions

        # Generate questions based on the difficulty and number of questions
        questions = [get_random_song_clip() for _ in range(question_count)]

        # Store the questions and difficulty in the game data
        game_data['questions'] = questions
        game_data['difficulty'] = difficulty
        game_data['current_question'] = 0  # Start at the first question
        game_data['score'] = 0  # Start with a score of 0

        # Return the questions and difficulty as JSON
        return jsonify({"questions": questions, "difficulty": difficulty,
                        "current_question": game_data['current_question'], "score": game_data['score']})

    except Exception as e:
        app.logger.error(f"Error in start_game route: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/question', methods=['GET', 'POST'])
def answer_question():
    """Serve the current question and handle the answer"""
    try:
        if 'current_question' not in game_data or game_data['current_question'] >= len(game_data['questions']):
            return jsonify({"error": "No more questions"}), 400

        current_question = game_data['current_question']
        question = game_data['questions'][current_question]
        correct_answer = ANSWER_LIST[current_question]  # Get the correct answer

        if request.method == 'POST':
            # Handle the submitted answer
            answer = request.form.get('answer')
            # Check if the answer is correct
            if answer.strip() == correct_answer:
                game_data['score'] += 1
                message = "Correct!"
            else:
                message = f"Incorrect! The correct answer is: {correct_answer}"

            # Move to the next question
            game_data['current_question'] += 1

            # If there are more questions, redirect to the next question page
            if game_data['current_question'] < len(game_data['questions']):
                return render_template('question.html', question=question, message=message)
            else:
                # Game ends
                return render_template('game_over.html', score=game_data['score'])

        # Render the question page with the current question's data
        return render_template('question.html', question=question, message=None)

    except Exception as e:
        app.logger.error(f"Error in answer_question route: {e}")
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)
