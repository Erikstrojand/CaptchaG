
const canvas = document.getElementById("captcha");
const ctx = canvas.getContext("2d");
const input = document.getElementById("captcha-input");
const scoreEl = document.getElementById("score");
const timerEl = document.getElementById("timer");
const gameOverEl = document.getElementById("game-over");

let currentText = "";
let score = 0;
let timeLeft = 100;
let difficulty = 1
let timerInterval;



const client = supabase.createClient('https://zerjxbmymuepndniageb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inplcmp4Ym15bXVlcG5kbmlhZ2ViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Njk4MTIsImV4cCI6MjA2OTM0NTgxMn0.IAVOuT-woEPJ-DNsAkLHD-kKAoZg-2llFXr5eCaE5uk');


function randomChar() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return chars[Math.floor(Math.random() * chars.length)];
}

function generateCaptchaText(length = 5) {
  let text = "";
  for (let i = 0; i < length; i++) {
    text += randomChar();
  }
  return text;
}

function getRandomColor() {
  const r = Math.floor(100 + Math.random() * 155);
  const g = Math.floor(100 + Math.random() * 155);
  const b = Math.floor(100 + Math.random() * 155);
  return `rgb(${r}, ${g}, ${b})`;
}



function drawWarpedChar(char, x, y, size, font, angle) {
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = size * 2;
  tempCanvas.height = size * 2;

  tempCtx.font = `${size}px ${font}`;
  tempCtx.fillStyle = getRandomColor();
  tempCtx.textBaseline = "middle";
  tempCtx.textAlign = "center";
  tempCtx.fillText(char, tempCanvas.width / 2, tempCanvas.height / 2);

  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const warpedData = tempCtx.createImageData(imageData.width, imageData.height);

  const distortion = Math.min(difficulty * 0.4, 4); //Curve increase
  for (let yy = 0; yy < imageData.height; yy++) {
    const offset = Math.floor(Math.sin(yy / 5) * distortion);
    for (let xx = 0; xx < imageData.width; xx++) {
      const srcIdx = (yy * imageData.width + xx) * 4;
      const destX = xx + offset;
      if (destX >= 0 && destX < imageData.width) {
        const destIdx = (yy * imageData.width + destX) * 4;
        for (let i = 0; i < 4; i++) {
          warpedData.data[destIdx + i] = imageData.data[srcIdx + i];
        }
      }
    }
  }

  const finalCanvas = document.createElement("canvas");
  const finalCtx = finalCanvas.getContext("2d");
  finalCanvas.width = tempCanvas.width;
  finalCanvas.height = tempCanvas.height;
  finalCtx.putImageData(warpedData, 0, 0);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(finalCanvas, -size, -size, size * 2, size * 2);
  ctx.restore();
}





function drawCaptcha() {
  const length = 4 + Math.floor(difficulty / 2);
  currentText = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background lines
  for (let i = 0; i < difficulty * 3 + 10; i++) {
    ctx.strokeStyle = getRandomColor();
    ctx.lineWidth = Math.random() * 3 + 0.5;
    const x1 = Math.random() * canvas.width;
    const y1 = Math.random() * canvas.height;
    const angle = Math.random() * Math.PI * 2;
    const len = 100 + Math.random() * 200;
    const x2 = x1 + Math.cos(angle) * len;
    const y2 = y1 + Math.sin(angle) * len;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const spacing = canvas.width / (length + 1);

  for (let i = 0; i < length; i++) {
    const char = charset[Math.floor(Math.random() * charset.length)];
    currentText += char;

    const x = spacing * (i + 1);
    const baseY = canvas.height / 2;
    const offsetY = Math.sin((i + difficulty) * 0.9) * 20;
    const y = baseY + offsetY;
    const angle = (Math.random() - 0.5) * 0.6;
    const font = fonts[Math.floor(Math.random() * fonts.length)];
    const charSize = Math.floor(20 + Math.random() * 90);

    drawWarpedChar(char, x, y, charSize, font, angle);
  }

  // Dots
  for (let i = 0; i <100 + difficulty * 20 + 10; i++) {
    ctx.fillStyle = getRandomColor();
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

const fonts = ["Courier New", "Georgia", "Verdana", "Impact", "Comic Sans MS", "Times New Roman", "Lucida Console"];




function submitCaptcha() {
  const typed = input.value.trim().toUpperCase();

  // Reset
  input.classList.remove("error", "success");
  void input.offsetWidth; // Force reflow

  if (typed === currentText) {
    score++;
    difficulty += 0.5;
    scoreEl.textContent = score;
    input.classList.add("success");

    drawCaptcha();
  } else {
    input.classList.add("error");
    difficulty = Math.max(1, difficulty - 0.2); // optional penalty
  }

  input.value = "";

  // Remove color feedbak
  setTimeout(() => {
    input.classList.remove("error", "success");
  }, 500);
}


function startGame() {
  drawCaptcha();
  const interval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(interval);
      endGame();
    }
  }, 1000);
}

async function endGame() {
  clearInterval(timerInterval);
  input.disabled = true;

  const gameOverEl = document.getElementById("game-over");
  gameOverEl.innerHTML = `
    ⏱ <strong>Time's up!</strong><br>
    <span style="font-size: 32px; color: #4CAF50; font-weight: bold; display: block; margin-top: 10px;">
      Your Score: ${score}
    </span>
    <br>
    <button onclick="restartGame()" style="padding: 10px 20px; margin-top: 15px; font-size: 18px;"> Play Again</button>
  `;

  document.getElementById("name-entry").style.display = "block";
  await loadLeaderboard();
  document.getElementById("leaderboard").style.display = "block";
}


async function submitName() {
  const nameInput = document.getElementById("name-input");
  const name = nameInput.value.trim() || "Anonymous";

  // Hide name form
  document.getElementById("name-entry").style.display = "none";

  // Save and show leaderboard
  await submitScore(name, score);
  await loadLeaderboard();
}



async function submitScore(name, score) {
  const { data, error } = await client
    .from("scores")
    .insert([{ name, score }]);
  if (error) console.error("Error submitting score:", error);
}


async function loadLeaderboard() {
  const { data, error } = await client
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(200);

  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  if (error) {
    list.innerHTML = "<li>Error loading leaderboard</li>";
    return;
  }

  data.forEach(entry => {
    const li = document.createElement("li");
    li.textContent = `${entry.name}: ${entry.score}`;
    list.appendChild(li);
  });

  document.getElementById("leaderboard").style.display = "block";
}








startGame();

// Allow pressing Enter key
input.addEventListener("keydown", function(e) {
  if (e.key === "Enter") {
    submitCaptcha();
  }
});


function refreshCaptcha() {
  drawCaptcha(); // redraww
  const input = document.getElementById("captcha-input");
  input.value = "";
  input.style.border = "1px solid #ccc"; // resetss
}



function restartGame() {
  score = 0;
  timeLeft = 100;
  difficulty = 1;
  scoreEl.textContent = score;
  timerEl.textContent = timeLeft;
  input.disabled = false;
  input.value = "";
  document.getElementById("game-over").innerHTML = "";
  document.getElementById("name-entry").style.display = "none";
  document.getElementById("leaderboard").style.display = "none";
  drawCaptcha();

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}
