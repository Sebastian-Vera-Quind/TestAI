import { User } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export interface UserUsecase {
  createUser(name: string, email: string, imageUrl?: string): Promise<UUID>;
  listUserEmails(
    partialEmail: string,
  ): Promise<{ email: string; idUser: UUID }[]>;
  getUserByEmail(email: string): Promise<User>;
  getUserById(userId: UUID): Promise<User>;
}
