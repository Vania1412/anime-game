import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuestionScreen.css';
import '../index.css';

function QuestionScreen({ gameState, setGameState }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [replayCount, setReplayCount] = useState(0);
  const [isSubmitButtonVisible, setIsSubmitButtonVisible] = useState(true);
  const maxReplays = 2;
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const timeStartRef = useRef(null);
  const timeEndRef = useRef(null);
  const navigate = useNavigate();
  

  const { questions, difficulty, currentQuestion, score, totalQuestions } = gameState;
  const question = questions[currentQuestion] || {};

  useEffect(() => {
    if (!question.url) return;

    // Load replay count from localStorage
    const storedReplayCount = localStorage.getItem(`replayCount_${currentQuestion}`);
    if (storedReplayCount !== null) {
      setReplayCount(parseInt(storedReplayCount, 10));
    } else {
      setReplayCount(0); 
    }

    timeEndRef.current.textContent = formatTime(difficulty);

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
          progressRef.current.value = Math.round(((currentTime - start) / difficulty) * 100);
        } else if (currentTime >= end) {
          progressRef.current.value = 100;
          audioPlayer.pause();
        }
      };
    };

    audioPlayer.onended = () => {
      progressRef.current.value = 100;
    };

    if (timeStartRef.current) {
      timeStartRef.current.textContent = '00:00';
    }
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
      progressRef.current.value = 0;
      audioPlayer.play().catch((error) => console.error("Replay failed:", error));

      setReplayCount((prev) => {
        const newCount = prev + 1;
        localStorage.setItem(`replayCount_${currentQuestion}`, newCount); // Save to storage
        return newCount;
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion + 1 < questions.length) {
      setGameState((prev) => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
      }));

      setAnswer('');
      setFeedback('');
      setIsSubmitButtonVisible(true);
      document.getElementById('next-question-link').style.display = 'none';

      // Clear replay count for next question
      localStorage.removeItem(`replayCount_${currentQuestion + 1}`);
    } else { 
      navigate(`/game_over`); 
    }
  };

  return (
    <div>
      <h1>Question #{currentQuestion + 1}</h1>
      <div id="audio-container">
        <audio ref={audioRef} style={{ display: 'none' }} />
        <span ref={timeStartRef} id="time-start">00:00</span>
        <input type="range" ref={progressRef} id="custom-progress" min="0" max="100" value={0} disabled />
        <span ref={timeEndRef} id="time-end">00:00</span>
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
      <a
        id="next-question-link"
        style={{ display: 'none' }}
        onClick={(e) => {
          e.preventDefault();
          handleNext();
        }}
      >
        <button id="next-question-btn">
          {currentQuestion + 1 < totalQuestions ? 'Next Question' : 'See Score'}
        </button>
      </a>
    </div>
  );
}

export default QuestionScreen;
