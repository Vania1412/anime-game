import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuestionScreen.css';
import '../index.css';

function QuestionScreen({ gameState, setGameState }) {
  const [answer, setAnswer] = useState('');
  const [answer2, setAnswer2] = useState('');
  const [feedback, setFeedback] = useState('');
  const [replayCount, setReplayCount] = useState(0);
  const [showYouTube, setShowYouTube] = useState(false);
  const [isLoadingNext, setIsLoadingNext] = useState(false);
  const [randomStart, setRandomStart] = useState(0);
  const [progress, setProgress] = useState(0); // New state for progress
  const [isAnswered, setIsAnswered] = useState(false);
  const [remainingLife, setRemainingLife] = useState(0);
  const audioRef = useRef(null);
  const audioRef2 = useRef(null);
  const timeStartRef = useRef(null);
  const timeEndRef = useRef(null);
  const navigate = useNavigate();


  const { questions, difficulty, currentQuestion, score, totalQuestions, currentDeadModeQuestion, maxReplays, maxLives, multi_track_mode } = gameState;
  const question = questions[currentQuestion] || {};
  const isDeathMode = JSON.parse(localStorage.getItem('isDeathMode') || 'false');
  const isMultiTrackMode = JSON.parse(multi_track_mode || 'false'); // Get Multi-Track Mode


  useEffect(() => {
    console.log("multi: ", isMultiTrackMode)
    console.log("question", question)
    if (!isMultiTrackMode && !question.url || isMultiTrackMode && !question[0].url && !question[1].url) return;

    const storedReplayCount = localStorage.getItem(`replayCount_${currentQuestion}`);
    setReplayCount(storedReplayCount !== null ? parseInt(storedReplayCount, 10) : 0);

    const answeredState = localStorage.getItem(`isAnswered_${currentQuestion}`);
    setIsAnswered(answeredState === "true");

    const answeredContent = localStorage.getItem(`answeredContent_${currentQuestion}`);
    setAnswer(answeredContent !== null ? answeredContent : '');

    const answeredContent2 = localStorage.getItem(`answeredContent2_${currentQuestion}`);
    setAnswer2(answeredContent2 !== null ? answeredContent2 : '');

    const remainLife = localStorage.getItem(`totalLife`)
    setRemainingLife(remainLife !== null ? parseInt(remainLife, 10) : maxLives);


    if (answeredContent !== null && !isMultiTrackMode) {
      const correctAnswer = question.correct_answer;
      if (answeredContent.trim() === correctAnswer) {
        setFeedback('Correct!');
      } else {
        setFeedback(`Incorrect! The correct answer is: ${correctAnswer}`);
      }
    } else if (answeredContent !== null && answeredContent2 !== null && isMultiTrackMode) {
      const correctAnswer1 = question[0].correct_answer; // Assume second correct answer exists
      const correctAnswer2 = question[1].correct_answer;

      if (answeredContent.trim() === correctAnswer1 && answeredContent2.trim() === correctAnswer2 || answeredContent.trim() === correctAnswer2 && answeredContent2.trim() === correctAnswer1) {
        setFeedback('Correct!');
      } else {
        setFeedback(`Incorrect! The correct answers are: ${correctAnswer1} and ${correctAnswer2}`);
      }

    }

    timeEndRef.current.textContent = "  " + formatTime(difficulty);

    const audioPlayer = audioRef.current;
    if (!isMultiTrackMode) {
      audioPlayer.src = question.url;
     audioPlayer.currentTime = question.start_time || 0;
 
     audioPlayer.onloadedmetadata = () => {
       audioPlayer.play().catch((error) => console.error("Playback failed:", error));
 
       audioPlayer.ontimeupdate = () => {
         const currentTime = audioPlayer.currentTime;
         const start = question.start_time || 0;
         const end = start + difficulty;
 
         if (currentTime >= start && currentTime < end) {
           const newProgress = Math.round(((currentTime - start) / difficulty) * 100);
           setProgress(newProgress); // Update state instead of ref
         } else if (currentTime >= end) {
           setProgress(100); // Update state instead of ref
           audioPlayer.pause();
         }
       };
     };
 
     audioPlayer.onended = () => {
       setProgress(100); // Update state instead of ref
     };
    } else {
      const audioPlayer2 = audioRef2.current;

      // Set sources and preload
      audioPlayer.src = question[0].url;
      audioPlayer2.src = question[1].url;
      audioPlayer.preload = 'auto'; // Encourage preloading
      audioPlayer2.preload = 'auto';

      audioPlayer.currentTime = question[0].start_time || 0;
      audioPlayer2.currentTime = question[1].start_time || 0;

      // Function to check if audio is buffered enough to play
      const isBuffered = (player) => {
        return new Promise((resolve) => {
          if (player.readyState >= 2) { // HAVE_CURRENT_DATA or higher
            resolve();
          } else {
            player.oncanplay = () => resolve();
          }
        });
      };

      // Wait for both to be playable
      const startPlayback = async () => {
        try {
          await Promise.all([isBuffered(audioPlayer), isBuffered(audioPlayer2)]);
          audioPlayer.play().catch((error) => console.error("Audio 1 Playback failed:", error));
          audioPlayer2.play().catch((error) => console.error("Audio 2 Playback failed:", error));
        } catch (error) {
          console.error("Error starting playback:", error);
        }
      };

      // Use audioPlayer as the controlling track for progress
      audioPlayer.ontimeupdate = () => {
        const currentTime = audioPlayer.currentTime;
        const start = question[0].start_time || 0;
        const end = start + difficulty;

        if (currentTime >= start && currentTime < end) {
          const newProgress = Math.min(100, Math.round(((currentTime - start) / (end - start)) * 100));
          setProgress(newProgress);
        } else if (currentTime >= end) {
          setProgress(100);
          audioPlayer.pause();
          audioPlayer2.pause();
        }
      };

      // audioPlayer2 only syncs end time
      audioPlayer2.ontimeupdate = () => {
        const currentTime = audioPlayer2.currentTime;
        const start = question[1].start_time || 0;
        const end = start + difficulty;
        if (currentTime >= end) {
          setProgress(100);
          audioPlayer.pause();
          audioPlayer2.pause();
        }
      };

      audioPlayer.onended = () => {
        setProgress(100);
        audioPlayer2.pause();
      };

      audioPlayer2.onended = () => {
        setProgress(100);
        audioPlayer.pause();
      };

      // Start playback (ideally after user interaction, see below)
      startPlayback();
    }

    if (timeStartRef.current) {
      timeStartRef.current.textContent = '00:00  ';
    }

    const randomStartTime = Math.floor(Math.random() * 90);
    setRandomStart(randomStartTime);
  }, [currentQuestion, question.url, question.start_time, difficulty]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isMultiTrackMode) {
      const userAnswer = answer.trim();
      const correctAnswer = question.correct_answer;

      if (userAnswer === correctAnswer) {
        setFeedback('Correct!');
        setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
      } else {
        setFeedback(`Incorrect! The correct answer is: ${correctAnswer}`);
        if (isDeathMode) {
          const newLife = remainingLife - 1;
          localStorage.setItem('totalLife', newLife);
          setRemainingLife(newLife);
        }
      }
    } else {
      const userAnswer1 = answer.trim();
      const userAnswer2 = answer2.trim();
      const correctAnswer1 = question[0].correct_answer;
      const correctAnswer2 = question[1].correct_answer;

      if (userAnswer1 === correctAnswer1 && userAnswer2 === correctAnswer2 || userAnswer1 === correctAnswer2 && userAnswer2 === correctAnswer1) {
        setFeedback('Correct!');
        setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
      } else {
        setFeedback(`Incorrect! The correct answers are: ${correctAnswer1} and ${correctAnswer2}`);
        if (isDeathMode) {
          const newLife = remainingLife - 1;
          localStorage.setItem('totalLife', newLife);
          setRemainingLife(newLife);
        }
      }
    }

    document.getElementById('next-question-link').style.display = 'inline-block';
    setIsAnswered(true);
    localStorage.setItem(`isAnswered_${currentQuestion}`, "true");
    localStorage.setItem(`answeredContent_${currentQuestion}`, answer);
    if (isMultiTrackMode) {
      localStorage.setItem(`answeredContent2_${currentQuestion}`, answer2);
    }
  };

  const handleReplay = () => {
    if (replayCount >= maxReplays && maxReplays != -1) return;

    if (!isMultiTrackMode) {
      if (audioRef.current) {
        const audioPlayer = audioRef.current;
        audioPlayer.pause();
        audioPlayer.currentTime = question.start_time || 0;
        setProgress(0); // Reset progress state
        audioPlayer.play().catch((error) => console.error("Replay failed:", error));
  
         
      }
    } else {
      const audioPlayer = audioRef.current;
      const audioPlayer2 = audioRef2.current;
      if (audioPlayer && audioPlayer2) {
        audioPlayer.pause();
        audioPlayer2.pause();
        audioPlayer.currentTime = question[0].start_time || 0;
        audioPlayer2.currentTime = question[1].start_time || 0;
        setProgress(0);

        const startReplay = async () => {
          try {
            await Promise.all([
              audioPlayer.play().catch((error) => console.error("Audio 1 Replay failed:", error)),
              audioPlayer2.play().catch((error) => console.error("Audio 2 Replay failed:", error)),
            ]);
          } catch (error) {
            console.error("Replay sync failed:", error);
          }
        };
        startReplay();
      }
    }

    setReplayCount((prev) => {
      const newCount = prev + 1;
      localStorage.setItem(`replayCount_${currentQuestion}`, newCount);
      return newCount;
    });
  };

  const handleNext = async () => {
    if (isLoadingNext) return;
    setIsLoadingNext(true);

    localStorage.removeItem(`answeredContent_${currentQuestion}`);
    localStorage.removeItem(`answeredContent2_${currentQuestion}`);
    localStorage.removeItem(`isAnswered_${currentQuestion}`);

    if (isDeathMode && remainingLife <= 0) {
      console.log(1);
      setGameState((prev) => ({
        ...prev,
        currentDeadModeQuestion: prev.currentDeadModeQuestion + 1,
      }));
      navigate("/game_over");
    } else if (currentQuestion + 1 < questions.length) {
      console.log(2);
      setGameState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        currentDeadModeQuestion: prev.currentDeadModeQuestion + 1,
      }));
    } else if (isDeathMode) {
      console.log(3);
      try {
        const response = await fetch("https://anime-game-tgme.onrender.com/next_question", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty, is_death_mode: true, multi_track_mode: isMultiTrackMode }),
        });

        if (!response.ok) throw new Error("Failed to fetch new questions");

        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          setGameState((prev) => ({
            ...prev,
            questions: data.questions,
            currentQuestion: 0,
            currentDeadModeQuestion: prev.currentDeadModeQuestion + 1,
          }));
          localStorage.setItem(`replayCount_${0}`, 0);
          setReplayCount(0);
        } else {
          navigate("/game_over");
        }
      } catch (error) {
        console.error("Error fetching next batch:", error);
        navigate("/game_over");
      }
    } else {
      console.log(4);
      navigate("/game_over");
    }

    setAnswer('');
    setAnswer2('');
    setFeedback('');
    setShowYouTube(false);
    setIsAnswered(false);
    document.getElementById('next-question-link').style.display = 'none';
    setIsLoadingNext(false);

    localStorage.removeItem(`replayCount_${currentQuestion + 1}`);
    localStorage.removeItem(`isAnswered_${currentQuestion + 1}`);
    localStorage.removeItem(`answeredContent_${currentQuestion + 1}`);
    localStorage.removeItem(`answeredContent2_${currentQuestion + 1}`);
  };

  const closeYouTubeModal = () => {
    setShowYouTube(false);
  };

  return (
    <div>
      <h1>Question #{currentDeadModeQuestion + 1}</h1>
      <div id="audio-container">
        <audio ref={audioRef} style={{ display: 'none' }} />
        {isMultiTrackMode && <audio ref={audioRef2} style={{ display: 'none' }} />}
        <span ref={timeStartRef} id="time-start">00:00  </span>
        <input
          type="range"
          id="custom-progress"
          min="0"
          max="100"
          value={progress}
          disabled
        />
        <span ref={timeEndRef} id="time-end">  00:00</span>
      </div>
      {maxReplays !== 0 && (
        <button
          id="replay-btn"
          onClick={handleReplay}
          disabled={maxReplays != -1 && replayCount >= maxReplays}
          style={{ cursor: replayCount >= maxReplays && maxReplays != -1 ? 'not-allowed' : 'pointer' }}
        >
          {maxReplays == -1 ? 'Replay' : `Replay (${maxReplays - replayCount})`}
        </button>
      )}
      <br />
      <br />
      <form id="answer-form" onSubmit={handleSubmit}>
        <label htmlFor="anime-name">Anime Name {isMultiTrackMode ? '1' : ''}:</label>
        <input
          type="text"
          id="anime-name"
          name="anime-name"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
          disabled={isAnswered}
        />
        {isMultiTrackMode && (
          <>
            <br />
            <label htmlFor="anime-name2">Anime Name 2:</label>
            <input
              type="text"
              id="anime-name2"
              name="anime-name2"
              value={answer2}
              onChange={(e) => setAnswer2(e.target.value)}
              required
              disabled={isAnswered}
            />
          </>
        )}
        {!isAnswered && (
          <button id="submit-button" type="submit">Submit</button>
        )}
      </form>
      <div
        id="feedback"
        className="feedback"
        style={{ color: feedback.includes('Correct') ? 'green' : 'red' }}
      >
        {feedback}
      </div>

      {isAnswered && (
        <button
          id="reveal-btn"
          className="reveal-button"
          onClick={() => setShowYouTube(true)}
        >
          Reveal Clip Source{isMultiTrackMode ? 's' : ''}
        </button>
      )}

      {showYouTube && (
        <div className="youtube-modal">
          <div className="youtube-overlay" onClick={closeYouTubeModal}></div>
          <div className="youtube-content">
            {!isMultiTrackMode ? (
              <iframe
                width="560"
                height="320"
                src={`https://www.youtube.com/embed/${question.youtube_id}?start=${question.start_time}&autoplay=1`}
                title="YouTube video player"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            ) : (
              <>
                <iframe
                  width="560"
                  height="320"
                  src={`https://www.youtube.com/embed/${question[0].youtube_id}?start=${question[0].start_time}&autoplay=1`}
                  title="YouTube video player 1"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                ></iframe>
                <iframe
                  width="560"
                  height="320"
                  src={`https://www.youtube.com/embed/${question[1].youtube_id}?start=${question[1].start_time}&autoplay=1`}
                  title="YouTube video player 2"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                ></iframe>
              </>
            )}
          </div>
        </div>
      )}

      <a
        id="next-question-link"
        style={isAnswered ? { display: 'inline-block' } : { display: 'none' }}
        disabled={isLoadingNext}
        onClick={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <button id="next-question-btn">
          {!isDeathMode && currentQuestion + 1 < totalQuestions || isDeathMode && remainingLife > 0 ? 'Next Question' : 'See Score'}
        </button>
      </a>
      {isDeathMode && (
        <div className="lives-container">
          {[...Array(maxLives)].map((_, index) => (
            <span
              key={index}
              className={`heart-icon ${index < remainingLife ? 'full-heart' : 'empty-heart'}`}
            >
              {index < remainingLife ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuestionScreen;