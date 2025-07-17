-- First, update the app_role enum to include the new roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'superadmin';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'client';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'contractor';