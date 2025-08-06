
-- Add last_date and agreement_date columns to the employees table
ALTER TABLE public.employees 
ADD COLUMN last_date DATE,
ADD COLUMN agreement_date DATE;

-- Add a comment to clarify the purpose of these columns
COMMENT ON COLUMN public.employees.last_date IS 'Employment end date, typically set to agreement_date + 5 days';
COMMENT ON COLUMN public.employees.agreement_date IS 'Date when the employment agreement was generated';
