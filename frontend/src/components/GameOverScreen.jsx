import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameOverScreen.css';

const GameOverScreen = ({ gameState, setGameState }) => {
  const [percentage, setPercentage] = useState('0.00');
  const navigate = useNavigate();
  const { score, totalQuestions, death_mode, time_attack_mode, sudden_death_mode} = gameState;

   


  useEffect(() => {
    // Calculate percentage score
    const percentageScore = ((score / totalQuestions) * 100).toFixed(2);

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
      {(death_mode || sudden_death_mode) ? (
        <div>
          <p>You were defeated.</p>
          <p className="final-score">After answering {score} question{score <= 1 ? '' : 's'} correctly</p>
        </div>
      ) : time_attack_mode ? (
        <div>
          <p>Your final score is:</p>
          <p className="final-score">{score}</p>
        </div>
      ) : (
        <div>
          <p>Your final score is:</p>
          <p className="final-score">
            {score} / {totalQuestions} ({percentage}%)
          </p>
        </div>
      )}

      <button onClick={handlePlayAgain}>
        Play Again
      </button>
    </div>
  );
};

export default GameOverScreen;
