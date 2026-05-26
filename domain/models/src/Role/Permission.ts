import { UUID } from 'node:crypto';

export enum Resource {
  DATASOURCE = 'ds',
  REPORT = 'inf',
  ROLE = 'role',
  ORG = 'org',
}

/**
 * Granular actions — not every action is valid for every resource.
 *
 *   inf  : read | edit | delete | delete_own
 *   ds   : read | edit | delete | create_report
 *   org  : edit | create | add_member | remove_member
 *   role : create | edit | delete | assign
 */
export enum ACTION {
  READ = 'read',
  EDIT = 'edit',
  DELETE = 'delete',
  /** inf only — author may delete their own report regardless of broader grants. */
  DELETE_OWN = 'delete_own',
  /** org:create → new datasource; role:create → new role. */
  CREATE = 'create',
  /** ds only — open a new report under this datasource. */
  CREATE_REPORT = 'create_report',
  /** org only — invite a user into the organization. */
  ADD_MEMBER = 'add_member',
  /** org only — remove a member from the organization. */
  REMOVE_MEMBER = 'remove_member',
  /** role only — attach a role to an organization member. */
  ASSIGN = 'assign',
}

/**
 * Aggregate shortcuts that expand via PERMISSION_COVERS.
 *
 *   manage → operational control (content CRUD, member management)
 *   admin  → manage + structural / governance operations
 */
export enum TOPLEVEL_ACTION {
  MANAGE = 'manage',
  ADMIN = 'admin',
}

export type PermissionCode = `${Resource}:${ACTION | TOPLEVEL_ACTION}`;

/**
 * Expansion table for top-level permissions.
 * When the source Permission row carries a datasourceId scope, covered `inf:*`
 * codes are implicitly restricted to that same datasource at evaluation time.
 */
export const PERMISSION_COVERS: Partial<
  Record<`${Resource}:${TOPLEVEL_ACTION}`, PermissionCode[]>
> = {
  /** Read + operational CRUD over a datasource and all its reports. */
  'ds:manage': [
    'ds:read',
    'ds:edit',
    'ds:create_report',
    'inf:read',
    'inf:edit',
    'inf:delete',
  ],
  /** ds:manage + the right to delete the datasource itself. */
  'ds:admin': [
    'ds:read',
    'ds:edit',
    'ds:delete',
    'ds:create_report',
    'inf:read',
    'inf:edit',
    'inf:delete',
  ],
  /** Member management and datasource provisioning within the org. */
  'org:manage': [
    'org:edit',
    'org:create',
    'org:add_member',
    'org:remove_member',
    'ds:read',
  ],
  /** Full org governance: org:manage + complete role administration + all resource control. */
  'org:admin': [
    'org:edit',
    'org:create',
    'org:add_member',
    'org:remove_member',
    'ds:read',
    'ds:edit',
    'ds:delete',
    'ds:create_report',
    'inf:read',
    'inf:edit',
    'inf:delete',
    'role:create',
    'role:edit',
    'role:delete',
    'role:assign',
  ],
};

export interface Permission {
  permissionId: UUID;
  roleId: UUID;
  code: PermissionCode;

  /**
   * Scope — at most one is set; if neither, the permission is org-wide.
   *
   *   'ds:admin' + datasourceId  → admin of that one datasource
   *   'inf:edit' + datasourceId  → edit all reports in that datasource
   *   'inf:edit' + reportId      → edit one specific report
   *   'org:admin' (no scope)     → full org governance
   */
  datasourceId?: UUID;
  reportId?: UUID;
}
