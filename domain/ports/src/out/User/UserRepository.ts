import { User } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export interface UserRepository {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: UUID): Promise<User | null>;
  createUser(user: User): Promise<void>;
  updateUser(
    userId: UUID,
    data: Pick<User, 'imageUrl' | 'name'>,
  ): Promise<void>;
  listUsersByEmail(
    partialEmail: string,
  ): Promise<{ email: string; idUser: UUID }[]>;
}
