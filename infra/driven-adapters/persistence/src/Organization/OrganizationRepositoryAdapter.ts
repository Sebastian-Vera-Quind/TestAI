import {
  Member,
  NotFoundError,
  Organization,
  Page,
} from '@insight-ai/domain-models';
import {
  OrganizationInfo,
  OrganizationRepository,
} from '@insight-ai/domain-ports/out';
import { randomUUID, UUID } from 'node:crypto';
import { AbstractRepository } from '../config';
import { MemberEntity } from './MemberEntity';
import { OrganizationEntity } from './OrganizationEntity';

const PAGE_SIZE = 10;

export class OrganizationRepositoryAdapter
  extends AbstractRepository<OrganizationEntity>
  implements OrganizationRepository
{
  constructor() {
    super(OrganizationEntity);
  }

  async getMember(userId: UUID, organizationId: UUID): Promise<Member | null> {
    const memberRepository = await this.getAnotherRepository(MemberEntity);
    return memberRepository.findOneBy({ organizationId, userId });
  }

  async toggleFavoriteMember(
    organizationId: UUID,
    userId: UUID,
  ): Promise<boolean> {
    const memberRepository = await this.getAnotherRepository(MemberEntity);

    const member = await memberRepository.findOneBy({ organizationId, userId });

    if (!member) {
      throw new NotFoundError(
        'Member',
        `organizationId=${organizationId}, userId=${userId}`,
      );
    }

    member.isFavorite = !member.isFavorite;
    const updatedMember = await memberRepository.save(member);

    return updatedMember.isFavorite;
  }

  async createOrganization(
    organization: Omit<Organization, 'createdAt' | 'updatedAt'>,
  ): Promise<Organization> {
    const repository = await this.getRepository();

    return repository.save(
      repository.create({
        organizationId: randomUUID(),
        name: organization.name,
        imageUrl: organization.imageUrl,
      }),
    );
  }

  async deleteOrganization(organizationId: UUID): Promise<void> {
    const repository = await this.getRepository();

    await repository.delete({ organizationId });
  }

  async addMemberToOrganization(
    organizationId: UUID,
    userId: UUID,
  ): Promise<Member> {
    const memberRepository = await this.getAnotherRepository(MemberEntity);

    const member = memberRepository.create({
      idMember: randomUUID(),
      organizationId,
      userId,
    });

    return await memberRepository.save(member);
  }

  async removeMemberFromOrganization(
    organizationId: UUID,
    userId: UUID,
  ): Promise<void> {
    const memberRepository = await this.getAnotherRepository(MemberEntity);

    await memberRepository.delete({ organizationId, userId });
  }

  async listOrganizations(userId: UUID, page = 1): Promise<Page<Organization>> {
    const repository = await this.getRepository();
    const offset = (page - 1) * PAGE_SIZE;

    const [organizations, total] = await repository
      .createQueryBuilder('org')
      .innerJoin(
        MemberEntity,
        'member',
        'member.organizationId = org.organizationId',
      )
      .where('member.userId = :userId', { userId })
      .skip(offset)
      .take(PAGE_SIZE)
      .getManyAndCount();

    return {
      items: organizations,
      total,
      hasNext: offset + PAGE_SIZE < total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }

  async getOrganizationInfo(
    organizationId: UUID,
    userId: UUID,
  ): Promise<OrganizationInfo> {
    const memberRepository = await this.getAnotherRepository(MemberEntity);

    const [memberCount, userMember] = await Promise.all([
      memberRepository.countBy({ organizationId }),
      memberRepository.findOneBy({ organizationId, userId }),
    ]);

    return {
      memberCount,
      dataSourceCount: 0,
      reportCount: 0,
      isFavorite: userMember?.isFavorite ?? false,
    };
  }

  async updateOrganization(
    organizationId: UUID,
    data: Pick<Organization, 'name'>,
  ): Promise<Organization> {
    const repository = await this.getRepository();

    const org = await repository.findOneBy({ organizationId });
    if (!org) {
      throw new NotFoundError('Organization', organizationId);
    }

    org.name = data.name;
    return repository.save(org);
  }

  async searchOrganizations(
    userId: UUID,
    name: string,
    page = 1,
  ): Promise<Page<Organization>> {
    const repository = await this.getRepository();
    const offset = (page - 1) * PAGE_SIZE;

    const [organizations, total] = await repository
      .createQueryBuilder('org')
      .innerJoin(
        MemberEntity,
        'member',
        'member.organizationId = org.organizationId',
      )
      .where('member.userId = :userId', { userId })
      .andWhere('LOWER(org.name) LIKE LOWER(:name)', { name: `%${name}%` })
      .skip(offset)
      .take(PAGE_SIZE)
      .getManyAndCount();

    return {
      items: organizations,
      total,
      hasNext: offset + PAGE_SIZE < total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }
}
