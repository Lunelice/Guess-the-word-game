// Const declarations
let btnRandom = document.querySelector(".random");
let btnReset = document.querySelector(".reset");
let btnClue = document.querySelector(".clue");
let scrambled = document.querySelector(".scrambled");
let available = document.querySelector(".letters-available");
let mistakes = document.querySelector(".mistakes");
let triesElement = document.querySelector(".tries");
let dotsList = document.querySelector(".dots");
let word;
let wordScrambled;
let maxTries;
let currentTries;
let clueUses; // Nombre d'indices disponibles

// Retrieve language from URL or default to 'en'
function getLanguage() {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    if (lang === 'fr' || lang === 'en') {
        return lang;
    } else {
        return localStorage.getItem('language') || 'en';
    }
}

function setLanguage(lang) {
    localStorage.setItem('language', lang);
    const currentURL = new URL(window.location);
    currentURL.searchParams.set('lang', lang);
    window.location.href = currentURL.toString();
}

const language = getLanguage();

const translations = {
    fr: {
        tries: 'Essais',
        clues: 'Indice',
        mistakes: 'Erreurs',
        gameOver: 'Jeu terminé !',
        success: 'Bravo ! Le mot était : ',
        random: 'Aléatoire',
        reset: 'Réinitialiser'
    },
    en: {
        tries: 'Tries',
        clues: 'Clue',
        mistakes: 'Errors',
        gameOver: 'Game Over!',
        success: 'Success! The word was: ',
        random: 'Random',
        reset: 'Reset'
    }
};

function getTranslation(key) {
    return translations[language][key] || key;
}

function translatePage() {
    btnRandom.textContent = getTranslation('random');
    btnReset.textContent = getTranslation('reset');
    btnClue.textContent = `${getTranslation('clues')} : x${clueUses}`;
    triesElement.textContent = `${getTranslation('tries')} :`;
    mistakes.textContent = '';
    document.querySelector('.letters-tried').querySelector('span').textContent = getTranslation('mistakes');
}

function scrambleWord(entry) {
    let chars = entry.split('');
    for (let i = chars.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}

function fetchWord() {
    return fetch(`https://random-word-api.herokuapp.com/word?lang=${language}`)
        .then((response) => response.json())
        .then((data) => {
            word = data[0];
            wordScrambled = scrambleWord(word);
            console.log(word);
            console.log(wordScrambled);
            return word;
        })
        .catch((error) => console.error('Erreur:', error));
}

function displayScrambledWord() {
    scrambled.innerHTML = `<p>${wordScrambled}</p>`;
}

function setupLetterInputs() {
    available.innerHTML = '';
    let firstLetterInput = document.createElement('input');
    firstLetterInput.className = 'letter current';
    firstLetterInput.type = 'text';
    firstLetterInput.maxLength = 1;
    firstLetterInput.addEventListener('input', handleInput);
    available.appendChild(firstLetterInput);

    for (let i = 1; i < word.length; i++) {
        let letterElement = document.createElement('p');
        letterElement.className = 'letter';
        letterElement.textContent = '_';
        available.appendChild(letterElement);
    }
}

function updateTries() {
    let triesText = getTranslation('tries');
    triesElement.textContent = `${triesText} (${currentTries}/${maxTries}):`;
    let dots = dotsList.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index >= currentTries);
    });
}

function updateClueButton() {
    btnClue.textContent = `${getTranslation('clues')} : x${clueUses}`;
    btnClue.disabled = clueUses <= 0; // Désactiver le bouton si aucun indice n'est disponible
}

function resetMistakes() {
    mistakes.textContent = '';
}

function resetTries() {
    available.innerHTML = '';
    resetMistakes();
    currentTries = 0;
    updateTries();
    setupLetterInputs(); // Remettre en place les champs de lettres
    clueUses = (word.length >= 7) ? 2 : 1; // Réinitialiser le nombre d'indices en fonction de la longueur du mot
    updateClueButton(); // Mettre à jour le bouton d'indice
}

function handleInput(event) {
    let input = event.target;
    let index = Array.from(available.children).indexOf(input);

    if (input.value.length === 1) {
        let letter = input.value.toUpperCase();
        if (letter === word[index].toUpperCase()) {
            resetMistakes();
            input.classList.remove('current');
            input.classList.add('letter');
            input.value = letter;

            let nextElement = available.children[index + 1];
            if (nextElement) {
                let newInput = createInput(index + 1);
                available.replaceChild(newInput, nextElement);
                newInput.focus();
            }

            if (checkWord()) {
                alert(`${getTranslation('success')} ${word}`);
                resetTries();
                return; // Stop further processing
            }
        } else {
            addMistake(letter);
            input.value = '';
        }
    }
}

function createInput(index) {
    let input = document.createElement('input');
    input.className = 'letter current';
    input.type = 'text';
    input.maxLength = 1;
    input.dataset.index = index;
    input.addEventListener('input', handleInput);
    return input;
}

function addMistake(letter) {
    let mistakesArray = mistakes.textContent.split(', ').filter(Boolean);
    if (!mistakesArray.includes(letter)) {
        mistakesArray.push(letter);
        mistakes.textContent = mistakesArray.join(', ');
        currentTries++;
        updateTries();
    }

    if (currentTries >= maxTries) {
        alert(getTranslation('gameOver'));
        resetTries();
    }
}

function checkWord() {
    let inputs = document.querySelectorAll('.letters-available input');
    let currentWord = Array.from(inputs).map(input => input.value.toUpperCase()).join('');
    return currentWord === word.toUpperCase();
}

function revealLetter() {
    if (clueUses > 0) {
        let currentInput = document.querySelector('.letters-available .current');
        if (currentInput) {
            let index = Array.from(available.children).indexOf(currentInput);
            if (index < word.length) {
                let correctLetter = word[index].toUpperCase();
                currentInput.value = correctLetter;
                currentInput.classList.remove('current');
                currentInput.classList.add('letter');
                clueUses--;
                updateClueButton(); // Mettre à jour le bouton d'indice

                // Passer à l'input suivant
                let nextElement = available.children[index + 1];
                if (nextElement) {
                    let newInput = createInput(index + 1);
                    available.replaceChild(newInput, nextElement);
                    newInput.focus();
                }

                if (checkWord()) {
                    alert(`${getTranslation('success')} ${word}`);
                    resetTries();
                }
            }
        }
    }
}

function startNewGame() {
    fetchWord().then(() => {
        displayScrambledWord();
        maxTries = word.length;
        currentTries = 0;
        clueUses = (word.length >= 7) ? 2 : 1; // Ajuster le nombre d'indices en fonction de la longueur du mot
        resetTries();
        updateTries();
        setupLetterInputs();
        updateClueButton(); // Mettre à jour le bouton d'indice
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    translatePage();
    startNewGame();
});

btnRandom.addEventListener('click', startNewGame);
btnReset.addEventListener('click', resetTries);
btnClue.addEventListener('click', revealLetter);

document.querySelectorAll('.language-selector .btn').forEach(button => {
    button.addEventListener('click', (event) => {
        let selectedLang = event.target.getAttribute('data-lang');
        setLanguage(selectedLang);
    });
});
