/*
  Warnings:

  - The primary key for the `OutletReview` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `OutletReview` table. All the data in the column will be lost.
  - The primary key for the `StallReview` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `StallReview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OutletReview" DROP CONSTRAINT "OutletReview_pkey",
DROP COLUMN "id";

-- AlterTable
ALTER TABLE "StallReview" DROP CONSTRAINT "StallReview_pkey",
DROP COLUMN "id";
