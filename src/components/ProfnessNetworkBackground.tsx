import React, { useEffect, useRef } from 'react';

/**
 * Interactive ambient plexus network canvas matching the video reference:
 * - Nodes and connecting network lines gently fade in, drift, and fade out.
 * - Colors strictly limited to the official Profness palette:
 *   Deep Blue: #013589
 *   Royal Blue: #2559AF
 *   Sky Blue: #477ED8
 *   Aqua: #65DFD2
 * - Layered behind all UI elements with pointer-events: none and subtle opacity
 *   so it enhances the atmospheric ambient background without covering cards, text, or buttons.
 */
export const ProfnessNetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Color definitions
    const colors = [
      { r: 1, g: 53, b: 137, hex: '#013589' },   // Deep Blue
      { r: 37, g: 89, b: 175, hex: '#2559AF' },  // Royal Blue
      { r: 71, g: 126, b: 216, hex: '#477ED8' }, // Sky Blue
      { r: 101, g: 223, b: 210, hex: '#65DFD2' },// Aqua
    ];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      baseRadius: number;
      color: { r: number; g: number; b: number };
      alpha: number;
      maxAlpha: number;
      fadeSpeed: number;
      fadingIn: boolean;
      depth: number; // 0.4 to 1.2 for 3D parallax depth
    }

    const particleCount = Math.min(65, Math.floor((width * height) / 18000));
    const particles: Particle[] = [];

    const createParticle = (): Particle => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const depth = 0.5 + Math.random() * 0.7;
      const baseRadius = (1.5 + Math.random() * 2.8) * depth;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45 * depth,
        vy: (Math.random() - 0.5) * 0.45 * depth,
        radius: baseRadius,
        baseRadius,
        color,
        alpha: Math.random() * 0.1,
        maxAlpha: (0.25 + Math.random() * 0.45) * depth,
        fadeSpeed: 0.003 + Math.random() * 0.006,
        fadingIn: true,
        depth,
      };
    };

    for (let i = 0; i < particleCount; i++) {
      particles.push(createParticle());
    }

    // Main render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Position drift
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries smoothly
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;

        // Breathing fade in / fade out cycle like the video
        if (p.fadingIn) {
          p.alpha += p.fadeSpeed;
          if (p.alpha >= p.maxAlpha) {
            p.fadingIn = false;
          }
        } else {
          p.alpha -= p.fadeSpeed;
          if (p.alpha <= 0.03) {
            p.fadingIn = true;
            // Slightly evolve color & speed
            p.color = colors[Math.floor(Math.random() * colors.length)];
            p.maxAlpha = (0.25 + Math.random() * 0.45) * p.depth;
          }
        }

        // Draw particle node with a soft glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`;
        ctx.fill();

        // Extra subtle ambient halo around nodes
        if (p.alpha > 0.25) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha * 0.2})`;
          ctx.fill();
        }
      }

      // Draw connecting plexus network lines
      const maxDistance = 140;
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const distanceFactor = 1 - dist / maxDistance;
            // Line opacity depends on both particles' current alpha
            const lineAlpha = Math.min(p1.alpha, p2.alpha) * distanceFactor * 0.75;

            if (lineAlpha > 0.01) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);

              // Smooth gradient line between the two particle colors
              const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
              grad.addColorStop(0, `rgba(${p1.color.r}, ${p1.color.g}, ${p1.color.b}, ${lineAlpha})`);
              grad.addColorStop(1, `rgba(${p2.color.r}, ${p2.color.g}, ${p2.color.b}, ${lineAlpha})`);

              ctx.strokeStyle = grad;
              ctx.lineWidth = 0.9 * Math.min(p1.depth, p2.depth);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[1] w-full h-full mix-blend-multiply opacity-80"
    />
  );
};
