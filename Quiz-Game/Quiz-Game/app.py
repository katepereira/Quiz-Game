from flask import Flask, jsonify, request, render_template
import json
import os
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Define the list of topics
TOPICS_LIST = ['science', 'history', 'artificial intelligence']

# Function to load questions based on the topic
def load_question(topic):
    filename = f'topics/{topic}.json'
    logging.debug(f"Attempting to load file: {filename}")
    if os.path.exists(filename):  # Check if the file exists
        with open(filename, 'r') as read_file:
            questions = json.load(read_file)
        logging.debug(f"Successfully loaded questions for topic: {topic}")
        return questions
    else:
        logging.error(f"File not found: {filename}")
        return None  # Return None if the file doesn't exist

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_topics', methods=['GET'])
def get_topics():
    return jsonify(TOPICS_LIST)

@app.route('/start_quiz', methods=['POST'])
def start_quiz():
    data = request.get_json()
    topic = data.get('topic')
    logging.debug(f"Received start_quiz request for topic: {topic}")

    # Check if topic is valid
    if topic not in TOPICS_LIST:
        logging.error(f"Invalid topic selected: {topic}")
        return jsonify({"error": "Invalid topic selected"}), 400

    # Load questions for the selected topic
    questions = load_question(topic)
    if questions:
        logging.debug(f"Returning questions for topic: {topic}")
        return jsonify(questions), 200  # Explicit status code
    else:
        logging.error(f"Questions for the selected topic could not be loaded")
        return jsonify({"error": "Questions for the selected topic could not be loaded"}), 500


@app.route('/submit_quiz', methods=['POST'])
def submit_quiz():
    data = request.get_json()
    answers = data.get('answers')
    topic = data.get('topic')
    logging.debug(f"Received submit_quiz request for topic: {topic}")

    # Load questions for scoring
    questions = load_question(topic)
    if not questions:
        logging.error("Questions for the selected topic could not be loaded")
        return jsonify({"error": "Questions for the selected topic could not be loaded"}), 500

    score = 0
    results = []

    # Calculate score based on the user's answers
    for key, meta in questions.items():
        correct_answer = meta["answer"].lower()
        user_answer = answers.get(key, "").lower()

        if user_answer == correct_answer:
            score += 1
            results.append({"question": meta["question"], "correct": True})
        else:
            score += 0
            results.append({
                "question": meta["question"],
                "correct": False,
                "correct_answer": meta["answer"],
                "more_info": meta.get("more_info", "")
            })

    return jsonify({"score": score, "results": results, "total": len(questions)})

if __name__ == '__main__':
    app.run(debug=True)
