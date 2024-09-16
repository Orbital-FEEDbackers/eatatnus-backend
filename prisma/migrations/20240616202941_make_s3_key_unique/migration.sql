/*
  Warnings:

  - A unique constraint covering the columns `[s3Key]` on the table `Image` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_canteenId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_profileId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_stallId_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "Image_s3Key_key" ON "Image"("s3Key");

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_canteenId_fkey" FOREIGN KEY ("canteenId") REFERENCES "Canteen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Stall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
