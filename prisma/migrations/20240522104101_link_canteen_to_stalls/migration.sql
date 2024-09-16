/*
  Warnings:

  - Added the required column `canteenId` to the `Stall` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stall" ADD COLUMN     "canteenId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Stall" ADD CONSTRAINT "Stall_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
