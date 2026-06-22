ALTER TABLE book_ins ADD COLUMN charge_date DATE NULL AFTER date_received;
UPDATE book_ins SET charge_date = DATE_ADD(date_received, INTERVAL 30 DAY) WHERE charge_date IS NULL AND date_received IS NOT NULL;
