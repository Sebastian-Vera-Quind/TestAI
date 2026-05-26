import { User } from '@insight-ai/domain-models';
import { UserRepository } from '@insight-ai/domain-ports/out';
import { UserEntity } from './UserEntity';
import { UUID } from 'node:crypto';
import { AbstractRepository } from '../config';

export class UserRepositoryAdapter
  extends AbstractRepository<UserEntity>
  implements UserRepository
{
  constructor() {
    super(UserEntity);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const repository = await this.getRepository();

    const userEntity = await repository.findOne({
      where: { email },
    });

    if (!userEntity) {
      return null;
    }

    return userEntity;
  }

  async findUserById(id: UUID): Promise<User | null> {
    const repository = await this.getRepository();

    const userEntity = await repository.findOneBy({ idUser: id });

    if (!userEntity) {
      return null;
    }

    return userEntity;
  }

  async createUser(user: User): Promise<void> {
    const repository = await this.getRepository();

    const userEntity = repository.create({
      idUser: user.idUser,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      validated: user.validated,
    });

    await repository.save(userEntity);
  }

  async updateUser(
    userId: UUID,
    data: Pick<User, 'imageUrl' | 'name'>,
  ): Promise<void> {
    const repository = await this.getRepository();

    await repository.update(
      { idUser: userId },
      {
        name: data.name,
        imageUrl: data.imageUrl,
      },
    );
  }

  async listUsersByEmail(
    partialEmail: string,
  ): Promise<{ email: string; idUser: UUID }[]> {
    const repository = await this.getRepository();

    const userEntities = await repository
      .createQueryBuilder('user')
      .select(['user.email', 'user.idUser'])
      .where('user.email % :email', { email: partialEmail })
      .orderBy('similarity(user.email, :email)', 'DESC')
      .take(10)
      .getMany();

    return userEntities.map((userEntity) => ({
      email: userEntity.email,
      idUser: userEntity.idUser,
    }));
  }
}
