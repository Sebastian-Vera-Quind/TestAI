import { DataError, User } from '@insight-ai/domain-models';
import { UserRepository } from '@insight-ai/domain-ports/out';
import { randomUUID, type UUID } from 'node:crypto';
import { UserUsecase } from '@insight-ai/domain-ports/in';
import { NotFoundError } from '@insight-ai/domain-models';

export interface UserUseCaseServiceDependencies {
  userRepository: UserRepository;
}

export class UserUseCaseService implements UserUsecase {
  constructor(private readonly dependencies: UserUseCaseServiceDependencies) {}

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.dependencies.userRepository.findUserByEmail(email);

    if (!user) {
      throw new NotFoundError('User', email);
    }
    return user;
  }

  async listUserEmails(
    partialEmail: string,
  ): Promise<{ email: string; idUser: UUID }[]> {
    const users =
      await this.dependencies.userRepository.listUsersByEmail(partialEmail);
    return users;
  }

  async getUserById(userId: UUID): Promise<User> {
    const user = await this.dependencies.userRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return user;
  }

  async createUser(
    name: string,
    email: string,
    imageUrl?: string,
  ): Promise<UUID> {
    const existingUser =
      await this.dependencies.userRepository.findUserByEmail(email);

    if (existingUser) {
      throw new DataError('A user with the provided email already exists.');
    }

    const user: User = {
      idUser: randomUUID(),
      name: name,
      email: email,
      imageUrl: imageUrl,
      validated: true,
    };

    await this.dependencies.userRepository.createUser(user);

    return user.idUser;
  }
}
