/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `Stall` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Stall" ADD COLUMN     "ownerId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Stall_ownerId_key" ON "Stall"("ownerId");

-- AddForeignKey
ALTER TABLE "Stall" ADD CONSTRAINT "Stall_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
