-- CreateTable
CREATE TABLE `BotGuardToken` (
    `nonce` VARCHAR(191) NOT NULL,
    `form` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BotGuardToken_ip_form_createdAt_idx`(`ip`, `form`, `createdAt`),
    INDEX `BotGuardToken_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`nonce`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
