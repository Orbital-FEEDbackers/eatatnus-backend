/*
  Warnings:

  - You are about to drop the column `outletRatingId` on the `OutletReview` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the `OutletRating` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'BUSINESS', 'ADMIN');

-- DropForeignKey
ALTER TABLE "OutletReview" DROP CONSTRAINT "OutletReview_outletRatingId_fkey";

-- DropIndex
DROP INDEX "OutletReview_outletRatingId_key";

-- AlterTable
ALTER TABLE "OutletReview" DROP COLUMN "outletRatingId",
ADD COLUMN     "cleanliness" INTEGER,
ADD COLUMN     "seatAvailability" INTEGER;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "imageUrl";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "OutletRating";

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profileId" INTEGER,
    "reviewId" INTEGER,
    "canteenId" INTEGER,
    "stallId" INTEGER,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Photo_profileId_key" ON "Photo"("profileId");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Stall"("id") ON DELETE SET NULL ON UPDATE CASCADE;
