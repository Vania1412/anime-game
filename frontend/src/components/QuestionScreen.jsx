import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuestionScreen.css';
import '../index.css';

function QuestionScreen({ gameState, setGameState }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [replayCount, setReplayCount] = useState(0);
  const [isSubmitButtonVisible, setIsSubmitButtonVisible] = useState(true);
  const [showYouTube, setShowYouTube] = useState(false);
  const [randomStart, setRandomStart] = useState(0);
  const [progress, setProgress] = useState(0); // New state for progress
  const maxReplays = 2;
  const audioRef = useRef(null);
  const timeStartRef = useRef(null);
  const timeEndRef = useRef(null);
  const navigate = useNavigate();

  const { questions, difficulty, currentQuestion, score, totalQuestions, currentDeadModeQuestion } = gameState;
  const question = questions[currentQuestion] || {};
  const isDeathMode = localStorage.getItem('isDeathMode');

  useEffect(() => {
    if (!question.url) return;

    const storedReplayCount = localStorage.getItem(`replayCount_${currentQuestion}`);
    setReplayCount(storedReplayCount !== null ? parseInt(storedReplayCount, 10) : 0);

    timeEndRef.current.textContent = "  " + formatTime(difficulty);

    const audioPlayer = audioRef.current;
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
    const userAnswer = answer.trim();
    const correctAnswer = question.correct_answer;

    if (userAnswer === correctAnswer) {
      setFeedback('Correct!');
      setGameState((prev) => ({ ...prev, score: prev.score + 1 }));
    } else {
      setFeedback(`Incorrect! The correct answer is: ${correctAnswer}`);
    }

    setIsSubmitButtonVisible(false);
    document.getElementById('next-question-link').style.display = 'inline-block';
  };

  const handleReplay = () => {
    if (replayCount < maxReplays && audioRef.current) {
      const audioPlayer = audioRef.current;
      audioPlayer.pause();
      audioPlayer.currentTime = question.start_time || 0;
      setProgress(0); // Reset progress state
      audioPlayer.play().catch((error) => console.error("Replay failed:", error));

      setReplayCount((prev) => {
        const newCount = prev + 1;
        localStorage.setItem(`replayCount_${currentQuestion}`, newCount);
        return newCount;
      });
    }
  };

  const handleNext = async () => {
    if (isDeathMode && answer.trim() != question.correct_answer) {
      setGameState((prev) => ({
        ...prev,
        currentDeadModeQuestion: prev.currentDeadModeQuestion + 1,
      }));
      navigate("/game_over");
    } else if (currentQuestion + 1 < questions.length) {
      setGameState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        currentDeadModeQuestion: prev.currentDeadModeQuestion + 1,
      }));


    } else if (isDeathMode) { 
      // If in Death Mode and all 10 questions are answered, fetch 10 more
      try {
        const response = await fetch("http://localhost:5000/next_question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty, is_death_mode: true }),
        });

        if (!response.ok) throw new Error("Failed to fetch new questions");

        const data = await response.json();
        if (data.questions && data.questions.length > 0) {
          setGameState((prev) => ({
            ...prev,
            questions: data.questions,
            currentQuestion: 0, // Reset question index
            currentDeadModeQuestion: prev.currentDeadModeQuestion + 1,
          }));
        } else {
          navigate("/game_over"); // End game if no new questions
        }
      } catch (error) {
        console.error("Error fetching next batch:", error);
        navigate("/game_over");
      }
    } else {
      navigate("/game_over"); // If not in Death Mode, go to game over
    }
    setAnswer('');
    setFeedback('');
    setIsSubmitButtonVisible(true);
    setShowYouTube(false);
    document.getElementById('next-question-link').style.display = 'none';

    localStorage.removeItem(`replayCount_${currentQuestion + 1}`);
  };

  const closeYouTubeModal = () => {
    setShowYouTube(false);
  };

  return (
    <div className="question-screen">
      <h1>Question #{currentDeadModeQuestion + 1}</h1>
      <div id="audio-container">
        <audio ref={audioRef} style={{ display: 'none' }} />
        <span ref={timeStartRef} id="time-start">00:00  </span>
        <input
          type="range"
          id="custom-progress"
          min="0"
          max="100"
          value={progress} // Controlled by state
          disabled
        />
        <span ref={timeEndRef} id="time-end">  00:00</span>
      </div>
      <button
        id="replay-btn"
        onClick={handleReplay}
        disabled={replayCount >= maxReplays}
        style={{ cursor: replayCount >= maxReplays ? 'not-allowed' : 'pointer' }}
      >
        Replay ({maxReplays - replayCount})
      </button>
      <br />
      <form id="answer-form" onSubmit={handleSubmit}>
        <label htmlFor="anime-name">Anime Name:</label>
        <input
          type="text"
          id="anime-name"
          name="anime-name"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          required
        />
        {isSubmitButtonVisible && (
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

      {!isSubmitButtonVisible && (
        <button
          id="reveal-btn"
          className="reveal-button"
          onClick={() => setShowYouTube(true)}
        >
          Reveal Clip Source
        </button>
      )}

      {showYouTube && (
        <div className="youtube-modal">
          <div className="youtube-overlay" onClick={closeYouTubeModal}></div>
          <div className="youtube-content">
            <iframe
              width="560"
              height="320"
              src={`https://www.youtube.com/embed/${question.youtube_id}?start=${question.start_time}&autoplay=1`}
              title="YouTube video player"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      <a
        id="next-question-link"
        style={{ display: 'none' }}
        onClick={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <button id="next-question-btn">
          {!isDeathMode && currentQuestion + 1 < totalQuestions || isDeathMode && answer.trim() == question.correct_answer ? 'Next Question' : 'See Score'}
        </button>
      </a>
    </div>
  );
}

export default QuestionScreen;