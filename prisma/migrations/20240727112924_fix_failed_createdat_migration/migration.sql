/*
  Warnings:

  - Added the required column `updatedAt` to the `FoodsOnCaloricTrackerEntries` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "FoodsOnCaloricTrackerEntries" DROP CONSTRAINT "FoodsOnCaloricTrackerEntries_caloricTrackerEntryId_fkey";

-- DropForeignKey
ALTER TABLE "FoodsOnCaloricTrackerEntries" DROP CONSTRAINT "FoodsOnCaloricTrackerEntries_foodId_fkey";

-- AlterTable
ALTER TABLE "FoodsOnCaloricTrackerEntries" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AddForeignKey
ALTER TABLE "FoodsOnCaloricTrackerEntries" ADD CONSTRAINT "FoodsOnCaloricTrackerEntries_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnCaloricTrackerEntries" ADD CONSTRAINT "FoodsOnCaloricTrackerEntries_caloricTrackerEntryId_fkey" FOREIGN KEY ("caloricTrackerEntryId") REFERENCES "CaloricTrackerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
