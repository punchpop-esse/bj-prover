// Game Constants
const availableImages = [
  'images/blue.png', 
  'images/green.png',
  'images/orange.png',
  'images/purple.png',
  'images/pink.png',
];

const maxLives = 3;

// Game State
let flippedCards = [];
let matchedCards = 0;
let isGameLocked = false;
let gameInterval;
let remainingTime = 60;
let currentLevel = null;
let ruggedStrikes = 0;
let unlimitedLives = false;
let currentUsername = '';

// DOM Elements
const gameBoard = document.getElementById('game-board');
const messageElement = document.getElementById('message');
const timerBar = document.getElementById('timerBar');
const timerBarContainer = document.getElementById('timerBarContainer');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const livesElement = document.getElementById('lives');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const levelHint = document.getElementById('levelHint');

// Audio Elements
const flipSound = new Audio('sounds/flip.mp3');
const correctSound = new Audio('sounds/correct.mp3');
const ruggedSound = new Audio('sounds/rugged.mp3');
const winSound = new Audio('sounds/congrats.mp3');
const startSound = new Audio('sounds/start.mp3');
const levelSound = new Audio('sounds/level.mp3');

// Set audio volumes
startSound.volume = 0.6;
levelSound.volume = 0.5;
flipSound.volume = 0.7;
correctSound.volume = 0.5;
ruggedSound.volume = 0.6;
winSound.volume = 0.8;

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
  updateLevelDisplay();
  
  // Leaderboard setup
  document.getElementById('showLeaderboard')?.addEventListener('click', showLeaderboard);
  document.getElementById('closeLeaderboard')?.addEventListener('click', hideLeaderboard);
  updateLeaderboardDisplay();
});

// Utility Functions
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function playStartSound() {
  startSound.currentTime = 0;
  startSound.play();
}

function playLevelSound() {
  levelSound.currentTime = 0;
  levelSound.play();
}

// Level Selection
document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    playLevelSound();
    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const level = btn.dataset.level;
    setLevel(level);

    // Hide Let's Play button and show arrow hint
    startButton.style.display = 'none';
    levelHint.style.display = 'block';
    levelHint.classList.add('rotated');
    levelHint.style.pointerEvents = 'auto';
    levelHint.style.cursor = 'pointer';
    levelHint.style.transform = 'rotate(-90deg)';
  });
});

levelHint.addEventListener('click', () => {
  if (currentLevel) {
    playStartSound();
    resetGame();
  }
});

function setLevel(level) {
  currentLevel = level;
  updateLevelDisplay();
}

function getRuggedCount() {
  if (currentLevel === 'Easy') return 2;
  if (currentLevel === 'Medium') return 4;
  if (currentLevel === 'Hard') return 8;
  return 4;
}

function getTimeLimit() {
  if (currentLevel === 'Easy') return 90;
  if (currentLevel === 'Medium') return 60;
  if (currentLevel === 'Hard') return 45;
  return 60;
}

// Game Functions
function resetGame() {
  updateLevelDisplay();
  const gameContainer = document.querySelector('.game-container');
  gameContainer.style.display = 'block';
  document.getElementById('restartButton').style.display = 'block';
  document.getElementById('showLeaderboard').style.display = 'none';
  gameBoard.style.display = 'grid';
  timerBarContainer.style.display = 'block';
  livesElement.style.display = unlimitedLives ? 'none' : 'flex';
  restartButton.style.display = 'block';
  clearInterval(gameInterval);
  
  startButton.style.display = 'none';
  levelHint.style.display = 'none';
  
  matchedCards = 0;
  ruggedStrikes = 0;
  flippedCards = [];
  updateLivesUI();
  gameBoard.innerHTML = '';
  timerBar.style.width = '100%';
  timerBarContainer.style.display = 'block';
  messageElement.textContent = '';
  messageElement.classList.remove('show');
  levelHint.style.display = 'none';

  remainingTime = getTimeLimit();
  const ruggedCount = getRuggedCount();
  const totalCards = 20;
  const totalNormalCards = totalCards - ruggedCount;
  const pairsNeeded = totalNormalCards / 2;

  const selectedImages = [];
  while (selectedImages.length < pairsNeeded) {
    const nextImg = availableImages[selectedImages.length % availableImages.length];
    selectedImages.push(nextImg);
  }

  let imagePool = [];
  selectedImages.forEach(img => imagePool.push(img, img));
  for (let i = 0; i < ruggedCount; i++) {
    imagePool.push('images/rugged.png');
  }

  initializeBoard(imagePool);
  gameInterval = setInterval(updateTimer, 1000);
  document.getElementById('levelSelector').style.display = 'none';
  startButton.style.display = 'none';
  restartButton.style.display = 'block';
}

