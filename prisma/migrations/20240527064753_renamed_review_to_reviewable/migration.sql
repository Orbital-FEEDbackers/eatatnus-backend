/*
  Warnings:

  - You are about to drop the column `reviewId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `reviewId` on the `OutletReview` table. All the data in the column will be lost.
  - You are about to drop the column `reviewId` on the `Reply` table. All the data in the column will be lost.
  - You are about to drop the column `reviewId` on the `StallReview` table. All the data in the column will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[reviewableId]` on the table `OutletReview` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[reviewableId]` on the table `StallReview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reviewableId` to the `OutletReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewableId` to the `Reply` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewableId` to the `StallReview` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewableType" AS ENUM ('StallReview', 'OutletReview');

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "OutletReview" DROP CONSTRAINT "OutletReview_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "StallReview" DROP CONSTRAINT "StallReview_reviewId_fkey";

-- DropIndex
DROP INDEX "OutletReview_reviewId_key";

-- DropIndex
DROP INDEX "StallReview_reviewId_key";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "reviewId",
ADD COLUMN     "reviewableId" INTEGER;

-- AlterTable
ALTER TABLE "OutletReview" DROP COLUMN "reviewId",
ADD COLUMN     "reviewableId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Reply" DROP COLUMN "reviewId",
ADD COLUMN     "reviewableId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StallReview" DROP COLUMN "reviewId",
ADD COLUMN     "reviewableId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Review";

-- CreateTable
CREATE TABLE "Reviewable" (
    "id" SERIAL NOT NULL,
    "rating" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewableType" "ReviewableType" NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Reviewable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutletReview_reviewableId_key" ON "OutletReview"("reviewableId");

-- CreateIndex
CREATE UNIQUE INDEX "StallReview_reviewableId_key" ON "StallReview"("reviewableId");

-- AddForeignKey
ALTER TABLE "Reviewable" ADD CONSTRAINT "Reviewable_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StallReview" ADD CONSTRAINT "StallReview_reviewableId_fkey" FOREIGN KEY ("reviewableId") REFERENCES "Reviewable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutletReview" ADD CONSTRAINT "OutletReview_reviewableId_fkey" FOREIGN KEY ("reviewableId") REFERENCES "Reviewable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_reviewableId_fkey" FOREIGN KEY ("reviewableId") REFERENCES "Reviewable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_reviewableId_fkey" FOREIGN KEY ("reviewableId") REFERENCES "Reviewable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
