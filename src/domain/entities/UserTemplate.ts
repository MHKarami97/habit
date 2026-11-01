import { GoalPriority } from '../value-objects/GoalPriority';

export interface GoalTemplateData {
  readonly title: string;
  readonly whyStatement: string;
  readonly priority: GoalPriority;
  readonly startValue: number;
  readonly targetValue: number;
  readonly unit: string;
  readonly durationDays?: number;
  readonly suggestedMilestones?: readonly string[];
  readonly guidance?: string;
}

export interface HabitTemplateData {
  readonly title: string;
  readonly habitType: 'boolean' | 'numeric' | 'duration' | 'quit';
  readonly dailyTarget: number;
  readonly unit: string;
  readonly recurrenceType: 'daily' | 'weekly_days' | 'frequency' | 'interval';
  readonly recurrenceRuleJson: string;
  readonly cue?: string;
  readonly routine?: string;
  readonly reward?: string;
  readonly guidance?: string;
}

export type TemplateData = GoalTemplateData | HabitTemplateData;

export interface UserTemplateProps {
  readonly id: string;
  readonly type: 'goal' | 'habit';
  readonly title: string;
  readonly description?: string;
  readonly categoryId: string;
  readonly templateData: TemplateData;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class UserTemplate {
  readonly id: string;
  readonly type: 'goal' | 'habit';
  readonly title: string;
  readonly description?: string;
  readonly categoryId: string;
  readonly templateData: TemplateData;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: UserTemplateProps) {
    if (!props.id) throw new Error('شناسه قالب الزامی است');
    if (!props.title.trim()) throw new Error('عنوان قالب الزامی است');

    this.id = props.id;
    this.type = props.type;
    this.title = props.title.trim();
    this.description = props.description?.trim();
    this.categoryId = props.categoryId || 'personal';
    this.templateData = props.templateData;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  isGoalTemplate(): this is UserTemplate & { templateData: GoalTemplateData } {
    return this.type === 'goal';
  }

  isHabitTemplate(): this is UserTemplate & { templateData: HabitTemplateData } {
    return this.type === 'habit';
  }

  asGoalTemplate(): GoalTemplateData | undefined {
    return this.isGoalTemplate() ? this.templateData : undefined;
  }

  asHabitTemplate(): HabitTemplateData | undefined {
    return this.isHabitTemplate() ? this.templateData : undefined;
  }
}

