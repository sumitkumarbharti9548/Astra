// public/js/constellation.js
// Renders skills as a living constellation: central "twin" node connected
// to skill nodes, sized by proficiency, colored by market trend.
function renderConstellation(canvas, skills, options = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  const trendColor = { rising: '#00d9a6', stable: '#00b4ff', declining: '#ff5c8d' };

  let width, height, centerX, centerY, nodes;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    centerX = width / 2; centerY = height / 2;
    const radius = Math.min(width, height) * 0.36;

    nodes = (skills || []).map((s, i) => {
      const angle = (i / Math.max(skills.length, 1)) * Math.PI * 2 - Math.PI / 2;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        r: 4 + (s.proficiency / 100) * 9,
        color: trendColor[s.trend] || '#00b4ff',
        name: s.name,
        phase: Math.random() * Math.PI * 2
      };
    });
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (!nodes.length) { t++; requestAnimationFrame(draw); return; }

    nodes.forEach((n) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.02 + n.phase);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(n.x, n.y);
      ctx.strokeStyle = `rgba(124, 92, 255, ${0.06 + pulse * 0.08})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    const centerPulse = 0.5 + 0.5 * Math.sin(t * 0.015);
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 24 + centerPulse * 5);
    grad.addColorStop(0, 'rgba(124, 92, 255, 0.85)');
    grad.addColorStop(1, 'rgba(0, 180, 255, 0)');
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24 + centerPulse * 5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#e6eef8';
    ctx.fill();

    nodes.forEach((n) => {
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.02 + n.phase);
      const glowR = n.r + pulse * 3;

      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR * 2.2);
      g.addColorStop(0, n.color + 'aa');
      g.addColorStop(1, n.color + '00');
      ctx.beginPath();
      ctx.arc(n.x, n.y, glowR * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = n.color;
      ctx.fill();
    });

    if (options.showLabels) {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#9aa4b2';
      nodes.forEach((n) => {
        const labelX = n.x + (n.x > centerX ? n.r + 7 : -(n.r + 7 + ctx.measureText(n.name).width));
        ctx.fillText(n.name, labelX, n.y + 4);
      });
    }

    t++;
    requestAnimationFrame(draw);
  }

  resize(); layout(); draw();
  window.addEventListener('resize', () => { resize(); layout(); });
}
