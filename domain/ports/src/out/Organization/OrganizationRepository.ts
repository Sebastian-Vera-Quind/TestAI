import { Member, Organization, Page } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export interface OrganizationInfo {
  memberCount: number;
  dataSourceCount: number;
  reportCount: number;
  isFavorite: boolean;
}

export interface OrganizationRepository {
  getMember(userId: UUID, organizationId: UUID): Promise<Member | null>;
  createOrganization(
    organization: Omit<
      Organization,
      'createdAt' | 'updatedAt' | 'organizationId'
    >,
  ): Promise<Organization>;
  deleteOrganization(organizationId: UUID): Promise<void>;
  listOrganizations(userId: UUID, page?: number): Promise<Page<Organization>>;
  addMemberToOrganization(
    organizationId: UUID,
    userId: UUID,
    addedBy?: UUID,
  ): Promise<Member>;
  removeMemberFromOrganization(
    organizationId: UUID,
    userId: UUID,
    removedBy?: UUID,
  ): Promise<void>;
  toggleFavoriteMember(organizationId: UUID, userId: UUID): Promise<boolean>;
  getOrganizationInfo(
    organizationId: UUID,
    userId: UUID,
  ): Promise<OrganizationInfo>;
  searchOrganizations(
    userId: UUID,
    name: string,
    page?: number,
  ): Promise<Page<Organization>>;
  updateOrganization(
    organizationId: UUID,
    data: Pick<Organization, 'name'>,
  ): Promise<Organization>;
}
