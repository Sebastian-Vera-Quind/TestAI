import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndex1775896317978 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        CREATE INDEX idx_user_email_trgm
            ON "users"
        USING gin (email gin_trgm_ops);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX idx_user_email_trgm;
    `);
  }
}
