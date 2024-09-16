-- CreateTable
CREATE TABLE "CaloricTracker" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CaloricTracker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaloricTrackerEntry" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "caloricTrackerId" INTEGER NOT NULL,

    CONSTRAINT "CaloricTrackerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CaloricTrackerEntryToFood" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CaloricTracker_userId_key" ON "CaloricTracker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CaloricTrackerEntry_caloricTrackerId_key" ON "CaloricTrackerEntry"("caloricTrackerId");

-- CreateIndex
CREATE UNIQUE INDEX "_CaloricTrackerEntryToFood_AB_unique" ON "_CaloricTrackerEntryToFood"("A", "B");

-- CreateIndex
CREATE INDEX "_CaloricTrackerEntryToFood_B_index" ON "_CaloricTrackerEntryToFood"("B");

-- AddForeignKey
ALTER TABLE "CaloricTracker" ADD CONSTRAINT "CaloricTracker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaloricTrackerEntry" ADD CONSTRAINT "CaloricTrackerEntry_caloricTrackerId_fkey" FOREIGN KEY ("caloricTrackerId") REFERENCES "CaloricTracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CaloricTrackerEntryToFood" ADD CONSTRAINT "_CaloricTrackerEntryToFood_A_fkey" FOREIGN KEY ("A") REFERENCES "CaloricTrackerEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CaloricTrackerEntryToFood" ADD CONSTRAINT "_CaloricTrackerEntryToFood_B_fkey" FOREIGN KEY ("B") REFERENCES "Food"("id") ON DELETE CASCADE ON UPDATE CASCADE;
