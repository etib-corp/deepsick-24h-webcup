-- AlterTable
ALTER TABLE `Consultation`
    ADD COLUMN `anonymous` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `outcome` TEXT NULL;
