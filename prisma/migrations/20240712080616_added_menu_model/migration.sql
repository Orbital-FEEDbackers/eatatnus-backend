-- CreateTable
CREATE TABLE "Menu" (
    "id" SERIAL NOT NULL,
    "stallId" INTEGER NOT NULL,

    CONSTRAINT "Menu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Food" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "servingSize" INTEGER NOT NULL,
    "energy" INTEGER NOT NULL,
    "servingQty" INTEGER NOT NULL,
    "servingUnit" INTEGER NOT NULL,
    "servingWeightGrams" INTEGER NOT NULL,
    "calories" DOUBLE PRECISION,
    "totalFat" DOUBLE PRECISION,
    "saturatedFat" DOUBLE PRECISION,
    "cholesterol" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "totalCarbohydrate" DOUBLE PRECISION,
    "dietaryFiber" DOUBLE PRECISION,
    "sugars" DOUBLE PRECISION,
    "protein" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FoodToMenu" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Menu_stallId_key" ON "Menu"("stallId");

-- CreateIndex
CREATE UNIQUE INDEX "_FoodToMenu_AB_unique" ON "_FoodToMenu"("A", "B");

-- CreateIndex
CREATE INDEX "_FoodToMenu_B_index" ON "_FoodToMenu"("B");

-- AddForeignKey
ALTER TABLE "Menu" ADD CONSTRAINT "Menu_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "Stall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FoodToMenu" ADD CONSTRAINT "_FoodToMenu_A_fkey" FOREIGN KEY ("A") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FoodToMenu" ADD CONSTRAINT "_FoodToMenu_B_fkey" FOREIGN KEY ("B") REFERENCES "Menu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
