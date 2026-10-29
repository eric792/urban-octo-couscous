-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "gatewayRedirectUrl" TEXT,
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "requestHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_gatewayTxId_key" ON "Order"("gatewayTxId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_gatewayRef_key" ON "Order"("gatewayRef");

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Order_customerEmail_requestHash_idx" ON "Order"("customerEmail", "requestHash");

