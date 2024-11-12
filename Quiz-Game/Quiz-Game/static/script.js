document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('start-quiz-btn').addEventListener("click", showTopicSelection);
    document.getElementById('start-topic-quiz-btn').addEventListener("click", startQuiz);
    document.getElementById('submit-quiz-btn').addEventListener("click", submitQuiz);
});

function showTopicSelection() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('topic-selection-section').style.display = 'block';
    loadTopics();
}

async function loadTopics() {
    try {
        const response = await fetch('/get_topics');
        const topics = await response.json();
        const topicSelect = document.getElementById('topic-select');
        topicSelect.innerHTML = ''; // Clear previous options

        topics.forEach((topic) => {
            const option = document.createElement('option');
            option.value = topic;
            option.textContent = topic.charAt(0).toUpperCase() + topic.slice(1);
            topicSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading topics:', error);
        alert("Failed to load topics. Please try again.");
    }
}

async function startQuiz() {
    const topic = document.getElementById('topic-select').value;
    try {
        const response = await fetch('/start_quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic })
        });

        if (!response.ok) {
            // Log the status and text of the response for debugging
            console.error('Server returned error:', response.status, await response.text());
            alert("Failed to start the quiz. Please try again.");
            return;
        }

        const questions = await response.json();
        console.log('Questions loaded:', questions);
        displayQuestions(questions);

        document.getElementById('topic-selection-section').style.display = 'none';
        document.getElementById('quiz-section').style.display = 'block';
    } catch (error) {
        console.error('Error starting quiz:', error);
        alert("Failed to start the quiz. Please try again.");
    }
}

function displayQuestions(questions) {
    const questionsSection = document.getElementById('questions-section');
    questionsSection.innerHTML = ''; // Clear previous questions

    Object.keys(questions).forEach((key, index) => {
        const questionData = questions[key];
        const questionHTML = `
            <div class="question">
                <p>Q${index + 1}: ${questionData.question}</p>
                <label><input type="radio" name="q${key}" value="a"> ${questionData.options.a}</label><br>
                <label><input type="radio" name="q${key}" value="b"> ${questionData.options.b}</label><br>
                <label><input type="radio" name="q${key}" value="c"> ${questionData.options.c}</label><br>
                <label><input type="radio" name="q${key}" value="d"> ${questionData.options.d}</label><br>
            </div>
        `;
        questionsSection.innerHTML += questionHTML;
    });

    document.getElementById('submit-quiz-btn').style.display = 'block';
}

async function submitQuiz() {
    const answers = {};
    const currentQuestions = document.querySelectorAll('.question');
    currentQuestions.forEach((question, index) => {
        const selectedOption = question.querySelector(`input[name="q${index + 1}"]:checked`);
        if (selectedOption) {
            answers[index + 1] = selectedOption.value;
        }
    });

    const topic = document.getElementById('topic-select').value;
    try {
        const response = await fetch('/submit_quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers, topic })
        });

        const result = await response.json();
        displayResults(result);
    } catch (error) {
        console.error('Error submitting quiz:', error);
        alert("Failed to submit the quiz. Please try again.");
    }
}

function displayResults(result) {
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = `<h3>Your Score: ${result.score} / ${result.total}</h3>`;

    result.results.forEach(res => {
        resultsContent.innerHTML += `
            <p>${res.question} - ${res.correct ? "Correct" : "Incorrect. Correct answer: " + res.correct_answer}</p>
            ${res.correct ? "" : `<p>Learn more: ${res.more_info}</p>`}
        `;
    });

    document.getElementById('quiz-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
}
