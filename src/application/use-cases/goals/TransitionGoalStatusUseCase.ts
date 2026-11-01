import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { Goal } from '@/domain/entities/Goal';
import { GoalStatus } from '@/domain/value-objects/GoalStatus';
import { GoalStateMachine } from '@/domain/state-machine/GoalStateMachine';

export class TransitionGoalStatusUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(goalId: string, targetStatus: GoalStatus): Promise<Goal> {
    const allGoals = await this.goalRepo.findAll();
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error('هدف یافت نشد');
    }

    // اعتبارسنجی قوانین وضعیت، پیش‌نیازها و روابط والد/فرزند
    const validation = GoalStateMachine.validateContextualTransition({
      goal,
      targetStatus,
      allGoals
    });

    if (!validation.isAllowed) {
      throw new Error(validation.error || 'انتقال وضعیت مجاز نیست.');
    }

    const nowIso = new Date().toISOString();
    const nextStatus = GoalStateMachine.transition(goal.status, targetStatus);
    const updatedGoal = goal.withStatus(nextStatus, nowIso);
    await this.goalRepo.save(updatedGoal);

    // اعمال رفتار آبشاری (Cascade) برای اهداف زیرمجموعه در صورت لزوم
    if (validation.cascadeStatusForChildren && validation.affectedChildren) {
      for (const child of validation.affectedChildren) {
        const updatedChild = child.withStatus(validation.cascadeStatusForChildren, nowIso);
        await this.goalRepo.save(updatedChild);
      }
    }

    return updatedGoal;
  }
}
