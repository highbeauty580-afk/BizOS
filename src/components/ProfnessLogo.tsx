import React from 'react';

interface ProfnessLogoProps {
  className?: string;
  size?: number;
}

/**
 * High-precision vector SVG of the official Profness architectural / data-peak logo
 * Color palette aligned:
 * - Deep Blue: #013589
 * - Royal Blue: #2559AF
 * - Sky Blue: #477ED8
 * - Aqua: #65DFD2
 */
export const ProfnessLogo: React.FC<ProfnessLogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Profness Logo"
    >
      {/* Outer Left Wing Pillar (Sky Blue #477ED8) */}
      <polygon
        points="15,77 15,86 28,86 28,64"
        fill="#477ED8"
      />

      {/* Mid Left Pillar (Royal Blue #2559AF) */}
      <polygon
        points="31.5,86 41,86 41,31.5 28.5,44 28.5,61"
        fill="#2559AF"
      />

      {/* Central Spire & Data Spine (Deep Blue #013589) */}
      <polygon
        points="45,86 55,86 55,8 41,25 41,86"
        fill="#013589"
      />

      {/* Mid Right Pillar (Royal Blue #2559AF) */}
      <polygon
        points="58,86 68.5,86 68.5,46.5 55,30 55,86"
        fill="#2559AF"
      />

      {/* Outer Right Wing Pillar (Sky Blue #477ED8) */}
      <polygon
        points="72,86 85.5,86 85.5,77 72,61"
        fill="#477ED8"
      />

      {/* Base Arch (Royal Blue #2559AF) */}
      <path
        d="M12,92 Q50,89 88,92 Q50,91 12,92 Z"
        fill="#2559AF"
      />

      {/* Aqua Telemetry / Data Graph Line in Center Spire (#65DFD2) */}
      <polyline
        points="47.5,33 53,42 47.5,52 53,62 47.5,71 51,79"
        fill="none"
        stroke="#65DFD2"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Telemetry Data Nodes (#65DFD2) */}
      <circle cx="47.5" cy="33" r="1.8" fill="#65DFD2" />
      <circle cx="53" cy="42" r="1.8" fill="#65DFD2" />
      <circle cx="47.5" cy="52" r="1.8" fill="#65DFD2" />
      <circle cx="53" cy="62" r="1.8" fill="#65DFD2" />
      <circle cx="47.5" cy="71" r="1.8" fill="#65DFD2" />
      <circle cx="51" cy="79" r="1.8" fill="#65DFD2" />
    </svg>
  );
};
