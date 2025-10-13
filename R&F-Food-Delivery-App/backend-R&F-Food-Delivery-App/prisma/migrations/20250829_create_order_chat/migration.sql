-- CreateTable
CREATE TABLE "OrderChat" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "senderId" INTEGER,
    "senderType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrderChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderChat_orderId_idx" ON "OrderChat"("orderId");

-- CreateIndex
CREATE INDEX "OrderChat_timestamp_idx" ON "OrderChat"("timestamp");

-- AddForeignKey
ALTER TABLE "OrderChat" ADD CONSTRAINT "OrderChat_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderChat" ADD CONSTRAINT "OrderChat_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
