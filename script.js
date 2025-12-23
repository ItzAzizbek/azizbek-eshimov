// Text Scramble Effect
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = "!<>-_\\/[]{}—=+*^?#________";
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => (this.resolve = resolve));
    this.queue = [];

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update() {
    let output = "";
    let complete = 0;

    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }

    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// Initialize Scramble
const el = document.querySelector(".glitch");
if (el) {
  const fx = new TextScramble(el);
  // Delay slightly to match CSS fade in
  setTimeout(() => {
    fx.setText("Azizbek Eshimov");
  }, 500);
}

// Particle Background
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let particlesArray;
let animationId;

// Handle Resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initParticles();
});

// Initial Size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Particle {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.directionX = Math.random() * 0.4 - 0.2;
    this.directionY = Math.random() * 0.4 - 0.2;
    this.size = Math.random() * 2;
    this.color = "#ffffff";
  }

  update() {
    if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
    if (this.y > canvas.height || this.y < 0)
      this.directionY = -this.directionY;

    this.x += this.directionX;
    this.y += this.directionY;
    this.draw();
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
  }
}

function initParticles() {
  particlesArray = [];
  const numberOfParticles = (canvas.height * canvas.width) / 9000;
  for (let i = 0; i < numberOfParticles; i++) {
    particlesArray.push(new Particle());
  }
}

function animateParticles() {
  requestAnimationFrame(animateParticles);
  ctx.clearRect(0, 0, innerWidth, innerHeight);

  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
  }

  // Connect particles (optional simple mesh)
  // Omitted for cleaner look, sticking to starry dust
}

initParticles();
animateParticles();

/* --- Brawl Stars Logic (Static) --- */
const trophyCount = document.getElementById('trophy-count');

// Animate Static Number
if(trophyCount) {
    animateValue(trophyCount, 0, 39000, 2500);
}

function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

