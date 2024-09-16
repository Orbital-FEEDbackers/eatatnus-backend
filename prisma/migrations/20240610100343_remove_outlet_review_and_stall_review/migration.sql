/*
  Warnings:

  - You are about to drop the `OutletReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StallReview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OutletReview" DROP CONSTRAINT "OutletReview_canteenId_fkey";

-- DropForeignKey
ALTER TABLE "OutletReview" DROP CONSTRAINT "OutletReview_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "StallReview" DROP CONSTRAINT "StallReview_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "StallReview" DROP CONSTRAINT "StallReview_stallId_fkey";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "canteenId" INTEGER,
ADD COLUMN     "stallId" INTEGER;

-- DropTable
DROP TABLE "OutletReview";

-- DropTable
DROP TABLE "StallReview";

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Stall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
