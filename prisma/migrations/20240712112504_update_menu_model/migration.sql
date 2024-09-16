/*
  Warnings:

  - You are about to drop the column `energy` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `servingSize` on the `Food` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Food" DROP COLUMN "energy",
DROP COLUMN "servingSize",
ALTER COLUMN "servingQty" DROP NOT NULL,
ALTER COLUMN "servingUnit" DROP NOT NULL,
ALTER COLUMN "servingUnit" SET DATA TYPE TEXT,
ALTER COLUMN "servingWeightGrams" DROP NOT NULL;
