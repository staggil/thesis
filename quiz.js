document.addEventListener("DOMContentLoaded", () => {
    const quizContainer = document.getElementById("quiz-container");
    if (!quizContainer) return; // ไม่ใช่หน้า quiz → ไม่ทำงาน

    const questions = [
        {
            question: "2 + 2 = ?",
            choices: ["3", "4", "5", "6"],
            answer: 1
        },
        {
            question: "เมืองหลวงของไทยคือ?",
            choices: ["เชียงใหม่", "ภูเก็ต", "กรุงเทพฯ", "ขอนแก่น"],
            answer: 2
        }
    ];

    let current = 0;
    let score = 0;
    let time = 10;
    let timer;

    const questionEl = document.getElementById("question");
    const timeEl = document.getElementById("time");
    const scoreEl = document.getElementById("score");
    const choices = document.querySelectorAll(".choice");

    function loadQuestion() {
        clearInterval(timer);
        time = 10;
        timeEl.textContent = time;

        const q = questions[current];
        questionEl.textContent = q.question;

        choices.forEach((btn, i) => {
            btn.textContent = q.choices[i];
            btn.onclick = () => checkAnswer(i);
        });

        timer = setInterval(() => {
            time--;
            timeEl.textContent = time;
            if (time === 0) nextQuestion();
        }, 1000);
    }

    function checkAnswer(i) {
        if (i === questions[current].answer) score++;
        scoreEl.textContent = "คะแนน: " + score;
        nextQuestion();
    }

    function nextQuestion() {
        clearInterval(timer);
        current++;
        if (current < questions.length) {
            loadQuestion();
        } else {
            quizContainer.innerHTML =
                `<h2>จบเกม 🎉</h2><p>คะแนนของคุณ: ${score}</p>`;
        }
    }

    loadQuestion();
});