function initializeBoard(imageList) {
  shuffle(imageList);
  imageList.forEach(imageSrc => {
    const card = document.createElement('div');
    card.classList.add('card');

    const front = document.createElement('div');
    front.classList.add('card-front');

    const back = document.createElement('div');
    back.classList.add('card-back');

    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = 'Card';

    back.appendChild(img);
    card.appendChild(front);
    card.appendChild(back);

    card.addEventListener('click', () => handleCardClick(card, img));
    gameBoard.appendChild(card);
  });
}

function handleCardClick(card, img) {
  if (isGameLocked || card.classList.contains('flipped') || card.classList.contains('matched')) return;

  card.classList.add('flipped');
  flipSound.currentTime = 0;
  flipSound.play();
  flippedCards.push(card);
  
  if (img.src.includes('rugged')) {
    if ("vibrate" in navigator) {
      navigator.vibrate(100);
    }
  }

  if (flippedCards.length === 1 && img.src.includes('rugged')) {
    handleRuggedCard(card);
    return;
  }

  if (flippedCards.length === 2) {
    isGameLocked = true;
    const [firstCard, secondCard] = flippedCards;
    const isTrap = firstCard.querySelector('img').src.includes('rugged') || 
                   secondCard.querySelector('img').src.includes('rugged');

    if (isTrap) {
      handleRuggedPair(firstCard, secondCard);
      return;
    }

    const img1 = firstCard.querySelector('img').src;
    const img2 = secondCard.querySelector('img').src;
    
    if (img1 === img2) {
      handleMatch(firstCard, secondCard);
    } else {
      handleMismatch(firstCard, secondCard);
    }
  }
}

function handleRuggedCard(card) {
  isGameLocked = true;
  ruggedStrikes++;
  ruggedSound.currentTime = 0;
  ruggedSound.play();
  updateLivesUI();
  
  if (ruggedStrikes >= maxLives && !unlimitedLives) {
    stopGame();
    return;
  }
  
  const trapMessage = unlimitedLives 
    ? "⚠️ You hit a trap!" 
    : `⚠️ You hit a trap! ${maxLives - ruggedStrikes} more chance(s)!`;
  
  messageElement.textContent = trapMessage;
  messageElement.classList.add('show');
  
  setTimeout(() => {
    messageElement.textContent = '';
    messageElement.classList.remove('show');
    card.classList.remove('flipped');
    flippedCards = [];
    isGameLocked = false;
  }, 800);
}

function handleRuggedPair(firstCard, secondCard) {
  ruggedStrikes++;
  ruggedSound.currentTime = 0;
  ruggedSound.play();
  updateLivesUI();
  
  const trapMessage = unlimitedLives 
    ? "⚠️ You hit a trap!" 
    : `⚠️ You hit a trap! ${maxLives - ruggedStrikes} more chance(s)!`;
  
  messageElement.textContent = trapMessage;
  messageElement.classList.add('show');
  
  setTimeout(() => {
    messageElement.textContent = '';
    messageElement.classList.remove('show');
  }, 2000);
  
  setTimeout(() => {
    firstCard.classList.remove('flipped');
    secondCard.classList.remove('flipped');
    flippedCards = [];
    isGameLocked = false;
    if (ruggedStrikes >= maxLives && !unlimitedLives) stopGame();
  }, 800);
}

function handleMatch(firstCard, secondCard) {
  matchedCards++;
  correctSound.currentTime = 0;
  correctSound.play();
  setTimeout(() => {
    firstCard.classList.add('fade-out');
    secondCard.classList.add('fade-out');
    flippedCards = [];
    isGameLocked = false;
    if (matchedCards === (20 - getRuggedCount()) / 2) {
      winSound.currentTime = 0;
      winSound.play();
      clearInterval(gameInterval);
      showEndOverlay();
    }
  }, 700);
}

function handleMismatch(firstCard, secondCard) {
  setTimeout(() => {
    firstCard.classList.remove('flipped');
    secondCard.classList.remove('flipped');
    flippedCards = [];
    isGameLocked = false;
  }, 1000);
}

// Timer Functions
function updateTimer() {
  if (remainingTime > 0) {
    remainingTime--;
    timerBar.style.width = (remainingTime / getTimeLimit()) * 100 + '%';
  } else {
    handleTimeout();
  }
}

