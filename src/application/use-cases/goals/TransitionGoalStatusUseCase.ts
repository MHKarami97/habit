import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { Goal } from '@/domain/entities/Goal';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { GoalStateMachine } from '@/domain/state-machine/GoalStateMachine';

export class TransitionGoalStatusUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(goalId: string, targetStatus: GoalStatus): Promise<Goal> {
    const goal = await this.goalRepo.findById(goalId);
    if (!goal) {
      throw new Error('هدف یافت نشد');
    }

    const nextStatus = GoalStateMachine.transition(goal.status, targetStatus);
    const updatedGoal = goal.withStatus(nextStatus, new Date().toISOString());

    await this.goalRepo.save(updatedGoal);
    return updatedGoal;
  }
}
