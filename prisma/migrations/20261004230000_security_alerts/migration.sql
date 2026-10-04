-- CreateTable
CREATE TABLE `SecurityAlert` (
    `id` VARCHAR(191) NOT NULL,
    `fingerprint` VARCHAR(191) NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `rule` VARCHAR(191) NOT NULL,
    `severity` VARCHAR(191) NOT NULL DEFAULT 'WARNING',
    `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
    `title` VARCHAR(191) NOT NULL,
    `detail` TEXT NULL,
    `sourceType` VARCHAR(191) NULL,
    `sourceId` VARCHAR(191) NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedById` VARCHAR(191) NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SecurityAlert_fingerprint_key`(`fingerprint`),
    INDEX `SecurityAlert_status_severity_detectedAt_idx`(`status`, `severity`, `detectedAt`),
    INDEX `SecurityAlert_kind_detectedAt_idx`(`kind`, `detectedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
