-- CreateTable
CREATE TABLE `SecurityEvent` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `outcome` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `actorId` VARCHAR(191) NULL,
    `actorRole` VARCHAR(191) NULL,
    `targetType` VARCHAR(191) NULL,
    `targetId` VARCHAR(191) NULL,
    `detail` TEXT NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SecurityEvent_type_createdAt_idx`(`type`, `createdAt`),
    INDEX `SecurityEvent_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
