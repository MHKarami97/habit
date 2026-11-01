import { describe, it, expect } from 'vitest';
import { GoalStateMachine, InvalidGoalStatusTransitionError } from '@/domain/state-machine/GoalStateMachine';

describe('GoalStateMachine', () => {
  it('allows valid transitions from draft to active and scheduled', () => {
    expect(GoalStateMachine.canTransition('draft', 'active')).toBe(true);
    expect(GoalStateMachine.canTransition('draft', 'scheduled')).toBe(true);
    expect(GoalStateMachine.transition('draft', 'active')).toBe('active');
  });

  it('rejects invalid transitions from draft to completed directly', () => {
    expect(GoalStateMachine.canTransition('draft', 'completed')).toBe(false);
    expect(() => GoalStateMachine.transition('draft', 'completed')).toThrow(
      InvalidGoalStatusTransitionError
    );
  });

  it('allows pausing and resuming an active goal', () => {
    expect(GoalStateMachine.canTransition('active', 'paused')).toBe(true);
    expect(GoalStateMachine.canTransition('paused', 'active')).toBe(true);
  });

  it('allows abandoning from active and paused states', () => {
    expect(GoalStateMachine.canTransition('active', 'abandoned')).toBe(true);
    expect(GoalStateMachine.canTransition('paused', 'abandoned')).toBe(true);
  });

  it('allows reviving an abandoned goal back to draft', () => {
    expect(GoalStateMachine.canTransition('abandoned', 'draft')).toBe(true);
  });

  it('returns same status when transitioning to self', () => {
    expect(GoalStateMachine.transition('active', 'active')).toBe('active');
  });
});
