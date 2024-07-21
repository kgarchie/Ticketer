-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_id_fkey" FOREIGN KEY ("id") REFERENCES "Ticket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
