/*
  Warnings:

  - You are about to drop the `_FoodToMenu` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "_FoodToMenu" DROP CONSTRAINT "_FoodToMenu_A_fkey";

-- DropForeignKey
ALTER TABLE "_FoodToMenu" DROP CONSTRAINT "_FoodToMenu_B_fkey";

-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "menuId" INTEGER,
ADD COLUMN     "price" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stripeAccountId" TEXT;

-- DropTable
DROP TABLE "_FoodToMenu";

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "fulfilled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "stallId" INTEGER NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodsOnOrders" (
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "foodId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,

    CONSTRAINT "FoodsOnOrders_pkey" PRIMARY KEY ("foodId","orderId")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Food" ADD CONSTRAINT "Food_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Stall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnOrders" ADD CONSTRAINT "FoodsOnOrders_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodsOnOrders" ADD CONSTRAINT "FoodsOnOrders_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
