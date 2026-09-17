import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaidOnboardingState1714571346000 implements MigrationInterface {
  name = 'AddPaidOnboardingState1714571346000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "onboarding_status" varchar NOT NULL DEFAULT 'complete'
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "plan" DROP DEFAULT,
      ALTER COLUMN "plan" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "users" SET "plan" = 'basic' WHERE "plan" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "plan" SET DEFAULT 'pro',
      ALTER COLUMN "plan" SET NOT NULL,
      DROP COLUMN IF EXISTS "onboarding_status"
    `);
  }
}
