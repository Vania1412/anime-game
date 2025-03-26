from pytubefix import YouTube
from pytubefix.cli import on_progress

url = "https://youtu.be/_5WvUPHF5f8"  # Full URL

try: 
    yt = YouTube(url, on_progress_callback = on_progress)
    print(f"Video Title: {yt.title}")  # Confirm video metadata loads
    print(f"Available Streams: {yt.streams}")  # List all streams
    stream = yt.streams.first()  # Get the first stream
    print(f"Selected Stream: {stream}")
    print(f"Stream URL: {stream.url}")
except Exception as e:
    print(f"Error fetching YouTube clip: {str(e)}")