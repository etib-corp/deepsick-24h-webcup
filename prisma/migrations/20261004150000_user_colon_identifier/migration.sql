-- New arrivals without an email address (F71) sign in with a colon identifier.
-- `email` becomes optional; residents choose a unique `username` instead.
ALTER TABLE `User` MODIFY `email` VARCHAR(191) NULL;
ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);
