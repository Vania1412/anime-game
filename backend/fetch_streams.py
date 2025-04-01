# fetch_streams.py
from pytubefix import YouTube
from pytubefix.cli import on_progress

from youtube_clips import YOUTUBE_CLIPS 

for url in YOUTUBE_CLIPS.keys():
    try:
        yt = YouTube(url, on_progress_callback=on_progress)
        stream = yt.streams.filter(only_audio=True).first()
        if not stream:
            raise ValueError("No audio stream available.")
        if stream: 
            print(f'"{url}": {{')
            print(f'    "stream_url": "{stream.url}",')
            print(f'    "duration": {yt.length},')  # Assuming 90s as requested
            print(f'    "youtube_id": "{yt.video_id}"')
            print('},')
        else:
            print(f"No stream for {url}")
    except Exception as e:
        print(f"Error for {url}: {e}")