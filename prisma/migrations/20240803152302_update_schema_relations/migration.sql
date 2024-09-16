-- DropForeignKey
ALTER TABLE "Menu" DROP CONSTRAINT "Menu_stallId_fkey";

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Stall"("id") ON DELETE CASCADE ON UPDATE CASCADE;
