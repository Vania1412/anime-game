// Handle the start game button click
document.getElementById('start-game-btn').addEventListener('click', async function () {
    const difficulty = document.getElementById('difficulty').value;
    const questionCount = document.getElementById('question-count').value;
    
    // Prepare data to be sent
    const data = {
        difficulty: difficulty,
        question_count: questionCount
    };
    
    try {
        // Send POST request to start the game
        const response = await fetch('/start_game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Check if the response is OK (200 status)
        if (!response.ok) {
            throw new Error('Error starting game');
        }

        // Parse the response as JSON
        const result = await response.json();
        console.log(result); // You should see the questions and difficulty here

        // Now navigate to the game page (for example, to show the first question)
        window.location.href = '/question'; // Navigate to the first question page

    } catch (error) {
        // Handle the error properly
        console.error('Error starting game:', error);
        alert('Error starting game: ' + error.message);
    }
});
