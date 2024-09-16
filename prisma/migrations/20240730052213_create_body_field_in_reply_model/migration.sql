/*
  Warnings:

  - Added the required column `body` to the `Reply` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reply" ADD COLUMN     "body" TEXT NOT NULL;
