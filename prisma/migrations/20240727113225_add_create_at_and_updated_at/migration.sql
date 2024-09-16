/*
  Warnings:

  - Made the column `updatedAt` on table `FoodsOnCaloricTrackerEntries` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FoodsOnCaloricTrackerEntries" ALTER COLUMN "updatedAt" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;
