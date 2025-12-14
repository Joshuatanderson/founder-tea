"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

// Golden ratio for Fibonacci spiral
const PHI = (1 + Math.sqrt(5)) / 2;

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

// Generate Archimedean spiral points
function archimedeanSpiral(count: number): { x: number; y: number; size: number }[] {
  const points: { x: number; y: number; size: number }[] = [];
  const a = 0.5;
  const b = 2;
  for (let i = 0; i < count; i++) {
    const theta = i * 0.2;
    const r = a + b * theta;
    const x = 50 + r * Math.cos(theta);
    const y = 50 + r * Math.sin(theta);
    const size = 0.8 + Math.sin(i * 0.1) * 0.4;
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      points.push({ x, y, size });
    }
  }
  return points;
}

// Generate concentric rings with varying density
function concentricRings(rings: number, dotsPerRing: number): { x: number; y: number; size: number }[] {
  const points: { x: number; y: number; size: number }[] = [];
  for (let r = 1; r <= rings; r++) {
    const radius = r * (45 / rings);
    const dots = Math.floor(dotsPerRing * (r / rings));
    for (let d = 0; d < dots; d++) {
      const angle = (d / dots) * Math.PI * 2 + (r % 2) * 0.1;
      const x = 50 + radius * Math.cos(angle);
      const y = 50 + radius * Math.sin(angle);
      const size = 0.6 + (r % 3) * 0.3;
      points.push({ x, y, size });
    }
  }
  return points;
}

// Generate Fermat spiral (sunflower pattern)
function fermatSpiral(count: number): { x: number; y: number; size: number }[] {
  const points: { x: number; y: number; size: number }[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 1; i < count; i++) {
    const radius = 2.5 * Math.sqrt(i);
    const theta = i * goldenAngle;
    const x = 50 + radius * Math.cos(theta);
    const y = 50 + radius * Math.sin(theta);
    const size = 0.5 + (Math.sqrt(i) % 2) * 0.5;
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      points.push({ x, y, size });
    }
  }
  return points;
}

// Generate logarithmic spiral
function logSpiral(count: number): { x: number; y: number; size: number }[] {
  const points: { x: number; y: number; size: number }[] = [];
  const a = 1;
  const b = 0.15;
  for (let i = 0; i < count; i++) {
    const theta = i * 0.15;
    const r = a * Math.exp(b * theta);
    const x = 50 + r * Math.cos(theta);
    const y = 50 + r * Math.sin(theta);
    const size = 0.5 + (i % 4) * 0.25;
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100 && r < 50) {
      points.push({ x, y, size });
    }
  }
  return points;
}

// Generate double spiral (DNA-like)
function doubleSpiral(count: number): { x: number; y: number; size: number }[] {
  const points: { x: number; y: number; size: number }[] = [];
  for (let i = 0; i < count; i++) {
    const theta = i * 0.2;
    const r = 3 + theta * 1.5;
    // First spiral
    const x1 = 50 + r * Math.cos(theta);
    const y1 = 50 + r * Math.sin(theta);
    // Second spiral (offset by PI)
    const x2 = 50 + r * Math.cos(theta + Math.PI);
    const y2 = 50 + r * Math.sin(theta + Math.PI);
    const size = 0.7 + Math.sin(i * 0.3) * 0.3;
    if (x1 >= 0 && x1 <= 100 && y1 >= 0 && y1 <= 100) {
      points.push({ x: x1, y: y1, size });
    }
    if (x2 >= 0 && x2 <= 100 && y2 >= 0 && y2 <= 100) {
      points.push({ x: x2, y: y2, size });
    }
  }
  return points;
}

// Scattered dots with Poisson-like distribution
function poissonScatter(count: number, seed: number = 42): { x: number; y: number; size: number }[] {
  const points: { x: number; y: number; size: number }[] = [];
  // Simple seeded random for consistency
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < count; i++) {
    const x = random(seed + i * 1.1) * 100;
    const y = random(seed + i * 2.3) * 100;
    const size = 0.4 + random(seed + i * 3.7) * 0.8;
    points.push({ x, y, size });
  }
  return points;
}

type PatternType = "fibonacci" | "archimedean" | "concentric" | "fermat" | "logarithmic" | "double" | "scatter" | "none";

const patterns: { id: PatternType; name: string; generator: () => { x: number; y: number; size: number }[] }[] = [
  { id: "none", name: "None", generator: () => [] },
  { id: "fibonacci", name: "Fibonacci", generator: () => addNoise(fibonacciSpiral(500, 3.5), 1.5, 0.5) },
  { id: "fermat", name: "Sunflower", generator: () => addNoise(fermatSpiral(400), 1.2, 0.4) },
  { id: "archimedean", name: "Archimedean", generator: () => addNoise(archimedeanSpiral(300), 1.8, 0.5) },
  { id: "logarithmic", name: "Logarithmic", generator: () => addNoise(logSpiral(400), 1.5, 0.4) },
  { id: "concentric", name: "Concentric", generator: () => addNoise(concentricRings(20, 40), 2.0, 0.6) },
  { id: "double", name: "Double Helix", generator: () => addNoise(doubleSpiral(150), 1.5, 0.5) },
  { id: "scatter", name: "Scatter", generator: () => addNoise(poissonScatter(200), 0.5, 0.3) },
];

export function HeroBackground({ pattern }: { pattern: PatternType }) {
  const patternData = patterns.find(p => p.id === pattern);
  const points = patternData?.generator() ?? [];

  if (pattern === "none" || points.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply dark:mix-blend-screen"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        {/* Glow/blur filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

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
            cx={point.x}
            cy={point.y}
            r={point.size}
            fill="oklch(0.58 0.20 322 / 0.12)"
          />
        ))}
      </g>

      {/* Bright core dots */}
      <g filter="url(#scratched)">
        {points.map((point, i) => (
          <circle
            key={`core-${i}`}
            cx={point.x}
            cy={point.y}
            r={point.size * 0.5}
            fill="oklch(0.62 0.22 322 / 0.18)"
          />
        ))}
      </g>
    </svg>
  );
}

export function PatternSwitcher({
  currentPattern,
  onPatternChange
}: {
  currentPattern: PatternType;
  onPatternChange: (pattern: PatternType) => void;
}) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-wrap gap-2 p-3 bg-background/80 backdrop-blur border rounded-lg max-w-md">
      <span className="w-full text-xs text-muted-foreground mb-1">Background Pattern:</span>
      {patterns.map((p) => (
        <Button
          key={p.id}
          size="xs"
          variant={currentPattern === p.id ? "default" : "outline"}
          onClick={() => onPatternChange(p.id)}
        >
          {p.name}
        </Button>
      ))}
    </div>
  );
}

export function useHeroPattern() {
  const [pattern, setPattern] = useState<PatternType>("fibonacci");
  return { pattern, setPattern };
}

export type { PatternType };
