/*
  Warnings:

  - You are about to drop the `_CaloricTrackerEntryToFood` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CaloricTrackerEntryToFood" DROP CONSTRAINT "_CaloricTrackerEntryToFood_A_fkey";

-- DropForeignKey
ALTER TABLE "_CaloricTrackerEntryToFood" DROP CONSTRAINT "_CaloricTrackerEntryToFood_B_fkey";

-- DropTable
DROP TABLE "_CaloricTrackerEntryToFood";

-- CreateTable
CREATE TABLE "FoodsOnCaloricTrackerEntries" (
    "count" INTEGER NOT NULL DEFAULT 1,
    "foodId" INTEGER NOT NULL,
    "caloricTrackerEntryId" INTEGER NOT NULL,

    CONSTRAINT "FoodsOnCaloricTrackerEntries_pkey" PRIMARY KEY ("foodId","caloricTrackerEntryId")
);

-- AddForeignKey
ALTER TABLE "FoodsOnCaloricTrackerEntries" ADD CONSTRAINT "FoodsOnCaloricTrackerEntries_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnCaloricTrackerEntries" ADD CONSTRAINT "FoodsOnCaloricTrackerEntries_caloricTrackerEntryId_fkey" FOREIGN KEY ("caloricTrackerEntryId") REFERENCES "CaloricTrackerEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
