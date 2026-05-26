import { Member, Organization, Page } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export interface OrganizationListItem extends Organization {
  memberCount: number;
  dataSourceCount: number;
  reportCount: number;
  isFavorite: boolean;
  canEdit: boolean;
}

export interface OrganizationUseCase {
  createOrganization(name: string, userId: UUID): Promise<Organization>;
  listOrganizationsByUser(
    userId: UUID,
    page?: number,
  ): Promise<Page<OrganizationListItem>>;
  toggleFavoriteOrganization(
    organizationId: UUID,
    userId: UUID,
  ): Promise<boolean>;
  searchOrganizationsByName(
    userId: UUID,
    name: string,
    page?: number,
  ): Promise<Page<OrganizationListItem>>;
  addMember(
    organizationId: UUID,
    actorUserId: UUID,
    email: string,
    roleId: UUID,
  ): Promise<Member>;
  removeMember(
    organizationId: UUID,
    actorUserId: UUID,
    targetUserId: UUID,
  ): Promise<void>;
  editOrganization(
    organizationId: UUID,
    actorUserId: UUID,
    name: string,
  ): Promise<Organization>;
}
