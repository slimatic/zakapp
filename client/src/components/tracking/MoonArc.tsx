/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * MoonArc - the signature hawl progress indicator.
 *
 * A semicircular arc spanning the lunar year, filled to the current day, with a
 * moon glyph riding the fill line. The moon's phase reflects the portion of the
 * hawl completed, which is the app's central metaphor: the hawl IS a lunar year,
 * so progress through it is progress through the moon's phases.
 *
 * Geometry (matches the approved mockup):
 *   viewBox      0 0 128 76
 *   arc          M 10 68 A 54 54 0 0 1 118 68   (semicircle, radius 54)
 *   arc length   ~169.6  -> stroke-dasharray, dashoffset = length * (1 - pct)
 *   moon centre  travels the same arc, r = 9
 *
 * The moon is drawn as a fill circle with a mask circle offset to one side, so
 * the lit fraction matches the hawl fraction (0 = new, 1 = full). The mockup
 * used a stroke ring for the same effect; a mask is used here so the phase is
 * real rather than simulated.
 *
 * Accessibility: the arc is decorative. Progress is conveyed by the text beside
 * it, not by the graphic, so the svg is aria-hidden and the container carries an
 * optional label.
 */

import React from 'react';

export interface MoonArcProps {
  /** Fraction of the hawl completed, 0..1. Clamped. */
  progress: number;
  /** Rendered width in px. The mockup uses 128 on the dashboard, 160 on mobile. */
  size?: number;
  className?: string;
  /** Accessible description for the whole widget. */
  label?: string;
}

const VB_W = 128;
const VB_H = 76;
const CX = 64;
const CY = 68;
const R = 54;
const ARC_LEN = Math.PI * R; // 169.65
const MOON_R = 9;

/** Point on the semicircle for t = 0..1 (0 = left end, 1 = right end). */
function arcPoint(t: number): { x: number; y: number } {
  const angle = Math.PI * (1 - t); // pi -> 0
  return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

export const MoonArc: React.FC<MoonArcProps> = ({
  progress,
  size = 128,
  className = '',
  label
}) => {
  const pct = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const dashOffset = ARC_LEN * (1 - pct);
  const moon = arcPoint(pct);

  // Waning fraction: how much of the disc is shadowed. At pct 0 the moon is new
  // (fully shadowed), at 1 it is full (no shadow).
  const shadowOffset = MOON_R * 2 * pct;
  const clipId = React.useId();

  return (
    <div
      className={`moon-arc ${className}`}
      style={{ width: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="auto" focusable="false">
        <defs>
          {/* Clip to the moon disc so the shadow circle cannot spill */}
          <clipPath id={clipId}>
            <circle cx={moon.x} cy={moon.y} r={MOON_R} />
          </clipPath>
        </defs>

        {/* Track */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="hsl(var(--border-strong))"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* Progress */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={dashOffset}
        />

        {/* Moon: lit disc, with the unlit portion masked out */}
        <g clipPath={`url(#${clipId})`}>
          <circle cx={moon.x} cy={moon.y} r={MOON_R} fill="hsl(var(--primary))" />
          <circle
            cx={moon.x + shadowOffset}
            cy={moon.y}
            r={MOON_R}
            fill="hsl(var(--card))"
          />
        </g>
        <circle
          cx={moon.x}
          cy={moon.y}
          r={MOON_R + 2}
          fill="none"
          stroke="hsl(var(--card))"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
};
