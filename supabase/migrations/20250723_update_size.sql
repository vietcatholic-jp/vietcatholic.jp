ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS '1';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS '2';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS '3';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS '4';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS '5';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'M-XS';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'M-S';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'M-M';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'M-L';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'M-XL';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'M-XXL';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'M-3XL';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'M-4XL';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'F-XS';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'F-S';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'F-M';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'F-L';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'F-XL';
ALTER TYPE shirt_size_type ADD VALUE IF NOT EXISTS 'F-XXL';


-- Add team_name column to event_roles table
alter table public.event_roles
  add column if not exists team_name text;
-- Add cancel_processed column to registrations table
ALTER TYPE registration_status ADD VALUE IF NOT EXISTS 'cancel_processed';

ALTER TYPE registration_status ADD VALUE IF NOT EXISTS 'temp_confirmed'; -- for those who want to pay later by cash
