import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartScreen.css';
import '../index.css';

function StartScreen({ setGameState }) {
  const navigate = useNavigate();
  const [isDeathMode, setIsDeathMode] = useState(false);

  // Load Death Mode state from localStorage on mount
  useEffect(() => {
    const storedDeathMode = localStorage.getItem('isDeathMode');
    if (storedDeathMode !== null) {
      setIsDeathMode(storedDeathMode === 'false');
    }
  }, []);

  const handleToggle = () => {
    const newMode = !isDeathMode;
    setIsDeathMode(newMode);
    localStorage.setItem('isDeathMode', newMode); // Save to localStorage
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const difficulty = event.target.difficulty.value;
    const questionCount = isDeathMode ? 3 : parseInt(event.target.question_count.value, 10);

    try {
      const response = await fetch('http://localhost:5000/start_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, question_count: questionCount, death_mode: isDeathMode }),
      });

      const data = await response.json();

      if (data.questions) {
        const newGameState = {
          questions: data.questions,
          difficulty: parseInt(data.difficulty),
          currentQuestion: 0,
          score: 0,
          totalQuestions: data.questions.length,
          death_mode: isDeathMode,
          currentDeadModeQuestion: 0
        };

        setGameState(newGameState);
        localStorage.setItem('gameState', JSON.stringify(newGameState));
        localStorage.removeItem(`replayCount_${0}`);

        navigate('/question');
      } else {
        document.getElementById('errorMessage').style.display = 'block';
        alert('Error starting game: ' + data.error);
      }
    } catch (error) {
      document.getElementById('errorMessage').style.display = 'block';
      alert('Error starting game: ' + error.message);
    }
  };

  return (
    <div>
      <h1>Anime Song Game</h1>
      <div className="game-container">
        <form id="startGameForm" onSubmit={handleSubmit}>
          <label htmlFor="difficulty">Select Difficulty:</label>
          <div className="row"></div>
          <select id="difficulty" name="difficulty" defaultValue="1">
            <option value="1">1 Second</option>
            <option value="3">3 Seconds</option>
            <option value="5">5 Seconds</option>
          </select>

          <div className="row"></div>

          {!isDeathMode && (
            <>
              <label htmlFor="question_count">Select Number of Questions:</label>
              <div className="row"></div>
              <input
                type="number"
                id="question_count"
                name="question_count"
                min="1"
                max="100"
                defaultValue="5"
              />
            </>
          )}

          <div className="toggle-container" onClick={handleToggle}>
            <div className={`toggle-slider ${isDeathMode ? 'on' : 'off'}`}>
              <div className="toggle-circle"></div>
            </div>
            <span>{isDeathMode ? 'Death Mode' : 'Normal Mode'}</span>
          </div>

          <div className="row"></div>

          <button type="submit" id="startGameBtn">Start Game</button>
        </form>
        <div id="errorMessage" style={{ color: 'red', display: 'none' }}>
          <p>Error starting the game!</p>
        </div>
      </div>
    </div>
  );
}

export default StartScreen;
