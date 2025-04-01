from pytubefix import YouTube
import os

try:
    yt = YouTube(
        'https://www.youtube.com/watch?v=W4YKPLS7o8o',
        use_po_token=True,
        token_file='tokens.json'
    )
    print(f"Title: {yt.title}")
    print(f"Tokens file created at: {os.path.abspath('tokens.json')}")
except Exception as e:
    print(f"Error: {e}")