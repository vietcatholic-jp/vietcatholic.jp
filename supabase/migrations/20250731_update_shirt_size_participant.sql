

ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS '3XL';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS '4XL';

UPDATE registrants
SET shirt_size = CASE
  WHEN shirt_size = 'M-XS' THEN 'M'
  WHEN shirt_size = 'M-S' THEN 'M'
  WHEN shirt_size = 'M-M' THEN 'L'
  WHEN shirt_size = 'M-L' THEN 'XL'
  WHEN shirt_size = 'M-XL' THEN 'XXL'
  WHEN shirt_size = 'M-XXL' THEN 'XXL'
  WHEN shirt_size = 'M-3XL' THEN '3XL'
  WHEN shirt_size = 'M-4XL' THEN '4XL'
  WHEN shirt_size = 'F-XS' THEN 'XS'
  WHEN shirt_size = 'F-S' THEN 'S'
  WHEN shirt_size = 'F-M' THEN 'M'
  WHEN shirt_size = 'F-L' THEN 'L'
  WHEN shirt_size = 'F-XL' THEN 'XL'
  WHEN shirt_size = 'F-XXL' THEN 'XXL'
  ELSE shirt_size
END
WHERE event_role_id IS NULL
  AND shirt_size IN (
    'M-XS', 'M-S', 'M-M', 'M-L', 'M-XL', 'M-XXL', 'M-3XL', 'M-4XL',
    'F-XS', 'F-S', 'F-M', 'F-L', 'F-XL', 'F-XXL'
);