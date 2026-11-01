export interface MetricTargetProps {
  readonly startValue: number;
  readonly currentValue: number;
  readonly targetValue: number;
  readonly unit: string;
}

export class MetricTarget {
  readonly startValue: number;
  readonly currentValue: number;
  readonly targetValue: number;
  readonly unit: string;

  constructor(props: MetricTargetProps) {
    this.startValue = props.startValue;
    this.currentValue = props.currentValue;
    this.targetValue = props.targetValue;
    this.unit = props.unit.trim();
  }

  /**
   * محاسبه درصد پیشرفت بر مبنای جهت حرکت (صعودی یا نزولی مثلاً کاهش وزن)
   */
  get progressPercentage(): number {
    const totalSpan = this.targetValue - this.startValue;
    if (totalSpan === 0) {
      return this.currentValue >= this.targetValue ? 100 : 0;
    }
    const currentSpan = this.currentValue - this.startValue;
    const ratio = currentSpan / totalSpan;
    const clamped = Math.max(0, Math.min(1, ratio));
    return Math.round(clamped * 100);
  }

  get isAchieved(): boolean {
    if (this.targetValue >= this.startValue) {
      return this.currentValue >= this.targetValue;
    }
    // در مواردی مثل کاهش وزن یا بدهی که هدف کوچکتر از مبدا است
    return this.currentValue <= this.targetValue;
  }

  withCurrentValue(newValue: number): MetricTarget {
    return new MetricTarget({
      startValue: this.startValue,
      currentValue: newValue,
      targetValue: this.targetValue,
      unit: this.unit
    });
  }
}
