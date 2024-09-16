/*
  Warnings:

  - You are about to drop the column `canteenId` on the `Location` table. All the data in the column will be lost.
  - Added the required column `address` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Location" DROP CONSTRAINT "Location_canteenId_fkey";

-- DropIndex
DROP INDEX "Location_canteenId_key";

-- AlterTable
ALTER TABLE "Canteen" ADD COLUMN     "locationId" INTEGER;

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "canteenId",
ADD COLUMN     "address" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Canteen" ADD CONSTRAINT "Canteen_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
