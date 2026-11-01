import { IUserTemplateRepository } from '@/domain/ports/IUserTemplateRepository';
import { UserTemplate } from '@/domain/entities/UserTemplate';
import { db } from '../AppDatabase';
import { UserTemplateMapper } from '../mappers/UserTemplateMapper';

export class DexieUserTemplateRepository implements IUserTemplateRepository {
  async findById(id: string): Promise<UserTemplate | undefined> {
    const record = await db.userTemplates.get(id);
    return record ? UserTemplateMapper.toDomain(record) : undefined;
  }

  async findAll(type?: 'goal' | 'habit'): Promise<readonly UserTemplate[]> {
    let records = await db.userTemplates.orderBy('createdAt').reverse().toArray();
    if (type) {
      records = records.filter(r => r.type === type);
    }
    return records.map(UserTemplateMapper.toDomain);
  }

  async save(template: UserTemplate): Promise<void> {
    const record = UserTemplateMapper.toRecord(template);
    await db.userTemplates.put(record);
  }

  async delete(id: string): Promise<void> {
    await db.userTemplates.delete(id);
  }
}
