import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBillingTables1710840000000 implements MigrationInterface {
  name = 'AddBillingTables1710840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE,
        "plan" varchar(20) NOT NULL DEFAULT 'pro',
        "status" varchar(20) NOT NULL DEFAULT 'trialing',
        "trial_ends_at" timestamp NULL,
        "current_period_start_at" timestamp NULL,
        "current_period_ends_at" timestamp NULL,
        "addon_workspace_slots" int NOT NULL DEFAULT 0,
        "addon_staff_seats" int NOT NULL DEFAULT 0,
        "addon_whatsapp_bundles" int NOT NULL DEFAULT 0,
        "whatsapp_messages_used_this_month" int NOT NULL DEFAULT 0,
        "whatsapp_usage_reset_at" timestamp NULL,
        "paystack_customer_code" varchar NULL,
        "paystack_subscription_code" varchar NULL,
        "last_payment_reference" varchar NULL,
        "metadata" jsonb NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "reference" varchar NOT NULL UNIQUE,
        "status" varchar(20) NOT NULL DEFAULT 'pending',
        "amount" int NOT NULL DEFAULT 0,
        "currency" varchar(10) NOT NULL DEFAULT 'NGN',
        "purchase_type" varchar(30) NOT NULL DEFAULT 'plan_upgrade',
        "target_plan" varchar(20) NULL,
        "addon_workspace_slots" int NOT NULL DEFAULT 0,
        "addon_staff_seats" int NOT NULL DEFAULT 0,
        "addon_whatsapp_bundles" int NOT NULL DEFAULT 0,
        "paystack_transaction_id" varchar NULL,
        "metadata" jsonb NULL,
        "raw_response" jsonb NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_payments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      INSERT INTO "subscriptions" (
        "user_id",
        "plan",
        "status",
        "trial_ends_at",
        "current_period_start_at",
        "current_period_ends_at",
        "addon_workspace_slots",
        "addon_staff_seats",
        "addon_whatsapp_bundles",
        "whatsapp_messages_used_this_month",
        "whatsapp_usage_reset_at"
      )
      SELECT
        u."id",
        CASE WHEN u."plan" = 'basic' THEN 'basic' ELSE 'pro' END,
        CASE
          WHEN u."trial_status" = 'expired' THEN 'expired'
          WHEN u."trial_status" = 'active' THEN 'trialing'
          ELSE 'active'
        END,
        u."trial_ends_at",
        u."trial_start_at",
        u."trial_ends_at",
        0,
        0,
        0,
        0,
        NOW()
      FROM "users" u
      WHERE NOT EXISTS (
        SELECT 1 FROM "subscriptions" s WHERE s."user_id" = u."id"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS "payments"');
    await queryRunner.query('DROP TABLE IF EXISTS "subscriptions"');
  }
}
