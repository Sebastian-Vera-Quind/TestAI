import { MigrationInterface, QueryRunner } from 'typeorm';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export class InitialSchema1775896317000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = join(__dirname, '../../scripts/InitialSchema.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE IF EXISTS "role_member" DROP CONSTRAINT IF EXISTS "FK_role_member_role";
      ALTER TABLE IF EXISTS "role_member" DROP CONSTRAINT IF EXISTS "FK_role_member_member";
      ALTER TABLE IF EXISTS "permissions" DROP CONSTRAINT IF EXISTS "FK_permissions_role";
      ALTER TABLE IF EXISTS "member" DROP CONSTRAINT IF EXISTS "FK_member_user";
      ALTER TABLE IF EXISTS "member" DROP CONSTRAINT IF EXISTS "FK_member_organization";
      ALTER TABLE IF EXISTS "datasources" DROP CONSTRAINT IF EXISTS "FK_datasources_organization";
      ALTER TABLE IF EXISTS "roles" DROP CONSTRAINT IF EXISTS "FK_roles_parent";
      ALTER TABLE IF EXISTS "roles" DROP CONSTRAINT IF EXISTS "FK_roles_organization";

      DROP TABLE IF EXISTS "role_member";
      DROP TABLE IF EXISTS "permissions";
      DROP TABLE IF EXISTS "member";
      DROP TABLE IF EXISTS "datasources";
      DROP TABLE IF EXISTS "roles";
      DROP TABLE IF EXISTS "users";
      DROP TABLE IF EXISTS "organizations";
    `);
  }
}
