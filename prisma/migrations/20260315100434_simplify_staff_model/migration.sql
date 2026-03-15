/*
  Warnings:

  - You are about to drop the `PropertyStaff` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PropertyStaff" DROP CONSTRAINT "PropertyStaff_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "PropertyStaff" DROP CONSTRAINT "PropertyStaff_userId_fkey";

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "accountantName" TEXT,
ADD COLUMN     "managerName" TEXT;

-- DropTable
DROP TABLE "PropertyStaff";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "StaffRole";