function handleTimeout() {
  ruggedStrikes++;
  ruggedSound.currentTime = 0;
  ruggedSound.play();
  updateLivesUI();
  
  if (ruggedStrikes >= maxLives && !unlimitedLives) {
    stopGame();
    return;
  }
  
  const timeoutMessage = unlimitedLives 
    ? "⌛ Timeout!" 
    : `⌛ Timeout! ${maxLives - ruggedStrikes} more chance(s)!`;
  
  messageElement.textContent = timeoutMessage;
  messageElement.classList.add('show');
  
  setTimeout(() => {
    messageElement.textContent = '';
    messageElement.classList.remove('show');
  }, 2000);
  
  remainingTime = getTimeLimit();
  timerBar.style.width = '100%';
}

// UI Functions
function updateLivesUI() {
  livesElement.innerHTML = '';
  if (unlimitedLives) {
    livesElement.style.display = 'none';
    return;
  }
  livesElement.style.display = 'flex';
  const remainingLives = maxLives - ruggedStrikes;
  for (let i = 0; i < remainingLives; i++) {
    const lifeImg = document.createElement('img');
    lifeImg.src = 'images/life.png';
    lifeImg.alt = 'Life';
    livesElement.appendChild(lifeImg);
  }
}

function updateLevelDisplay() {
  const levelDisplay = document.getElementById('levelDisplay');
  if (!levelDisplay) return;
  
  levelDisplay.className = 'mode-text';
  levelDisplay.textContent = unlimitedLives 
    ? 'OVERCLOCK MODE' 
    : currentLevel 
      ? getModeDisplayName(currentLevel) 
      : 'SELECT MODE';
}

// Game Control Functions
function stopGame() {
  clearInterval(gameInterval);
  disableGame();
  timerBarContainer.style.display = 'none';
  levelHint.style.display = 'none';
  showEndOverlay();
  document.getElementById('showLeaderboard').style.display = 'none';
}

function disableGame() {
  document.querySelectorAll('.card').forEach(card => {
    card.style.pointerEvents = 'none';
  });
}

function reloadPage() {
  location.reload();
}

function showEndOverlay() {
  document.querySelector('.game-container').style.display = 'none';
  levelHint.style.display = 'none';
  document.getElementById('restartButton').style.display = 'none';
  gameOverOverlay.classList.add('show');
  gameBoard.style.display = 'none';
  timerBarContainer.style.display = 'none';
  livesElement.style.display = 'none';
  restartButton.style.display = 'none';
  
  const isWin = matchedCards === (20 - getRuggedCount()) / 2;

  if (unlimitedLives && !isWin) {
    return;
  }

  const messageHTML = `
  <div class="game-result-message">
    <strong>${isWin ? "🎉 Congratulations. Thanks for become a true prover." : "❌ Try again"}</strong>
  </div>
  <div id="usernameForm">
    <input type="text" id="usernameInput" class="glass-input" placeholder="Enter your name" maxlength="20">
    <button id="submitScore" class="glass-button">Submit Score</button>
  </div>
  <div class="social-links">
    <div>      
      Follow me <a href="https://twitter.com/xlolo_id" id="followLink" target="_blank">@xlolo_id</a> for Overclock Mode
    </div>
    <div>
      Follow <a href="https://twitter.com/SuccinctLabs" target="_blank">@SuccinctLabs</a> come join with us
    </div>
    <div>
      <em><a href="https://provewith.us" target="_blank">provewith.us</a></em>
    </div>
  </div>
`;

  gameOverOverlay.innerHTML = `
    ${messageHTML}
    <div class="close-button-wrapper">
      <button id="closeOverlayIcon" aria-label="Close overlay">✕</button>
    </div>
  `;

  // Focus on input field
  const usernameInput = document.getElementById('usernameInput');
  if (usernameInput) usernameInput.focus();

  // Handle score submission
  document.getElementById('submitScore')?.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
      currentUsername = username;
      saveToLeaderboard(username);
      
      // Replace the form with success message
      document.getElementById('usernameForm').innerHTML = `
  <div class="score-submitted-message">
    <div class="submission-text">Score submitted!</div>
    <div class="submission-action">
      <a href="#" id="viewLeaderboardLink" class="text-only-buttonf">View Leaderboard</a>
    </div>
  </div>
`;
      
      document.getElementById('viewLeaderboardLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        gameOverOverlay.classList.remove('show');
        showLeaderboard();
      });
    }
  });

  // Handle follow link
  document.getElementById('followLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    const username = currentUsername || prompt('Enter your name for Overclock Mode:');
    if (username?.trim()) {
      currentUsername = username.trim();
      unlimitedLives = true;
      ruggedStrikes = 0;
      levelHint.style.display = 'none';
      updateLevelDisplay();
      gameOverOverlay.innerHTML = `<strong>✅ OVERCLOCKED! Let's prove, ${currentUsername}</strong>`;
      setTimeout(() => {
        gameOverOverlay.classList.remove('show');
        isGameLocked = false;
        flippedCards = [];
        matchedCards = 0;
        remainingTime = getTimeLimit();
        resetGame();
      }, 2000);
      window.open(e.target.href, '_blank');
    }
  });

  document.getElementById('closeOverlayIcon')?.addEventListener('click', () => {
    document.getElementById('showLeaderboard').style.display = 'block';
    window.location.href = 'index.html';
  });
  
  if (!(unlimitedLives && !isWin)) {
    document.getElementById('showLeaderboard').style.display = 'block';
  }
}


