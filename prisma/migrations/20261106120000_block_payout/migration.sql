-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('waiting', 'pending', 'sent', 'cancelled');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "confirmedAt" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "block" (
    "height" INTEGER NOT NULL,
    "minedAt" TIMESTAMPTZ(3) NOT NULL,
    "rewardSatoshi" BIGINT NOT NULL,
    "idempotencyKey" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "block_pkey" PRIMARY KEY ("height")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "block" INTEGER NOT NULL,
    "workername" TEXT NOT NULL,
    "part" DECIMAL(65,30) NOT NULL,
    "amountSatoshi" BIGINT NOT NULL,
    "user" TEXT,
    "btc_address" TEXT,
    "addressFrozenAt" TIMESTAMPTZ(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'waiting',
    "txid" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paymentUpdate" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "fromStatus" "PaymentStatus",
    "toStatus" "PaymentStatus" NOT NULL,
    "actor" TEXT NOT NULL,
    "note" TEXT,
    "txid" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paymentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "block_idempotencyKey_key" ON "block"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payment_user_idx" ON "payment"("user");

-- CreateIndex
CREATE UNIQUE INDEX "payment_block_workername_key" ON "payment"("block", "workername");

-- CreateIndex
CREATE INDEX "paymentUpdate_payment_id_created_at_idx" ON "paymentUpdate"("payment_id", "created_at");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_block_fkey" FOREIGN KEY ("block") REFERENCES "block"("height") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paymentUpdate" ADD CONSTRAINT "paymentUpdate_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

