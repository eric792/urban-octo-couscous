-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "content" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "concentration" TEXT,
ADD COLUMN     "inspiredBy" TEXT,
ADD COLUMN     "scentFamily" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;
