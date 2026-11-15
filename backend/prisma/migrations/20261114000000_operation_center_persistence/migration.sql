-- CreateTable
CREATE TABLE `operation_lines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(64) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `permissionCode` VARCHAR(100) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `operation_lines_name_key`(`name`),
    UNIQUE INDEX `operation_lines_code_key`(`code`),
    UNIQUE INDEX `operation_lines_permissionCode_key`(`permissionCode`),
    INDEX `operation_lines_enabled_sort_idx`(`enabled`, `sort`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tour_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lineId` INTEGER NOT NULL,
    `stage` VARCHAR(32) NOT NULL,
    `orderNo` VARCHAR(64) NOT NULL,
    `tourNo` VARCHAR(64) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `flightsOutbound` TEXT NOT NULL,
    `flightsInbound` TEXT NOT NULL,
    `source` VARCHAR(64) NOT NULL,
    `agency` VARCHAR(120) NOT NULL,
    `peopleTotal` INTEGER NOT NULL,
    `peopleAdults` INTEGER NOT NULL,
    `peopleChildren` INTEGER NOT NULL,
    `owner` VARCHAR(64) NOT NULL,
    `assistant` VARCHAR(64) NOT NULL,
    `departureDate` VARCHAR(10) NOT NULL,
    `returnDate` VARCHAR(10) NOT NULL,
    `itinerary` JSON NOT NULL,
    `operations` JSON NOT NULL,
    `subcontract` JSON NOT NULL,
    `hotels` JSON NOT NULL,
    `restaurants` JSON NOT NULL,
    `fleet` JSON NOT NULL,
    `ticket` TEXT NOT NULL,
    `visa` TEXT NOT NULL,
    `scenic` TEXT NOT NULL,
    `performance` TEXT NOT NULL,
    `transport` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tour_groups_orderNo_key`(`orderNo`),
    UNIQUE INDEX `tour_groups_tourNo_key`(`tourNo`),
    INDEX `tour_groups_lineId_departureDate_idx`(`lineId`, `departureDate`),
    INDEX `tour_groups_stage_idx`(`stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tour_groups` ADD CONSTRAINT `tour_groups_lineId_fkey` FOREIGN KEY (`lineId`) REFERENCES `operation_lines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

