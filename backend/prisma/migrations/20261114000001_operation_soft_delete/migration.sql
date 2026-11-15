-- AlterTable
ALTER TABLE `operation_lines` ADD COLUMN `delete` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tour_groups` ADD COLUMN `delete` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `operation_lines_delete_idx` ON `operation_lines`(`delete`);

-- CreateIndex
CREATE INDEX `tour_groups_delete_idx` ON `tour_groups`(`delete`);

