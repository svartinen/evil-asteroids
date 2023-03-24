// Utility functions for saving and loading things (e.g. game settings and highscores) from localStorage

const saveGame = "saveGame";
const highscoresPerDifficulty = 5;
const difficulties = ["easy", "medium", "hard"];
const savedDifficulty = "savedDifficulty";
const promptBox = new customPrompt();

window.onload = setDifficulty();

function saveDifficulty(buttonID) {
    window.localStorage.setItem(savedDifficulty, buttonID);
}

function setDifficulty() {
    let buttonID = window.localStorage.getItem(savedDifficulty);
    if(buttonID) {
        document.getElementById(buttonID).checked = true;
    }
}

function checkScore(score, difficulty) {
    let save = JSON.parse(window.localStorage.getItem(saveGame)) || {};
    let lowestScore = 0;
    let index = highscoresPerDifficulty - 1;
    if(difficulty in save && index in save[difficulty]) {
        lowestScore = save[difficulty][index].score;
    } else if(!(difficulty in save)) {
        save[difficulty] = [];
    }
    
    if (score > lowestScore) {
        const input = promptBox.prompt("Congratulations! You've reached a new high score. Please, enter your name (max. 30 characters):");
        
        const saveScore = () => {
            input.then((name) => {
                if (name == null) name = "Anonymous Spacer";
                const newScore = {score, name};
        
                save[difficulty].push(newScore);
                save[difficulty].sort((score1, score2) => score2.score - score1.score);
                save[difficulty].splice(highscoresPerDifficulty);
        
                window.localStorage.setItem(saveGame, JSON.stringify(save));
                
            });
        };
        
        saveScore();
    }
}

function showHighscores() {
    let save = JSON.parse(window.localStorage.getItem(saveGame)) || {};
    
    let scoreMenu = document.getElementById("scoreMenu");
    scoreMenu.style.display = "flex";
    
    for (let i in difficulties) {
        difficulty = difficulties[i];
        if (difficulty in save) {
            let capitalizedDiff = difficulty[0].toUpperCase() + difficulty.slice(1);
            let scores = document.getElementById("highscores" + capitalizedDiff);
            scores.innerHTML = "<caption>" + capitalizedDiff + "</caption>";
            scores.innerHTML += save[difficulty].map((currentScore, index) => "<tr><td>" + (index + 1) + "</td><td>" + currentScore.name + "</td><td>" + currentScore.score + "</td></tr>").join("");
        }
    }
    let backButton = document.getElementById("backToMainMenu");
    backButton.style.display = "flex";
    
    let newGameButton = document.getElementById("newGame");
    newGameButton.style.display = "none";
    
    let scoresTitle = document.getElementById("scoreMenuTitle");
    scoresTitle.style.display = "block";
    
    let mainMenuExclusiveItems = document.getElementsByClassName("mainMenuExclusiveItem");
    for (let i = 0; i < mainMenuExclusiveItems.length; i++) {
        mainMenuExclusiveItems[i].style.display = "none";
    }
}