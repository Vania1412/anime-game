import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartScreen.css';
import '../index.css';

function StartScreen({ setGameState }) {
  const navigate = useNavigate();
  const [isDeathMode, setIsDeathMode] = useState(false);
  const [maxReplays, setMaxReplays] = useState(2);
  const [totalLife, setTotalLife] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempMaxReplays, setTempMaxReplays] = useState(maxReplays);
  const [tempTotalLife, setTempTotalLife] = useState(totalLife); 
  const [isMultiTrackMode, setIsMultiTrackMode] = useState(false);

  // Load Death Mode state from localStorage on mount
  useEffect(() => {
    const storedDeathMode = localStorage.getItem('isDeathMode');
    if (storedDeathMode !== null) {
      setIsDeathMode(storedDeathMode === 'true');
      console.log(localStorage.getItem('isDeathMode'));
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
    const questionCount = isDeathMode ? 5 : parseInt(event.target.question_count.value, 10);

    try {
      const response = await fetch('https://anime-game-tgme.onrender.com/start_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          difficulty, 
          question_count: questionCount, 
          death_mode: isDeathMode, 
          multi_track_mode: isMultiTrackMode 
        }),
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
          multi_track_mode: isMultiTrackMode,
          currentDeadModeQuestion: 0,
          maxReplays,
          maxLives: parseInt(totalLife, 10) ,
        };

        setGameState(newGameState);
        localStorage.setItem('gameState', JSON.stringify(newGameState));
        localStorage.removeItem(`replayCount_${0}`);
        console.log(localStorage.getItem('isDeathMode'));
        localStorage.setItem(`isAnswered_${0}`, false);
        localStorage.setItem(`totalLife`, totalLife);

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

  const openSettings = () => {
    setTempMaxReplays(maxReplays); // Reset input to current value
    setIsSettingsOpen(true);
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
          <br></br>

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
              <br></br>
            </>

          )}

          <div className="toggle-container" onClick={handleToggle}>
            <div className={`toggle-slider ${isDeathMode ? 'on' : 'off'}`}>
              <div className="toggle-circle"></div>
            </div>
            <span>{isDeathMode ? 'Death Mode' : 'Normal Mode'}</span>
          </div>

          <div className="toggle-container" onClick={() => setIsMultiTrackMode(!isMultiTrackMode)}>
            <div className={`toggle-slider-multi ${isMultiTrackMode ? 'on' : 'off'}`}>
              <div className="toggle-circle"></div>
            </div>
            <span>{isMultiTrackMode ? 'Multi-Track Mode' : 'Single Track Mode'}</span>
          </div>

 
        

          
          <div className="row"></div>
          <button type="submit" id="startGameBtn">Start Game</button>
        </form>
        <div id="errorMessage" style={{ color: 'red', display: 'none' }}>
          <p>Error starting the game!</p>
        </div>
        <button id="settingsBtn" onClick={() => openSettings(true)}>⚙ Settings</button>


        {isSettingsOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Game Settings</h2>
              <label htmlFor="maxReplays">Max Replays: </label>
              <select
                id="maxReplays"
                value={tempMaxReplays}
                onChange={(e) => setTempMaxReplays(e.target.value)}
                className="small-select" // Apply class here
              >
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="-1">Infinity</option>
              </select>
              {isDeathMode && <div>
              <label htmlFor="totalLife">Number of Lives: </label>
              <select
                id="totalLife"
                value={tempTotalLife}
                onChange={(e) => setTempTotalLife(e.target.value)}
                className="small-select" // Apply class here
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
              </div>}
              <br />
              <div className="modal-buttons">
                <button onClick={() => setIsSettingsOpen(false)}>Close</button>
                <button onClick={() => {
                  setMaxReplays(tempMaxReplays);
                  setTotalLife(tempTotalLife); 
                  setIsSettingsOpen(false);
                }}>
                  Save
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default StartScreen;
