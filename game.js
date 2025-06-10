const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Load images
const catImg = new Image();
catImg.src = 'cat.png';

// Load sounds
const jumpSound = new Audio('jump.mp3');
const hitSound = new Audio('hit.mp3');
jumpSound.volume = 0.5;
hitSound.volume = 1.0;

// Player (cat) setup
let dino = {
  x: 50,
  y: 250,
  width: 40,
  height: 40,
  dy: 0,
  gravity: 0.8,
  jumpPower: -12,
  grounded: true
};

// Game variables
let obstacles = [];
let obstacleTimer = 0;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScore = parseInt(highScore);

// Touch input for jump
document.addEventListener('touchstart', () => {
  if (dino.grounded) {
    dino.dy = dino.jumpPower;
    dino.grounded = false;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
});

// Update player
function updateDino() {
  dino.dy += dino.gravity;
  dino.y += dino.dy;

  if (dino.y >= 250) {
    dino.y = 250;
    dino.dy = 0;
    dino.grounded = true;
  }
}

// Draw player
function drawDino() {
  ctx.drawImage(catImg, dino.x, dino.y, dino.width, dino.height);
}

// Create obstacle
function createObstacle() {
  obstacles.push({
    x: canvas.width,
    y: 250,
    width: 30,
    height: 40
  });
}

// Update and draw obstacles
function updateObstacles() {
  obstacleTimer++;
  if (obstacleTimer % 90 === 0) createObstacle();

  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].x -= 5;
    ctx.fillStyle = 'red';
    ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);

    // Collision detection
    if (
      dino.x < obstacles[i].x + obstacles[i].width &&
      dino.x + dino.width > obstacles[i].x &&
      dino.y < obstacles[i].y + obstacles[i].height &&
      dino.y + dino.height > obstacles[i].y
    ) {
      hitSound.currentTime = 0;
      hitSound.play();

      if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
      }

      alert("Game Over!\nScore: " + score + "\nHigh Score: " + highScore);

      obstacles = [];
      obstacleTimer = 0;
      score = 0;
    }
  }
}

// Draw ground
function drawGround() {
  ctx.fillStyle = '#654321'; // brown ground
  ctx.fillRect(0, 290, canvas.width, 10);
}

// Game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawGround();
  updateDino();
  drawDino();
  updateObstacles();

  // Score update
  if (obstacleTimer % 10 === 0) score += 1;

  // Display score
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText('Score: ' + score + '  High: ' + highScore, 10, 30);

  requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();