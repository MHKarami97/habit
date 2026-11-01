export interface ActionLogProps {
  readonly id: string;
  readonly goalId: string;
  readonly date: string; // YYYY-MM-DD
  readonly description: string;
  readonly progressDelta: number;
  readonly durationMinutes: number;
  readonly nextStep?: string;
  readonly createdAt: string;
}

export class ActionLog {
  readonly id: string;
  readonly goalId: string;
  readonly date: string;
  readonly description: string;
  readonly progressDelta: number;
  readonly durationMinutes: number;
  readonly nextStep?: string;
  readonly createdAt: string;

  constructor(props: ActionLogProps) {
    if (!props.id) throw new Error('شناسه لاگ اقدام الزامی است');
    if (!props.description.trim()) throw new Error('شرح اقدام نمی‌تواند خالی باشد');
    this.id = props.id;
    this.goalId = props.goalId;
    this.date = props.date;
    this.description = props.description.trim();
    this.progressDelta = props.progressDelta;
    this.durationMinutes = Math.max(0, props.durationMinutes);
    this.nextStep = props.nextStep?.trim() || undefined;
    this.createdAt = props.createdAt;
  }
}
