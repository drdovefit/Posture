import { describe, expect, it } from 'vitest';
import {
  angleAtVertex,
  angleFromVertical,
  distance,
  midpoint,
  tiltFromHorizontal,
} from './geometry';

describe('geometry', () => {
  it('distance is Euclidean', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('midpoint averages coordinates', () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 2, y: 4 })).toEqual({ x: 1, y: 2 });
  });

  it('angleFromVertical is 0 for a straight-down segment', () => {
    expect(angleFromVertical({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 })).toBeCloseTo(0, 5);
  });

  it('angleFromVertical is 45° when x and y offsets are equal', () => {
    expect(angleFromVertical({ x: 0, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(45, 5);
  });

  it('angleFromVertical is negative for a leftward lean', () => {
    expect(angleFromVertical({ x: 0.5, y: 0 }, { x: 0.3, y: 1 })).toBeLessThan(0);
  });

  it('tiltFromHorizontal is 0 for a level segment', () => {
    expect(tiltFromHorizontal({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 })).toBeCloseTo(0, 5);
  });

  it('tiltFromHorizontal is positive when the right point is lower', () => {
    // right point (larger x) has larger y (lower on screen) => right-low, positive
    expect(tiltFromHorizontal({ x: 0.2, y: 0.4 }, { x: 0.8, y: 0.5 })).toBeGreaterThan(0);
  });

  it('angleAtVertex is 180 for a straight line', () => {
    expect(
      angleAtVertex({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 }),
    ).toBeCloseTo(180, 5);
  });

  it('angleAtVertex is 90 for a right angle', () => {
    expect(
      angleAtVertex({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }),
    ).toBeCloseTo(90, 5);
  });
});
