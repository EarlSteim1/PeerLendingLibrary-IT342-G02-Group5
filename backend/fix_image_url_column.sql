-- SQL script to alter the image_url column to support larger base64 images
-- Run this script in your MySQL database

ALTER TABLE books MODIFY COLUMN image_url MEDIUMTEXT;


