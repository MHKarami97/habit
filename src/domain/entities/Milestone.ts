export interface MilestoneProps {
  readonly id: string;
  readonly goalId: string;
  readonly title: string;
  readonly targetValue?: number;
  readonly isCompleted: boolean;
  readonly dueDate?: string;
  readonly sortOrder: number;
}

export class Milestone {
  readonly id: string;
  readonly goalId: string;
  readonly title: string;
  readonly targetValue?: number;
  readonly isCompleted: boolean;
  readonly dueDate?: string;
  readonly sortOrder: number;

  constructor(props: MilestoneProps) {
    if (!props.id) throw new Error('شناسه مایلستون الزامی است');
    if (!props.title.trim()) throw new Error('عنوان مایلستون نباید خالی باشد');
    this.id = props.id;
    this.goalId = props.goalId;
    this.title = props.title.trim();
    this.targetValue = props.targetValue;
    this.isCompleted = props.isCompleted;
    this.dueDate = props.dueDate;
    this.sortOrder = props.sortOrder;
  }

  toggleCompleted(): Milestone {
    return new Milestone({
      ...this,
      isCompleted: !this.isCompleted
    });
  }
}
