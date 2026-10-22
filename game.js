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

function playSound(sound) {
  sound.currentTime = 0;
  const p = sound.play();
  if (p && p.catch) p.catch(() => {}); // ignore autoplay blocks
}

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

// Speed settings (tweak these to change how the game feels)
const START_SPEED = 5;     // obstacle speed at the start
const MAX_SPEED = 152;      // speed never goes above this
const SPEED_RAMP = 0.2;   // speed gained per point of score

// Game variables
let obstacles = [];
let spawnTimer = 0;        // counted in "frames at 60fps", not real frames
let nextSpawn = 90;
let score = 0;
let speed = START_SPEED;
let state = 'playing';     // 'playing' or 'over'
let gameOverTime = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;

function currentSpeed() {
  return Math.min(MAX_SPEED, START_SPEED + score * SPEED_RAMP);
}

function randomSpawnGap() {
  // Shorter gap as the game speeds up, with some randomness
  const base = 70 + Math.random() * 60;
  return base * (START_SPEED / speed);
}

function resetGame() {
  obstacles = [];
  spawnTimer = 0;
  score = 0;
  speed = START_SPEED;
  nextSpawn = randomSpawnGap();
  dino.y = 250;
  dino.dy = 0;
  dino.grounded = true;
  state = 'playing';
}

// Input: tap, click, or keyboard all do the same thing
function handleInput() {
  if (state === 'over') {
    // Short delay so a panic-tap right after dying doesn't skip the screen
    if (performance.now() - gameOverTime > 400) resetGame();
    return;
  }
  if (dino.grounded) {
    dino.dy = dino.jumpPower;
    dino.grounded = false;
    playSound(jumpSound);
  }
}

document.addEventListener('pointerdown', handleInput);
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    handleInput();
  }
});

// Update player (dt = 1 means one frame at 60fps)
function updateDino(dt) {
  dino.dy += dino.gravity * dt;
  dino.y += dino.dy * dt;

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

function endGame() {
  playSound(hitSound);
  if (Math.floor(score) > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('highScore', highScore);
  }
  state = 'over';
  gameOverTime = performance.now();
}

// Update obstacles
function updateObstacles(dt) {
  speed = currentSpeed();

  spawnTimer += dt;
  if (spawnTimer >= nextSpawn) {
    createObstacle();
    spawnTimer = 0;
    nextSpawn = randomSpawnGap();
  }

  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].x -= speed * dt;

    // Collision detection
    if (
      dino.x < obstacles[i].x + obstacles[i].width &&
      dino.x + dino.width > obstacles[i].x &&
      dino.y < obstacles[i].y + obstacles[i].height &&
      dino.y + dino.height > obstacles[i].y
    ) {
      endGame();
      return;
    }
  }

  // Remove obstacles that have left the screen
  obstacles = obstacles.filter(o => o.x + o.width > 0);
}

function drawObstacles() {
  ctx.fillStyle = 'red';
  for (const o of obstacles) {
    ctx.fillRect(o.x, o.y, o.width, o.height);
  }
}

// Draw ground
function drawGround() {
  ctx.fillStyle = '#654321'; // brown ground
  ctx.fillRect(0, 290, canvas.width, 10);
}

function drawScore() {
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + Math.floor(score) + '  High: ' + highScore, 10, 30);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px Arial';
  ctx.fillText('Game Over', canvas.width / 2, 110);
  ctx.font = '22px Arial';
  ctx.fillText('Score: ' + Math.floor(score) + '   High Score: ' + highScore, canvas.width / 2, 155);
  ctx.font = '18px Arial';
  ctx.fillText('Tap or press Space to restart', canvas.width / 2, 195);
}

// Game loop
let lastTime = null;

function gameLoop(now) {
  if (lastTime === null) lastTime = now;
  // dt is how many 60fps-frames passed; capped so a hidden tab doesn't cause a huge jump
  const dt = Math.min((now - lastTime) / (1000 / 60), 3);
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (state === 'playing') {
    updateDino(dt);
    updateObstacles(dt);
    if (state === 'playing') score += 0.1 * dt; // +1 point every 10 frames, same as before
  }

  drawGround();
  drawDino();
  drawObstacles();
  drawScore();
  if (state === 'over') drawGameOver();

  requestAnimationFrame(gameLoop);
}

// Start game
nextSpawn = randomSpawnGap();
requestAnimationFrame(gameLoop);