// Leaderboard functions
function showLeaderboard() {
  document.querySelector('.game-container').style.display = 'none';
  document.getElementById('startButton').style.display = 'none';
  document.getElementById('restartButton').style.display = 'none';
  
  updateLeaderboardDisplay();
  document.getElementById('leaderboardModal').classList.add('show');
  document.getElementById('showLeaderboard').style.display = 'none';
}

function hideLeaderboard() {
  document.getElementById('leaderboardModal').classList.remove('show');
  document.getElementById('showLeaderboard').style.display = 'block';
  
  
  // Reset to initial menu state
  document.querySelector('.game-container').style.display = 'none';
  document.getElementById('levelSelector').style.display = 'flex';
  document.getElementById('startButton').style.display = 'none'; // Hide Let's Play button
  document.getElementById('restartButton').style.display = 'none';
  levelHint.style.display = 'block';
  levelHint.classList.remove('rotated');
  levelHint.style.transform = '';
  currentLevel = null;
  updateLevelDisplay();
}

function updateLeaderboardDisplay() {
  const leaderboard = JSON.parse(localStorage.getItem('proveBoardLeaderboard')) || [];
  const tbody = document.getElementById('leaderboardTable')?.querySelector('tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  leaderboard.slice(0, 10).forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.username}</td>
      <td>${entry.mode}</td>
      <td>${entry.score.toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });
}

function calculateScore() {
  if (!currentLevel) return 0;
  
  const basePoints = matchedCards * 1000;
  const timeBonus = 1 + (remainingTime / getTimeLimit());
  let levelMultiplier;
  
  if (unlimitedLives) {
    levelMultiplier = 1;
  } else {
    switch(currentLevel) {
      case 'Easy': levelMultiplier = 2; break;
      case 'Medium': levelMultiplier = 3; break;
      case 'Hard': levelMultiplier = 10; break;
      default: levelMultiplier = 1;
    }
  }
  
  const penalties = ruggedStrikes * 500;
  return Math.max(0, Math.round(basePoints * timeBonus * levelMultiplier - penalties));
}

function saveToLeaderboard(username) {
  const leaderboard = JSON.parse(localStorage.getItem('proveBoardLeaderboard')) || [];
  const score = calculateScore();
  
  // Konversi nama mode untuk leaderboard
  let modeDisplay;
  if (unlimitedLives) {
    modeDisplay = `OC (${getLeaderboardModeName(currentLevel)})`; // Format: OC (ECO)
  } else {
    modeDisplay = getLeaderboardModeName(currentLevel);
  }
  
  leaderboard.push({
    username,
    mode: modeDisplay,
    score,
    timestamp: new Date().toISOString()
  });
  
  leaderboard.sort((a, b) => b.score - a.score || new Date(b.timestamp) - new Date(a.timestamp));
  const newLeaderboard = leaderboard.slice(0, 10);
  localStorage.setItem('proveBoardLeaderboard', JSON.stringify(newLeaderboard));
}

// Helper function to convert level to display name
function getModeDisplayName(level) {
  switch(level) {
    case 'Easy': return 'ECO MODE';
    case 'Medium': return 'TURBO MODE';
    case 'Hard': return 'BURN MODE';
    default: return level;
  }
}

function getLeaderboardModeName(level) {
  switch(level) {
    case 'Easy': return 'ECO';
    case 'Medium': return 'TURBO';
    case 'Hard': return 'BURN';
    default: return level;
  }
}

// Event Listeners
startButton.addEventListener('click', () => {
  playStartSound();
  resetGame();
});

restartButton.addEventListener('click', () => {
  playLevelSound();
  setTimeout(() => {
    reloadPage();
  }, 300);
});

// Expose to global scope
window.setLevel = setLevel;