/*
  Warnings:

  - You are about to alter the column `coOwnershipShare` on the `Unit` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "name" TEXT;

-- AlterTable
ALTER TABLE "Unit" ALTER COLUMN "coOwnershipShare" SET DATA TYPE DECIMAL(65,30);
