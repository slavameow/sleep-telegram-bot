-- CreateTable
CREATE TABLE "PayloadHash" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayloadHash_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayloadHash_hash_key" ON "PayloadHash"("hash");
