import { IGoalRepository } from '@/domain/ports/IGoalRepository';

export interface DeleteObstacleLogInput {
  readonly id: string;
  readonly goalId: string;
}

export class DeleteObstacleLogUseCase {
  constructor(private readonly goalRepo: IGoalRepository) {}

  async execute(input: DeleteObstacleLogInput): Promise<void> {
    await this.goalRepo.deleteObstacleLog(input.id);
  }
}
