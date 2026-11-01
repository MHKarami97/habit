import { UserTemplate, type TemplateData } from '@/domain/entities/UserTemplate';
import type { UserTemplateRecord } from '../AppDatabase';

export class UserTemplateMapper {
  static toDomain(record: UserTemplateRecord): UserTemplate {
    let templateData: TemplateData;
    try {
      templateData = JSON.parse(record.templateDataJson);
    } catch {
      templateData = {} as TemplateData;
    }

    return new UserTemplate({
      id: record.id,
      type: record.type,
      title: record.title,
      description: record.description,
      categoryId: record.categoryId,
      templateData,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    });
  }

  static toRecord(domain: UserTemplate): UserTemplateRecord {
    return {
      id: domain.id,
      type: domain.type,
      title: domain.title,
      description: domain.description,
      categoryId: domain.categoryId,
      templateDataJson: JSON.stringify(domain.templateData),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt
    };
  }
}
