import { describe, expect, it } from 'vitest';
import { analyze } from './index';
import type { Landmarks } from '../types';

describe('analyze — lateral', () => {
  // A near-perfect side posture: ear, shoulder, hip, ankle all vertically aligned.
  const ideal: Landmarks = {
    ear: { x: 0.5, y: 0.1 },
    shoulder: { x: 0.5, y: 0.25 },
    hip: { x: 0.5, y: 0.5 },
    knee: { x: 0.5, y: 0.72 },
    ankle: { x: 0.5, y: 0.95 },
  };

  it('scores an aligned posture highly', () => {
    const r = analyze('lateral', ideal);
    expect(r.score).toBeGreaterThanOrEqual(95);
    expect(r.metrics.every((m) => m.severity === 'good')).toBe(true);
    expect(r.suggestionIds).toHaveLength(0);
  });

  it('flags forward head posture', () => {
    const fhp: Landmarks = { ...ideal, ear: { x: 0.62, y: 0.1 } };
    const r = analyze('lateral', fhp);
    const fh = r.metrics.find((m) => m.id === 'forwardHead')!;
    expect(fh.severity).not.toBe('good');
    expect(r.score).toBeLessThan(95);
    expect(r.suggestionIds).toContain('chinTuck');
  });

  it('produces one metric per available lateral landmark group', () => {
    const r = analyze('lateral', ideal);
    expect(r.metrics.map((m) => m.id).sort()).toEqual(
      ['forwardHead', 'kneeAlign', 'pelvisShift', 'plumbAlign', 'trunkLean'].sort(),
    );
  });

  it('skips metrics whose landmarks are missing', () => {
    const r = analyze('lateral', { shoulder: { x: 0.5, y: 0.3 }, hip: { x: 0.5, y: 0.6 } });
    expect(r.metrics.map((m) => m.id)).toEqual(['trunkLean']);
  });
});

describe('analyze — frontal', () => {
  const level: Landmarks = {
    eyeL: { x: 0.45, y: 0.1 },
    eyeR: { x: 0.55, y: 0.1 },
    shoulderL: { x: 0.4, y: 0.25 },
    shoulderR: { x: 0.6, y: 0.25 },
    hipL: { x: 0.43, y: 0.55 },
    hipR: { x: 0.57, y: 0.55 },
    kneeL: { x: 0.43, y: 0.75 },
    kneeR: { x: 0.57, y: 0.75 },
    ankleL: { x: 0.43, y: 0.95 },
    ankleR: { x: 0.57, y: 0.95 },
  };

  it('scores a symmetric posture highly', () => {
    const r = analyze('anterior', level);
    expect(r.score).toBeGreaterThanOrEqual(95);
  });

  it('flags an uneven shoulder', () => {
    const uneven: Landmarks = { ...level, shoulderR: { x: 0.6, y: 0.3 } };
    const r = analyze('anterior', uneven);
    const s = r.metrics.find((m) => m.id === 'shoulderLevel')!;
    expect(s.severity).not.toBe('good');
    expect(s.display).toMatch(/right-low/);
  });

  it('detects knock-knee (valgus)', () => {
    const valgus: Landmarks = {
      ...level,
      kneeL: { x: 0.48, y: 0.75 },
      kneeR: { x: 0.52, y: 0.75 },
    };
    const r = analyze('posterior', valgus);
    const k = r.metrics.find((m) => m.id === 'kneeValgus')!;
    expect(k.severity).not.toBe('good');
    expect(k.display).toMatch(/knock-kneed/);
  });
});
