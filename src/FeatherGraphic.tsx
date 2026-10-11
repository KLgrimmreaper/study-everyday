import React from 'react';

interface Props {
  className?: string;
  glow?: boolean;
  gradientId?: string;
}

export const FeatherGraphic: React.FC<Props> = ({
  className = 'w-6 h-6',
  glow = false,
  gradientId = 'feather-grad',
}) => (
  <svg
    viewBox="0 0 100 100"
    className={`${className} ${
      glow
        ? 'filter drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]'
        : 'filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]'
    }`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M82 14 C66 11, 38 23, 23 48 C16 60, 15 74, 14 84 C24 81, 37 77, 49 67 C73 47, 85 29, 82 14 Z"
      fill={`url(#${gradientId})`}
      stroke="#bce0f5"
      strokeWidth="1.5"
    />
    <path d="M82 14 C63 29, 44 54, 14 84" stroke="#7eb6d9" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M37 57 L29 62 M47 47 L39 53 M57 37 L49 43 M67 27 L60 32"
      stroke="#96c8e8"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient
        id={gradientId}
        x1="82"
        y1="14"
        x2="14"
        y2="84"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#ffffff" />
        <stop offset="0.7" stopColor="#edf5fb" />
        <stop offset="1" stopColor="#b6daf0" />
      </linearGradient>
    </defs>
  </svg>
);
