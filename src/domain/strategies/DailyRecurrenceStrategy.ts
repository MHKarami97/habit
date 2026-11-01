import { IRecurrenceStrategy } from './IRecurrenceStrategy';

export class DailyRecurrenceStrategy implements IRecurrenceStrategy {
  isDueOn(): boolean {
    return true; // عادت روزانه در تمام روزها باید انجام شود
  }

  describe(): string {
    return 'هر روز';
  }
}
