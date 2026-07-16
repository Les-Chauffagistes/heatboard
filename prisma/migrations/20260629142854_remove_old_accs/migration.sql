/*
  Warnings:

  - The primary key for the `workernames` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `discord_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ln_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lnurl_auth` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `password_users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `worker_stats_raw` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "discord_users" DROP CONSTRAINT "fk dc_users.users";

-- DropForeignKey
ALTER TABLE "ln_users" DROP CONSTRAINT "ln_users_users_id_fk";

-- DropForeignKey
ALTER TABLE "password_users" DROP CONSTRAINT "password_users_user_id_fkey";

-- DropForeignKey
ALTER TABLE "workernames" DROP CONSTRAINT "fk workernames.user";

-- AlterTable
ALTER TABLE "workernames" DROP CONSTRAINT "workernames_pkey",
ALTER COLUMN "user" SET DATA TYPE TEXT,
ADD CONSTRAINT "workernames_pkey" PRIMARY KEY ("workername", "user", "btc_address");

-- DropTable
DROP TABLE "discord_users";

-- DropTable
DROP TABLE "ln_users";

-- DropTable
DROP TABLE "lnurl_auth";

-- DropTable
DROP TABLE "password_users";

-- DropTable
DROP TABLE "users";

-- DropTable
DROP TABLE "worker_stats_raw";

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "address" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);
