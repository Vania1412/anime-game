import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameOverScreen.css';

const GameOverScreen = ({ gameState, setGameState }) => {
  const [percentage, setPercentage] = useState('0.00');
  const navigate = useNavigate();
  const { score, totalQuestions, currentDeadModeQuestion } = gameState;

  const isDeathMode = JSON.parse(localStorage.getItem('isDeathMode') || 'false');


  useEffect(() => {
    // Calculate percentage score
    let percentageScore = ((score / totalQuestions) * 100).toFixed(2);
    if (isDeathMode) {
      percentageScore = ((score/ currentDeadModeQuestion) * 100).toFixed(2);
    }
    setPercentage(percentageScore);
  }, [score, totalQuestions]);

  const handlePlayAgain = () => {
    setGameState({
      questions: [], // reset questions (if necessary)
      difficulty: 1,
      currentQuestion: 0,
      score: 0,
      totalQuestions: 0,
      currentDeadModeQuestion: 0,
    });
    localStorage.setItem('isDeathMode', "false");
    navigate('/'); // Go back to the start screen
  };

  return (
    <div className="restart-container">
      <h1>Game Over!</h1>
      <p>Your final score is:</p>
      <p className="final-score">
        {isDeathMode ? `${score} / ${currentDeadModeQuestion} (${percentage}%)` : `${score} / ${totalQuestions} (${percentage}%)`}
      </p>

      <button onClick={handlePlayAgain}>
        Play Again
      </button>
    </div>
  );
};

export default GameOverScreen;
