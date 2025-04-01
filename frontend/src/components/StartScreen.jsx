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
  const [isTempMultiTrackMode, setIsTempMultiTrackMode] = useState(false);
  const [isReverseMode, setIsReverseMode] = useState(false);
  const [isTempReverseMode, setIsTempReverseMode] = useState(false);
  const [isTimeAttackMode, setIsTimeAttackMode] = useState(false); // New state for Time Attack
  const [isTempTimeAttackMode, setIsTempTimeAttackMode] = useState(false); // Temp state for settings
  const [timeLimit, setTimeLimit] = useState(60); // Default 60s
  const [tempTimeLimit, setTempTimeLimit] = useState(60);
  const [isAnimeListOpen, setIsAnimeListOpen] = useState(false);
  const [animeList, setAnimeList] = useState([]);
  const [selectedAnimes, setSelectedAnimes] = useState({});


  // Load Death Mode state from localStorage on mount
  useEffect(() => {
    fetch('https://anime-game-tgme.onrender.com/get_anime_list')
      .then((response) => response.json())
      .then((data) => {
        setAnimeList(data.animes);
        // Load stored selections or default to all selected
        const storedSelections = JSON.parse(localStorage.getItem('selectedAnimes')) || {};
        const defaultSelection = data.animes.reduce((acc, anime) => {
          acc[anime] = storedSelections[anime] ?? true;
          return acc;
        }, {});
        setSelectedAnimes(defaultSelection);
      })
      .catch((error) => console.error('Error fetching anime list:', error));
    const storedDeathMode = localStorage.getItem('isDeathMode');
    if (storedDeathMode !== null) {
      setIsDeathMode(storedDeathMode === 'true');
      console.log(localStorage.getItem('isDeathMode'));
    }
  }, []);

  const handleAnimeSelection = (anime) => {
    const updatedSelection = { ...selectedAnimes, [anime]: !selectedAnimes[anime] };
    setSelectedAnimes(updatedSelection);
    localStorage.setItem('selectedAnimes', JSON.stringify(updatedSelection));
  };


  const handleToggle = () => {
    const newMode = !isDeathMode;
    setIsDeathMode(newMode);
    localStorage.setItem('isDeathMode', newMode); 
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const difficulty = event.target.difficulty.value;
    const questionCount = (isDeathMode || isTimeAttackMode) ? 5 : parseInt(event.target.question_count.value, 10);
    const selectedAnimeList = Object.keys(selectedAnimes).filter((anime) => selectedAnimes[anime]);

    try {
      const response = await fetch('https://anime-game-tgme.onrender.com/start_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty,
          question_count: questionCount,
          death_mode: isDeathMode,
          multi_track_mode: isMultiTrackMode,
          time_attack_mode: isTimeAttackMode,
          selected_animes: selectedAnimeList,
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
          reverse_mode: isReverseMode,
          time_attack_mode: isTimeAttackMode, // New field
          time_limit: timeLimit,
          currentDeadModeQuestion: 0,
          maxReplays,
          maxLives: parseInt(totalLife, 10),
        };

        setGameState(newGameState);
        localStorage.setItem('gameState', JSON.stringify(newGameState));
        localStorage.removeItem(`replayCount_${0}`);
        console.log(localStorage.getItem('isDeathMode'));
        localStorage.setItem(`isAnswered_${0}`, false);
        localStorage.setItem(`totalLife`, totalLife);
        localStorage.setItem(`score`, 0);

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
    setIsTempMultiTrackMode(isMultiTrackMode)
    setIsTempReverseMode(isReverseMode)
    setIsTempTimeAttackMode(isTimeAttackMode); 
    setTempTimeLimit(timeLimit);
    setTempTotalLife(totalLife)
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

          {!isDeathMode && !isTimeAttackMode && (
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

          {!isTimeAttackMode && <div className="toggle-container" onClick={handleToggle}>
            <div className={`toggle-slider ${isDeathMode ? 'on' : 'off'}`}>
              <div className="toggle-circle"></div>
            </div>
            <span>{isDeathMode ? 'Death Mode' : 'Normal Mode'}</span>
          </div>}

          <div className="row"></div>
          <button type="submit" id="startGameBtn">Start Game</button>
        </form>
        <div id="errorMessage" style={{ color: 'red', display: 'none' }}>
          <p>Error starting the game!</p>
        </div>

        <button id="customizeListBtn" onClick={() => setIsAnimeListOpen(true)}>🎵 Customize Question List</button>

        {isAnimeListOpen && (
          <div className="modal-overlay">
            <div className="modal-anime">
              <h2>Select Animes</h2>
              <div className="anime-list">
                {animeList
                  .slice() // Create a shallow copy to avoid mutating the original array
                  .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
                  .map((anime) => (
                    <label key={anime} className="anime-item">
                      <input
                        type="checkbox"
                        checked={selectedAnimes[anime] || false}
                        onChange={() => handleAnimeSelection(anime)}
                      />
                      {anime}
                    </label>
                  ))}
              </div>
              <div className="modal-buttons">
                <button onClick={() => setIsAnimeListOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

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
              <div> </div>
              {!isTempReverseMode && <div className="toggle-container" onClick={() => setIsTempMultiTrackMode(!isTempMultiTrackMode)}>
                <div className={`toggle-slider-multi ${isTempMultiTrackMode ? 'on' : 'off'}`}>
                  <div className="toggle-circle"></div>
                </div>
                <span>{isTempMultiTrackMode ? 'Multi-Track Mode ON' : 'Multi-Track Mode OFF'}</span>
              </div>}
              <div> </div>
              {!isTempMultiTrackMode && <div className="toggle-container" onClick={() => setIsTempReverseMode(!isTempReverseMode)}>
                <div className={`toggle-slider-multi ${isTempReverseMode ? 'on' : 'off'}`}>
                  <div className="toggle-circle"></div>
                </div>
                <span>{isTempReverseMode ? 'Reverse Mode ON' : 'Reverse Mode OFF'}</span>
              </div>}
              <div> </div>
              {!isDeathMode && (
                <div
                  className="toggle-container"
                  onClick={() => setIsTempTimeAttackMode(!isTempTimeAttackMode)}
                >
                  <div className={`toggle-slider-multi ${isTempTimeAttackMode ? 'on' : 'off'}`}>
                    <div className="toggle-circle"></div>
                  </div>
                  <span>{isTempTimeAttackMode ? 'Time Attack Mode ON' : 'Time Attack Mode OFF'}</span>
                </div>
              )}

              {isTempTimeAttackMode && !isDeathMode && (
                <div>
                  <label htmlFor="timeLimit">Time Limit: </label>
                  <select
                    id="timeLimit"
                    value={tempTimeLimit}
                    onChange={(e) => setTempTimeLimit(parseInt(e.target.value, 10))}
                    className="small-select"
                  >
                    <option value="30">30 Seconds</option>
                    <option value="45">45 Seconds</option>
                    <option value="60">60 Seconds</option>
                    <option value="90">90 Seconds</option>
                    <option value="180">180 Seconds</option>
                  </select>
                </div>
              )}
              <br />
              <div className="modal-buttons">
                <button onClick={() => setIsSettingsOpen(false)}>Close</button>
                <button onClick={() => {
                  setMaxReplays(tempMaxReplays);
                  setTotalLife(tempTotalLife);
                  setIsMultiTrackMode(isTempMultiTrackMode);
                  setIsReverseMode(isTempReverseMode);
                  setIsTimeAttackMode(isTempTimeAttackMode);  
                    setTimeLimit(tempTimeLimit);
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
