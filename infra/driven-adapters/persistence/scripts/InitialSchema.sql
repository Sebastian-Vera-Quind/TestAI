CREATE TABLE IF NOT EXISTS "organizations" (
  "organizationId" uuid PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "imageUrl" text,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "users" (
  "idUser" uuid PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "imageUrl" text,
  "validated" boolean DEFAULT false,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "roles" (
  "idRole" uuid PRIMARY KEY,
  "organizationId" uuid NOT NULL,
  "parentRoleId" uuid,
  "name" varchar(255) NOT NULL,
  "color" varchar(7) NOT NULL,
  "updatedBy" uuid NOT NULL,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ROLES_ORG_PARENT" ON "roles" ("organizationId", "parentRoleId");

CREATE TABLE IF NOT EXISTS "datasources" (
  "idDatasource" uuid PRIMARY KEY,
  "organizationId" uuid NOT NULL,
  "createdByUserId" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "type" varchar(50) NOT NULL,
  "host" varchar(255) NOT NULL,
  "port" integer NOT NULL,
  "username" varchar(255) NOT NULL,
  "password" varchar(255) NOT NULL,
  "database" varchar(255) NOT NULL,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "member" (
  "idMember" uuid PRIMARY KEY,
  "organizationId" uuid NOT NULL,
  "userId" uuid NOT NULL,
  "isFavorite" boolean DEFAULT false,
  "createdAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "IDX_MEMBER_ORG_USER" ON "member" ("organizationId", "userId");

CREATE TABLE IF NOT EXISTS "permissions" (
  "permissionId" uuid PRIMARY KEY,
  "roleId" uuid NOT NULL,
  "code" varchar(50) NOT NULL,
  "datasourceId" uuid,
  "reportId" uuid
);

CREATE TABLE IF NOT EXISTS "role_member" (
  "memberId" uuid NOT NULL,
  "roleId" uuid NOT NULL,
  "assignedAt" timestamp DEFAULT CURRENT_TIMESTAMP,
  "assignedByUserId" uuid,
  PRIMARY KEY ("memberId", "roleId")
);

-- Foreign keys
ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("organizationId") ON DELETE CASCADE;
ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_parent" FOREIGN KEY ("parentRoleId") REFERENCES "roles"("idRole") ON DELETE SET NULL;

ALTER TABLE "datasources" ADD CONSTRAINT "FK_datasources_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("organizationId") ON DELETE CASCADE;

ALTER TABLE "member" ADD CONSTRAINT "FK_member_organization" FOREIGN KEY ("organizationId") REFERENCES "organizations"("organizationId") ON DELETE CASCADE;
ALTER TABLE "member" ADD CONSTRAINT "FK_member_user" FOREIGN KEY ("userId") REFERENCES "users"("idUser") ON DELETE CASCADE;

ALTER TABLE "permissions" ADD CONSTRAINT "FK_permissions_role" FOREIGN KEY ("roleId") REFERENCES "roles"("idRole") ON DELETE CASCADE;

ALTER TABLE "role_member" ADD CONSTRAINT "FK_role_member_member" FOREIGN KEY ("memberId") REFERENCES "member"("idMember") ON DELETE CASCADE;
ALTER TABLE "role_member" ADD CONSTRAINT "FK_role_member_role" FOREIGN KEY ("roleId") REFERENCES "roles"("idRole") ON DELETE CASCADE;
