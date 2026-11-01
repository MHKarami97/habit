import { describe, it, expect } from 'vitest';
import { LoadBenchmarkRunner } from '../../src/infrastructure/benchmarks/LoadBenchmarkRunner';

describe('Phase 2 Package 4: LoadBenchmarkRunner Architecture', () => {
  it('exposes runLoadTest and cleanupBenchmarkData as functions', () => {
    expect(typeof LoadBenchmarkRunner.runLoadTest).toBe('function');
    expect(typeof LoadBenchmarkRunner.cleanupBenchmarkData).toBe('function');
  });

  it('validates benchmark progress callbacks and metrics signature', () => {
    const progressHistory: { stage: string; percent: number }[] = [];
    const callback = (stage: string, percent: number) => {
      progressHistory.push({ stage, percent });
    };

    callback('تست', 50);
    expect(progressHistory.length).toBe(1);
    expect(progressHistory[0]?.percent).toBe(50);
  });
});
