/*
  Warnings:

  - You are about to drop the column `reviewableId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `reviewableId` on the `OutletReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewableId` on the `Reply` table. All the data in the column will be lost.
  - You are about to drop the column `reviewableId` on the `StallReview` table. All the data in the column will be lost.
  - You are about to drop the `Reviewable` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[reviewId]` on the table `OutletReview` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reviewId]` on the table `StallReview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reviewId` to the `OutletReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewId` to the `Reply` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewId` to the `StallReview` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('StallReview', 'OutletReview');

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_reviewableId_fkey";

-- DropForeignKey
ALTER TABLE "OutletReview" DROP CONSTRAINT "OutletReview_reviewableId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_reviewableId_fkey";

-- DropForeignKey
ALTER TABLE "Reviewable" DROP CONSTRAINT "Reviewable_userId_fkey";

-- DropForeignKey
ALTER TABLE "StallReview" DROP CONSTRAINT "StallReview_reviewableId_fkey";

-- DropIndex
DROP INDEX "OutletReview_reviewableId_key";

-- DropIndex
DROP INDEX "StallReview_reviewableId_key";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "reviewableId",
ADD COLUMN     "reviewId" INTEGER;

-- AlterTable
ALTER TABLE "OutletReview" DROP COLUMN "reviewableId",
ADD COLUMN     "reviewId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Reply" DROP COLUMN "reviewableId",
ADD COLUMN     "reviewId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StallReview" DROP COLUMN "reviewableId",
ADD COLUMN     "reviewId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Reviewable";

-- DropEnum
DROP TYPE "ReviewableType";

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewType" "ReviewType" NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutletReview_reviewId_key" ON "OutletReview"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "StallReview_reviewId_key" ON "StallReview"("reviewId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StallReview" ADD CONSTRAINT "StallReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletReview" ADD CONSTRAINT "OutletReview_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE SET NULL ON UPDATE CASCADE;
