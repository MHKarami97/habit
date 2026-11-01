import { IGoalRepository } from '@/domain/ports/IGoalRepository';
import { Goal } from '@/domain/entities/Goal';
import { Milestone } from '@/domain/entities/Milestone';
import { ActionLog } from '@/domain/entities/ActionLog';
import { ObstacleLog } from '@/domain/entities/ObstacleLog';
import { db, AppDatabase } from '../AppDatabase';
import { GoalMapper } from '../mappers/GoalMapper';

export class DexieGoalRepository implements IGoalRepository {
  constructor(private readonly database: AppDatabase = db) {}

  async findById(id: string): Promise<Goal | null> {
    const record = await this.database.goals.get(id);
    return record ? GoalMapper.toDomain(record) : null;
  }

  async findAll(includeArchived = false): Promise<readonly Goal[]> {
    let records = await this.database.goals.toArray();
    if (!includeArchived) {
      records = records.filter(r => r.isArchived === 0);
    }
    return records.map(GoalMapper.toDomain);
  }

  async save(goal: Goal): Promise<void> {
    const record = GoalMapper.toPersistence(goal);
    await this.database.goals.put(record);
  }

  async delete(id: string): Promise<void> {
    // حذف اتمیک هدف و تمام زیرمجموعه‌ها در قالب تراکنش ACID دکسی
    await this.database.transaction('rw', [this.database.goals, this.database.milestones, this.database.actionLogs, this.database.obstacleLogs], async () => {
      await this.database.goals.delete(id);
      await this.database.milestones.where('goalId').equals(id).delete();
      await this.database.actionLogs.where('goalId').equals(id).delete();
      await this.database.obstacleLogs.where('goalId').equals(id).delete();
    });
  }

  async findMilestonesByGoalId(goalId: string): Promise<readonly Milestone[]> {
    const records = await this.database.milestones.where('goalId').equals(goalId).sortBy('sortOrder');
    return records.map(
      r =>
        new Milestone({
          id: r.id,
          goalId: r.goalId,
          title: r.title,
          targetValue: r.targetValue,
          isCompleted: r.isCompleted === 1,
          dueDate: r.dueDate,
          sortOrder: r.sortOrder
        })
    );
  }

  async saveMilestone(milestone: Milestone): Promise<void> {
    await this.database.milestones.put({
      id: milestone.id,
      goalId: milestone.goalId,
      title: milestone.title,
      targetValue: milestone.targetValue,
      isCompleted: milestone.isCompleted ? 1 : 0,
      dueDate: milestone.dueDate,
      sortOrder: milestone.sortOrder
    });
  }

  async deleteMilestone(milestoneId: string): Promise<void> {
    await this.database.milestones.delete(milestoneId);
  }

  async findActionLogsByGoalId(goalId: string): Promise<readonly ActionLog[]> {
    const records = await this.database.actionLogs.where('goalId').equals(goalId).reverse().sortBy('date');
    return records.map(
      r =>
        new ActionLog({
          id: r.id,
          goalId: r.goalId,
          date: r.date,
          description: r.description,
          progressDelta: r.progressDelta,
          durationMinutes: r.durationMinutes,
          nextStep: r.nextStep,
          createdAt: r.createdAt
        })
    );
  }

  async saveActionLog(actionLog: ActionLog): Promise<void> {
    await this.database.actionLogs.put({
      id: actionLog.id,
      goalId: actionLog.goalId,
      date: actionLog.date,
      description: actionLog.description,
      progressDelta: actionLog.progressDelta,
      durationMinutes: actionLog.durationMinutes,
      nextStep: actionLog.nextStep,
      createdAt: actionLog.createdAt
    });
  }

  async deleteActionLog(actionLogId: string): Promise<void> {
    await this.database.actionLogs.delete(actionLogId);
  }

  async findObstacleLogsByGoalId(goalId: string): Promise<readonly ObstacleLog[]> {
    const records = await this.database.obstacleLogs.where('goalId').equals(goalId).reverse().sortBy('date');
    return records.map(
      r =>
        new ObstacleLog({
          id: r.id,
          goalId: r.goalId,
          date: r.date,
          category: r.category as ObstacleLog['category'],
          customCategory: r.customCategory,
          note: r.note,
          ifThenPlan: r.ifThenPlan,
          createdAt: r.createdAt
        })
    );
  }

  async saveObstacleLog(obstacleLog: ObstacleLog): Promise<void> {
    await this.database.obstacleLogs.put({
      id: obstacleLog.id,
      goalId: obstacleLog.goalId,
      date: obstacleLog.date,
      category: obstacleLog.category,
      customCategory: obstacleLog.customCategory,
      note: obstacleLog.note,
      ifThenPlan: obstacleLog.ifThenPlan,
      createdAt: obstacleLog.createdAt
    });
  }

  async deleteObstacleLog(obstacleLogId: string): Promise<void> {
    await this.database.obstacleLogs.delete(obstacleLogId);
  }
}
