import { UserTemplate } from '../entities/UserTemplate';

export interface IUserTemplateRepository {
  findById(id: string): Promise<UserTemplate | undefined>;
  findAll(type?: 'goal' | 'habit'): Promise<readonly UserTemplate[]>;
  save(template: UserTemplate): Promise<void>;
  delete(id: string): Promise<void>;
}
