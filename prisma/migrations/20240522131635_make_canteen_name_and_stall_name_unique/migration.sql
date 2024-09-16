/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Canteen` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Stall` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Canteen_name_key" ON "Canteen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Stall_name_key" ON "Stall"("name");
