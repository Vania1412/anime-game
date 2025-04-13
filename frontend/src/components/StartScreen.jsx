import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './StartScreen.css';
import '../index.css';

function StartScreen({ setGameState }) {
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState('normal'); // 'normal', 'death', 'timeAttack', 'suddenDeath'
  const [playbackStyle, setPlaybackStyle] = useState('normal'); // 'normal', 'reverse', 'multiTrack', 'speed'
  const [tempGameMode, setTempGameMode] = useState('normal');
  const [maxReplays, setMaxReplays] = useState(2);
  const [totalLife, setTotalLife] = useState(1);
  const [timeLimit, setTimeLimit] = useState(60); // For Time Attack
  const [questionTimeLimit, setQuestionTimeLimit] = useState(10); // For Sudden Death
  const [playbackSpeed, setPlaybackSpeed] = useState(2); // For Speed Mode
  const [questionCount, setQuestionCount] = useState(5); // For Normal Mode
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAnimeListOpen, setIsAnimeListOpen] = useState(false);
  const [animeList, setAnimeList] = useState([]);
  const [selectedAnimes, setSelectedAnimes] = useState({});

  useEffect(() => {
    fetch('https://anime-game-tgme.onrender.com/get_anime_list')
      .then((response) => response.json())
      .then((data) => {
        setAnimeList(data.animes);
        const storedSelections = JSON.parse(localStorage.getItem('selectedAnimes')) || {};
        const defaultSelection = data.animes.reduce((acc, anime) => {
          acc[anime] = storedSelections[anime] ?? true;
          return acc;
        }, {});
        setSelectedAnimes(defaultSelection);
      })
      .catch((error) => console.error('Error fetching anime list:', error));

    const storedGameMode = localStorage.getItem('gameMode') || 'normal';
    setGameMode(storedGameMode);
  }, []);

  const handleAnimeSelection = (anime) => {
    const updatedSelection = { ...selectedAnimes, [anime]: !selectedAnimes[anime] };
    setSelectedAnimes(updatedSelection);
    localStorage.setItem('selectedAnimes', JSON.stringify(updatedSelection));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const difficulty = event.target.difficulty.value;
    const selectedAnimeList = Object.keys(selectedAnimes).filter((anime) => selectedAnimes[anime]);
    const isDeathMode = gameMode === 'death';
    const isTimeAttackMode = gameMode === 'timeAttack';
    const isSuddenDeathMode = gameMode === 'suddenDeath';
    const isMultiTrackMode = playbackStyle === 'multiTrack';
    const isReverseMode = playbackStyle === 'reverse';
    const isSpeedMode = playbackStyle === 'speed';
    const finalQuestionCount = (isDeathMode || isTimeAttackMode || isSuddenDeathMode) ? 5 : questionCount;

    try {
      const response = await fetch('https://anime-game-tgme.onrender.com/start_game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty,
          question_count: finalQuestionCount,
          multi_track_mode: isMultiTrackMode,
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
          time_attack_mode: isTimeAttackMode,
          sudden_death_mode: isSuddenDeathMode,
          speed_mode: isSpeedMode,
          playback_speed: playbackSpeed,
          time_limit: timeLimit,
          question_time_limit: questionTimeLimit,
          currentDeadModeQuestion: 0,
          maxReplays,
          maxLives: parseInt(totalLife, 10),
        };

        setGameState(newGameState);
        localStorage.setItem('gameState', JSON.stringify(newGameState));
        localStorage.setItem('gameMode', gameMode);
        localStorage.setItem('totalLife', totalLife);
        localStorage.setItem('score', 0);
        localStorage.setItem('maxReplays', maxReplays);
        localStorage.removeItem(`replayCount_${0}`);
        localStorage.setItem(`isAnswered_${0}`, 'false');
        localStorage.setItem(`audioPlayed_${0}`, 'false');

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

  const resetSettings = () => {
    setMaxReplays(2);
    setTotalLife(1);
    setTimeLimit(60);
    setQuestionTimeLimit(10);
    setPlaybackSpeed(2);
    setQuestionCount(5);
    setTempGameMode('normal');
    setPlaybackStyle('normal');
  };

  return (
    <div>
      <h1>Anime Song Game</h1>
      <div className="game-container">
        <form id="startGameForm" onSubmit={handleSubmit}>
          <label htmlFor="difficulty">Select Difficulty:</label>
          <select id="difficulty" name="difficulty" defaultValue="1">
            <option value="1">1 Second</option>
            <option value="3">3 Seconds</option>
            <option value="5">5 Seconds</option>
          </select>
          <br />

          {gameMode === 'normal' && (
            <>
              <label htmlFor="question_count">Number of Questions:</label>
              <input
                type="number"
                id="question_count"
                name="question_count"
                min="1"
                max="100"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              />
              <br />
            </>
          )}

          <button type="submit" id="startGameBtn">Start Game</button>
        </form>
        <div id="errorMessage" style={{ color: 'red', display: 'none' }}>
          <p>Error starting the game!</p>
        </div>

        <button id="customizeListBtn" onClick={() => setIsAnimeListOpen(true)}>🎵 Customize Question List</button>
        <button id="settingsBtn" onClick={() => setIsSettingsOpen(true)}>⚙ Settings</button>

        {isAnimeListOpen && (
          <div className="modal-overlay">
            <div className="modal-anime">
              <h2 className="modal-header">Select Animes</h2>
              <div className="anime-list">
                {animeList
                  .slice()
                  .sort((a, b) => a.localeCompare(b))
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

        {isSettingsOpen && (
          <div className="modal-overlay">
            <div className="modal settings-modal">
              <h2>Game Settings</h2>

              {/* Game Mode Section */}
              <div className="settings-section">
                <h3 className="settings-label">Game Mode</h3>
                <div className="settings-options">
                  <label>
                    <input
                      type="radio"
                      name="gameMode"
                      value="normal"
                      checked={tempGameMode === 'normal'}
                      onChange={(e) => setTempGameMode(e.target.value)}
                    />
                    Normal Mode
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gameMode"
                      value="death"
                      checked={tempGameMode === 'death'}
                      onChange={(e) => setTempGameMode(e.target.value)}
                    />
                    Death Mode
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gameMode"
                      value="timeAttack"
                      checked={tempGameMode === 'timeAttack'}
                      onChange={(e) => setTempGameMode(e.target.value)}
                    />
                    Time Attack Mode
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gameMode"
                      value="suddenDeath"
                      checked={tempGameMode === 'suddenDeath'}
                      onChange={(e) => setTempGameMode(e.target.value)}
                    />
                    Sudden Death Mode
                  </label>
                </div>
              </div>

              {/* Playback Style Section */}
              <div className="settings-section">
                <h3 className="settings-label">Playback Style</h3>
                <div className="settings-options">
                  <label>
                    <input
                      type="radio"
                      name="playbackStyle"
                      value="normal"
                      checked={playbackStyle === 'normal'}
                      onChange={(e) => setPlaybackStyle(e.target.value)}
                    />
                    Normal Playback
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="playbackStyle"
                      value="reverse"
                      checked={playbackStyle === 'reverse'}
                      onChange={(e) => setPlaybackStyle(e.target.value)}
                    />
                    Reverse Playback
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="playbackStyle"
                      value="multiTrack"
                      checked={playbackStyle === 'multiTrack'}
                      onChange={(e) => setPlaybackStyle(e.target.value)}
                    />
                    Multi-Track Playback
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="playbackStyle"
                      value="speed"
                      checked={playbackStyle === 'speed'}
                      onChange={(e) => setPlaybackStyle(e.target.value)}
                    />
                    Speed Playback
                  </label>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="settings-section">
                <label htmlFor="maxReplays" className="settings-label">Max Replays:</label>
                <div className="settings-options">
                  <select
                    id="maxReplays"
                    value={maxReplays}
                    onChange={(e) => setMaxReplays(e.target.value)}
                    className="small-select"
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="-1">Infinity</option>
                  </select>
                </div>
              </div>

              {tempGameMode === 'death' && (
                <div className="settings-section">
                  <label htmlFor="totalLife" className="settings-label">Number of Lives:</label>
                  <div className="settings-options">
                    <select
                      id="totalLife"
                      value={totalLife}
                      onChange={(e) => setTotalLife(e.target.value)}
                      className="small-select"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                </div>
              )}

              {tempGameMode === 'timeAttack' && (
                <div className="settings-section">
                  <label htmlFor="timeLimit" className="settings-label">Time Limit:</label>
                  <div className="settings-options">
                    <select
                      id="timeLimit"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                      className="small-select"
                    >
                      <option value="10">10 s</option>
                      <option value="30">30 s</option>
                      <option value="45">45 s</option>
                      <option value="60">60 s</option>
                      <option value="90">90 s</option>
                      <option value="180">180 s</option>
                    </select>
                  </div>
                </div>
              )}

              {tempGameMode === 'suddenDeath' && (
                <div className="settings-section">
                  <label htmlFor="questionTimeLimit" className="settings-label">Time Limit:</label>
                  <div className="settings-options">
                    <select
                      id="questionTimeLimit"
                      value={questionTimeLimit}
                      onChange={(e) => setQuestionTimeLimit(parseInt(e.target.value, 10))}
                      className="small-select"
                    >
                      <option value="5">5 s</option>
                      <option value="10">10 s</option>
                      <option value="15">15 s</option>
                      <option value="20">20 s</option>
                    </select>
                  </div>
                </div>
              )}

              {playbackStyle === 'speed' && (
                <div className="settings-section">
                  <label htmlFor="playbackSpeed" className="settings-label">Playback Speed:</label>
                  <div className="settings-options">
                    <select
                      id="playbackSpeed"
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                      className="small-select"
                    >
                      <option value="0.5">0.5x</option>
                      <option value="2">2x</option>
                      <option value="3">3x</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="modal-buttons">
                <button onClick={resetSettings}>Reset</button>
                <button onClick={() => {setIsSettingsOpen(false); setGameMode(tempGameMode)}}>Save & Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StartScreen;