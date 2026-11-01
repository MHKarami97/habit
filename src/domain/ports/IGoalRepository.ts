import { Goal } from '../entities/Goal';
import { Milestone } from '../entities/Milestone';
import { ActionLog } from '../entities/ActionLog';
import { ObstacleLog } from '../entities/ObstacleLog';

export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>;
  findAll(includeArchived?: boolean): Promise<readonly Goal[]>;
  save(goal: Goal): Promise<void>;
  delete(id: string): Promise<void>;

  // Milestones
  findMilestonesByGoalId(goalId: string): Promise<readonly Milestone[]>;
  saveMilestone(milestone: Milestone): Promise<void>;
  deleteMilestone(milestoneId: string): Promise<void>;

  // Action Logs
  findActionLogsByGoalId(goalId: string): Promise<readonly ActionLog[]>;
  saveActionLog(actionLog: ActionLog): Promise<void>;
  deleteActionLog(actionLogId: string): Promise<void>;

  // Obstacle Logs
  findObstacleLogsByGoalId(goalId: string): Promise<readonly ObstacleLog[]>;
  saveObstacleLog(obstacleLog: ObstacleLog): Promise<void>;
  deleteObstacleLog(obstacleLogId: string): Promise<void>;
}
