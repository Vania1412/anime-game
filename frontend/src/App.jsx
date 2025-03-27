import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StartScreen from './components/StartScreen';
import QuestionScreen from './components/QuestionScreen';
import GameOverScreen from './components/GameOverScreen';
import './index.css';

function App() {
  // Load game state from local storage, or set default values
  const [gameState, setGameState] = useState(() => {
    const savedState = localStorage.getItem('gameState');
    return savedState
      ? JSON.parse(savedState)
      : {
          questions: [],
          difficulty: 1,
          currentQuestion: 0,
          score: 0,
          totalQuestions: 0,
        };
  });

  // Save gameState to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartScreen setGameState={setGameState} />} />
        <Route
          path="/question"
          element={<QuestionScreen gameState={gameState} setGameState={setGameState} />}
        />
        <Route
          path="/game_over"
          element={<GameOverScreen gameState={gameState} setGameState={setGameState} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
