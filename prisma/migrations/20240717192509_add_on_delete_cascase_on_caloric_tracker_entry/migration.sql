-- DropForeignKey
ALTER TABLE "CaloricTrackerEntry" DROP CONSTRAINT "CaloricTrackerEntry_caloricTrackerId_fkey";

-- AddForeignKey
ALTER TABLE "CaloricTrackerEntry" ADD CONSTRAINT "CaloricTrackerEntry_caloricTrackerId_fkey" FOREIGN KEY ("caloricTrackerId") REFERENCES "CaloricTracker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
