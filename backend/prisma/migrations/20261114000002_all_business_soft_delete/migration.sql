-- AlterTable
ALTER TABLE `permissions` ADD COLUMN `delete` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `roles` ADD COLUMN `delete` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `delete` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `permissions_delete_idx` ON `permissions`(`delete`);

-- CreateIndex
CREATE INDEX `roles_delete_idx` ON `roles`(`delete`);

-- CreateIndex
CREATE INDEX `users_delete_idx` ON `users`(`delete`);

