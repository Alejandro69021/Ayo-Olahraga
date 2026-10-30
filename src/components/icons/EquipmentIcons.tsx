import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

/**
 * Custom Sports-Grade Flat Minimalist SVG Icons
 * Strictly zero emojis, designed for high-contrast fitness UI.
 */

export function BrandLogo({ className = "w-6 h-6", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4 14.5L12 3l8 11.5H4z" fill="currentColor" fillOpacity="0.15" />
      <path d="M2.5 17h19M6 21h12M12 3v11.5" />
    </svg>
  );
}

export function BarbellIcon({ className = "w-8 h-8", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Central Knurled Bar */}
      <line x1="2" y1="12" x2="22" y2="12" strokeWidth="2.2" />
      {/* Outer Collars */}
      <rect x="4" y="8.5" width="2" height="7" rx="0.5" fill="currentColor" />
      <rect x="18" y="8.5" width="2" height="7" rx="0.5" fill="currentColor" />
      {/* Inner Heavy Plates */}
      <rect x="6" y="6.5" width="2.5" height="11" rx="1" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
      <rect x="15.5" y="6.5" width="2.5" height="11" rx="1" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
      {/* Knurling accents on bar */}
      <line x1="10" y1="11" x2="10" y2="13" strokeWidth="1.5" />
      <line x1="14" y1="11" x2="14" y2="13" strokeWidth="1.5" />
    </svg>
  );
}

export function DumbbellIcon({ className = "w-8 h-8", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Center Handle */}
      <line x1="8.5" y1="12" x2="15.5" y2="12" strokeWidth="2.5" />
      {/* Inner Weight Hex Plates */}
      <rect x="6" y="8" width="2.5" height="8" rx="0.8" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
      <rect x="15.5" y="8" width="2.5" height="8" rx="0.8" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
      {/* Outer Weight Plates */}
      <rect x="3.5" y="9.5" width="2.5" height="5" rx="0.6" fill="currentColor" />
      <rect x="18" y="9.5" width="2.5" height="5" rx="0.6" fill="currentColor" />
    </svg>
  );
}

export function BodyweightIcon({ className = "w-8 h-8", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Head */}
      <circle cx="12" cy="5" r="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
      {/* Torso & Core */}
      <path d="M12 7.5v8" strokeWidth="2.2" />
      {/* Dynamic Arms in Push-up / Dip tension */}
      <path d="M5 11l7-2 7 2" strokeWidth="2" />
      {/* Dynamic Lower Body */}
      <path d="M9 21.5l3-6 3 6" strokeWidth="2.2" />
      {/* Ground plane for calisthenics floor contact */}
      <line x1="4" y1="21.5" x2="20" y2="21.5" strokeWidth="1.5" strokeDasharray="2 2" strokeOpacity="0.6" />
    </svg>
  );
}

export function KettlebellIcon({ className = "w-8 h-8", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Ergonomic Horns & Handle */}
      <path d="M8 8V5a4 4 0 0 1 8 0v3" strokeWidth="2.2" />
      {/* Cast Iron Ball Body */}
      <circle cx="12" cy="14" r="7" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2" />
      {/* Flat Machined Bottom */}
      <line x1="8.5" y1="20.5" x2="15.5" y2="20.5" strokeWidth="2.5" />
    </svg>
  );
}

export function PlateIcon({ className = "w-8 h-8", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Outer Bumper Plate Rim */}
      <circle cx="12" cy="12" r="9.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" />
      {/* Raised Lip */}
      <circle cx="12" cy="12" r="6.5" strokeWidth="1.5" strokeOpacity="0.7" />
      {/* Olympic Center Bushing Hole (50.4mm) */}
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      {/* Grip Cutouts */}
      <path d="M8 6a6 6 0 0 1 8 0" strokeWidth="1.5" />
      <path d="M8 18a6 6 0 0 0 8 0" strokeWidth="1.5" />
    </svg>
  );
}

export function CableMachineIcon({ className = "w-8 h-8", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Top Beam */}
      <line x1="3" y1="4" x2="21" y2="4" strokeWidth="2.2" />
      {/* Left Pulley Wheel */}
      <circle cx="6" cy="6.5" r="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" />
      {/* Right Pulley Wheel */}
      <circle cx="18" cy="6.5" r="2" fill="currentColor" fillOpacity="0.25" stroke="currentColor" />
      {/* Vertical Columns */}
      <line x1="6" y1="8.5" x2="6" y2="21" strokeWidth="1.8" />
      <line x1="18" y1="8.5" x2="18" y2="21" strokeWidth="1.8" />
      {/* Left Weight Stack Plates */}
      <rect x="4" y="14" width="4" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" />
      {/* Cable Lines converging to center handle */}
      <path d="M6 6.5l6 5 6-5" strokeWidth="1.6" />
      {/* Center Handle Carabiner */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="12" y1="13.5" x2="12" y2="16" strokeWidth="1.8" />
      <path d="M9.5 16h5" strokeWidth="2.2" />
    </svg>
  );
}
