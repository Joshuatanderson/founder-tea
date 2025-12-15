"use client";

// Seeded random for consistent noise
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Add jitter/noise to points
function addNoise(
  points: { x: number; y: number; size: number }[],
  positionJitter: number = 2,
  sizeJitter: number = 0.4
): { x: number; y: number; size: number }[] {
  return points.map((p, i) => ({
    x: p.x + (seededRandom(i * 1.1) - 0.5) * positionJitter * 2,
    y: p.y + (seededRandom(i * 2.3) - 0.5) * positionJitter * 2,
    size: p.size * (1 + (seededRandom(i * 3.7) - 0.5) * sizeJitter * 2),
  }));
}

// Generate Fibonacci spiral points
function fibonacciSpiral(count: number, scale: number = 4): { x: number; y: number; size: number }[] {
  const points: { x: number; y: number; size: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = i * 2.4; // Golden angle in radians (~137.5 degrees)
    const radius = scale * Math.sqrt(i);
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    const size = 1 + (i % 5) * 0.3;
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      points.push({ x, y, size });
    }
  }
  return points;
}

// Pre-generate points with noise
const points = addNoise(fibonacciSpiral(500, 3.5), 1.5, 0.5);

export function HeroBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply dark:mix-blend-screen"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Scratched/grain texture */}
        <filter id="scratched" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9 0.1"
            numOctaves="4"
            seed="15"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="0.8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Combined effect */}
        <filter id="combined" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.3" result="blur" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.5 0.08"
            numOctaves="3"
            seed="42"
            result="noise"
          />
          <feDisplacementMap
            in="blur"
            in2="noise"
            scale="0.6"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feMerge>
            <feMergeNode in="displaced" />
            <feMergeNode in="displaced" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main dots with glow */}
      <g filter="url(#combined)">
        {points.map((point, i) => (
          <circle
            key={i}
            cx={Math.round(point.x * 100) / 100}
            cy={Math.round(point.y * 100) / 100}
            r={Math.round(point.size * 100) / 100}
            fill="oklch(0.58 0.20 322 / 0.12)"
          />
        ))}
      </g>

      {/* Bright core dots */}
      <g filter="url(#scratched)">
        {points.map((point, i) => (
          <circle
            key={`core-${i}`}
            cx={Math.round(point.x * 100) / 100}
            cy={Math.round(point.y * 100) / 100}
            r={Math.round(point.size * 50) / 100}
            fill="oklch(0.62 0.22 322 / 0.18)"
          />
        ))}
      </g>
    </svg>
  );
}
