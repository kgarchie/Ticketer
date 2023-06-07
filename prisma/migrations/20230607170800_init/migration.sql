/*
  Warnings:

  - A unique constraint covering the columns `[attachmentId]` on the table `FilePurge` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `FilePurge_attachmentId_key` ON `FilePurge`(`attachmentId`);
