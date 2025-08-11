-- Add individual payslip URL columns to employees table
ALTER TABLE public.employees 
ADD COLUMN payslip_1_url text,
ADD COLUMN payslip_2_url text, 
ADD COLUMN payslip_3_url text;