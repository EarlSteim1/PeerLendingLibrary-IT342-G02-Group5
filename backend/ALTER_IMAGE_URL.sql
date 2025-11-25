-- Run this SQL command in your MySQL database to fix the image_url column
-- This will allow storing larger base64 images

ALTER TABLE books MODIFY COLUMN image_url MEDIUMTEXT;


