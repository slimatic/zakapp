/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MoonArc } from '../MoonArc';

const getProgressPath = (container: HTMLElement) => {
  const paths = container.querySelectorAll('path');
  // [0] track, [1] progress
  return paths[1];
};

describe('MoonArc', () => {
  it('renders a track and a progress arc', () => {
    const { container } = render(<MoonArc progress={0.586} />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('offsets the progress dash by the remaining fraction', () => {
    const { container } = render(<MoonArc progress={0.586} />);
    const path = getProgressPath(container);
    const dash = Number(path.getAttribute('stroke-dasharray'));
    const offset = Number(path.getAttribute('stroke-dashoffset'));
    // arc length is pi * 54
    expect(dash).toBeCloseTo(Math.PI * 54, 1);
    expect(offset).toBeCloseTo(Math.PI * 54 * (1 - 0.586), 0);
  });

  it('shows an empty arc at 0 and a full arc at 1', () => {
    const { container: empty } = render(<MoonArc progress={0} />);
    expect(Number(getProgressPath(empty).getAttribute('stroke-dashoffset')))
      .toBeCloseTo(Math.PI * 54, 1);

    const { container: full } = render(<MoonArc progress={1} />);
    expect(Number(getProgressPath(full).getAttribute('stroke-dashoffset')))
      .toBeCloseTo(0, 1);
  });

  it('clamps out-of-range and non-finite progress', () => {
    for (const bad of [-1, 2, NaN, Infinity]) {
      const { container } = render(<MoonArc progress={bad} />);
      const offset = Number(getProgressPath(container).getAttribute('stroke-dashoffset'));
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThanOrEqual(Math.PI * 54 + 0.5);
    }
  });

  it('is hidden from assistive tech when it carries no label', () => {
    const { container } = render(<MoonArc progress={0.5} />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('exposes a label when given one', () => {
    const { container } = render(<MoonArc progress={0.5} label="Hawl 50% complete" />);
    const el = container.firstElementChild;
    expect(el?.getAttribute('aria-label')).toBe('Hawl 50% complete');
    expect(el?.getAttribute('aria-hidden')).toBeNull();
  });
});
