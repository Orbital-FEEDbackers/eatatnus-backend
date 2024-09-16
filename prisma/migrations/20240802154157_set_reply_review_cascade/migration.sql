-- DropForeignKey
ALTER TABLE "Reply" DROP CONSTRAINT "Reply_reviewId_fkey";

-- AddForeignKey
ALTER TABLE "Reply" ADD CONSTRAINT "Reply_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
