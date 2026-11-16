const nameInput = document.getElementById("nameInput");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const greeting = document.getElementById("greeting");

let savedName = localStorage.getItem("username");

if (savedName !== null) {
    greeting.textContent = "welcome back, " + savedName;
}

function savingName() {
    let name = nameInput.value;

    localStorage.setItem("username", name);
    greeting.textContent = "welcome, " + name;
}

saveButton.addEventListener("click", savingName);

function clearingName() {
    localStorage.removeItem("username");
    greeting.textContent = "";
    nameInput.value = "";
}

clearButton.addEventListener("click", clearingName);
    
document.addEventListener("DOMContentLoaded", () => {
    // Centralized state for the active game session
    const state = {
        currentGame: null,
        score: 0,
        timeLeft: 30,
        isActive: false,
        isPaused: false,
        timerId: null
    };

    // ================= CORE ENGINE (TIMER, PAUSE, NAVIGATION) =================
    function stopTimer() {
        if (state.timerId) {
            clearInterval(state.timerId);
            state.timerId = null;
        }
    }

    function startSession(gamePrefix, onTimeUp, onHideBoard) {
        stopTimer();
        state.currentGame = gamePrefix;
        state.score = 0;
        state.timeLeft = 30;
        state.isActive = true;
        state.isPaused = false;

        updateScoreUI(0);
        document.getElementById(`${gamePrefix}-timer`).textContent = state.timeLeft;
        document.getElementById(`${gamePrefix}-msg`).textContent = "";

        const pauseBtn = document.getElementById(`${gamePrefix}-pause`);
        pauseBtn.textContent = "Pause";
        pauseBtn.disabled = false;

        if (onHideBoard) onHideBoard(false);

        state.timerId = setInterval(() => {
            if (state.isPaused) return;

            state.timeLeft--;
            document.getElementById(`${gamePrefix}-timer`).textContent = state.timeLeft;

            if (state.timeLeft <= 0) {
                endSession(onTimeUp);
            }
        }, 1000);
    }

    function endSession(customMessage) {
        stopTimer();
        state.isActive = false;
        const prefix = state.currentGame;
        document.getElementById(`${prefix}-pause`).disabled = true;
        document.getElementById(`${prefix}-msg`).textContent =
            customMessage || `Time is up. Final score: ${state.score}`;
    }

    function togglePause(onHideBoard) {
        if (!state.isActive) return;

        state.isPaused = !state.isPaused;
        const prefix = state.currentGame;
        document.getElementById(`${prefix}-pause`).textContent = state.isPaused ? "Resume" : "Pause";
        document.getElementById(`${prefix}-msg`).textContent = state.isPaused ? "Game Paused" : "";

        if (onHideBoard) onHideBoard(state.isPaused);
    }

    function updateScoreUI(newScore) {
        state.score = newScore;
        document.getElementById(`${state.currentGame}-score`).textContent = state.score;
    }

    function navigateTo(pageId) {
        stopTimer();
        document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
        document.getElementById(pageId).classList.add("active");

        const initializers = {
            game1: initGame1,
            game2: initGame2,
            game3: initGame3,
            game4: initGame4
        };

        if (initializers[pageId]) {
            initializers[pageId]();
        }
    }

    // Bind navigation buttons cleanly via data-nav attributes
    document.querySelectorAll("[data-nav]").forEach(btn => {
        btn.addEventListener("click", () => navigateTo(btn.dataset.nav));
    });

    // ================= GAME 1: TARGET CLICK =================
    const g1Box = document.getElementById("g1-box");
    const g1Target = document.getElementById("g1-target");

    function moveTarget() {
        const maxX = g1Box.clientWidth - g1Target.offsetWidth;
        const maxY = g1Box.clientHeight - g1Target.offsetHeight;
        g1Target.style.left = `${Math.floor(Math.random() * maxX)}px`;
        g1Target.style.top = `${Math.floor(Math.random() * maxY)}px`;
    }

    function toggleG1Board(hide) {
        g1Target.style.display = hide ? "none" : "block";
    }

    function initGame1() {
        startSession("g1", null, toggleG1Board);
        moveTarget();
    }

    g1Target.addEventListener("click", () => {
        if (!state.isActive || state.isPaused || state.currentGame !== "g1") return;
        updateScoreUI(state.score + 1);
        moveTarget();
    });

    document.getElementById("g1-pause").addEventListener("click", () => togglePause(toggleG1Board));
    document.getElementById("g1-restart").addEventListener("click", initGame1);

    // ================= GAME 2: MEMORY MATCH =================
    const memoryGrid = document.getElementById("memory-grid");
    const symbols = ["1", "2", "3", "4", "5", "6"];
    let flippedTiles = [];
    let isBoardLocked = false;

    function toggleG2Board(hide) {
        memoryGrid.style.visibility = hide ? "hidden" : "visible";
    }

    function initGame2() {
        flippedTiles = [];
        isBoardLocked = false;
        memoryGrid.innerHTML = "";

        const deck = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
        deck.forEach(symbol => {
            const tile = document.createElement("div");
            tile.className = "card-tile";
            tile.dataset.symbol = symbol;
            tile.textContent = "?";
            tile.addEventListener("click", () => handleTileFlip(tile));
            memoryGrid.appendChild(tile);
        });

        startSession("g2", `Time is up. Pairs found: ${state.score}/6`, toggleG2Board);
    }

    function handleTileFlip(tile) {
        if (!state.isActive || state.isPaused || isBoardLocked || tile.classList.contains("flipped")) {
            return;
        }

        tile.classList.add("flipped");
        tile.textContent = tile.dataset.symbol;
        flippedTiles.push(tile);

        if (flippedTiles.length === 2) {
            isBoardLocked = true;
            const [first, second] = flippedTiles;

            if (first.dataset.symbol === second.dataset.symbol) {
                updateScoreUI(state.score + 1);
                flippedTiles = [];
                isBoardLocked = false;

                if (state.score === symbols.length) {
                    endSession(`Completed with ${state.timeLeft}s remaining.`);
                }
            } else {
                setTimeout(() => {
                    first.classList.remove("flipped");
                    second.classList.remove("flipped");
                    first.textContent = "?";
                    second.textContent = "?";
                    flippedTiles = [];
                    isBoardLocked = false;
                }, 600);
            }
        }
    }

    document.getElementById("g2-pause").addEventListener("click", () => togglePause(toggleG2Board));
    document.getElementById("g2-restart").addEventListener("click", initGame2);

    // ================= GAME 3: MATH RUSH =================
    const g3Box = document.getElementById("g3-box");
    const mathQuestionEl = document.getElementById("math-question");
    const mathOptionsEl = document.getElementById("math-options");
    let currentMathAnswer = 0;

    function toggleG3Board(hide) {
        g3Box.style.visibility = hide ? "hidden" : "visible";
    }

    function generateMathQuestion() {
        const a = Math.floor(Math.random() * 12) + 1;
        const b = Math.floor(Math.random() * 12) + 1;
        const isMultiply = Math.random() > 0.5;

        currentMathAnswer = isMultiply ? a * b : a + b;
        mathQuestionEl.textContent = isMultiply ? `${a} × ${b} = ?` : `${a} + ${b} = ?`;

        const options = new Set([currentMathAnswer]);
        while (options.size < 4) {
            const offset = Math.floor(Math.random() * 11) - 5;
            const candidate = currentMathAnswer + offset;
            if (candidate > 0 && candidate !== currentMathAnswer) {
                options.add(candidate);
            }
        }

        mathOptionsEl.innerHTML = "";
        Array.from(options)
            .sort(() => Math.random() - 0.5)
            .forEach(value => {
                const btn = document.createElement("button");
                btn.textContent = value;
                btn.addEventListener("click", () => {
                    if (!state.isActive || state.isPaused) return;
                    if (value === currentMathAnswer) {
                        updateScoreUI(state.score + 1);
                    }
                    generateMathQuestion();
                });
                mathOptionsEl.appendChild(btn);
            });
    }

    function initGame3() {
        startSession("g3", null, toggleG3Board);
        generateMathQuestion();
    }

    document.getElementById("g3-pause").addEventListener("click", () => togglePause(toggleG3Board));
    document.getElementById("g3-restart").addEventListener("click", initGame3);

    // ================= GAME 4: COLOR TRAP =================
    const g4Box = document.getElementById("g4-box");
    const colorWordEl = document.getElementById("color-word");
    const palette = [
        { name: "RED", hex: "#dc2626" },
        { name: "BLUE", hex: "#2563eb" },
        { name: "GREEN", hex: "#16a34a" },
        { name: "PURPLE", hex: "#9333ea" }
    ];
    let targetInkColor = "";

    function toggleG4Board(hide) {
        g4Box.style.visibility = hide ? "hidden" : "visible";
    }

    function generateColorPrompt() {
        const randomWord = palette[Math.floor(Math.random() * palette.length)];
        const randomInk = palette[Math.floor(Math.random() * palette.length)];

        targetInkColor = randomInk.name;
        colorWordEl.textContent = randomWord.name;
        colorWordEl.style.color = randomInk.hex;
    }

    function initGame4() {
        startSession("g4", null, toggleG4Board);
        generateColorPrompt();
    }

    document.querySelectorAll("#color-options button").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!state.isActive || state.isPaused) return;
            const chosenColor = btn.dataset.color;
            const nextScore = chosenColor === targetInkColor
                ? state.score + 1
                : Math.max(0, state.score - 1);

            updateScoreUI(nextScore);
            generateColorPrompt();
        });
    });

    document.getElementById("g4-pause").addEventListener("click", () => togglePause(toggleG4Board));
    document.getElementById("g4-restart").addEventListener("click", initGame4);
});