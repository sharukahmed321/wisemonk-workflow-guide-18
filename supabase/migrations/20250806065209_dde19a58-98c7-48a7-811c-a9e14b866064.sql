-- Add salary breakdown columns to employees table
ALTER TABLE public.employees 
ADD COLUMN annual_gross_salary NUMERIC,
ADD COLUMN annual_basic NUMERIC,
ADD COLUMN annual_hra NUMERIC,
ADD COLUMN annual_lta NUMERIC,
ADD COLUMN yfbp NUMERIC,
ADD COLUMN annual_special_allowance NUMERIC,
ADD COLUMN monthly_gross NUMERIC,
ADD COLUMN monthly_basic NUMERIC,
ADD COLUMN monthly_hra NUMERIC,
ADD COLUMN monthly_lta NUMERIC,
ADD COLUMN monthly_special_allowance NUMERIC,
ADD COLUMN mfbp NUMERIC;

-- Copy existing salary to annual_gross_salary
UPDATE public.employees 
SET annual_gross_salary = salary 
WHERE salary IS NOT NULL;

-- Create function to calculate salary breakdown
CREATE OR REPLACE FUNCTION public.calculate_salary_breakdown()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if annual_gross_salary is provided
  IF NEW.annual_gross_salary IS NOT NULL THEN
    -- Base calculation: 50% of gross goes to basic salary
    NEW.annual_basic := NEW.annual_gross_salary / 2;
    
    -- HRA is 50% of basic salary (25% of gross)
    NEW.annual_hra := NEW.annual_basic / 2;
    
    -- LTA is 20% of basic salary (10% of gross)
    NEW.annual_lta := NEW.annual_basic / 5;
    
    -- YFBP (Yearly Flexible Benefits) - threshold-based
    NEW.yfbp := CASE 
      WHEN NEW.annual_gross_salary <= 1440000 THEN 0 
      ELSE 169392 
    END;
    
    -- Special Allowance is the remainder after deducting all components
    NEW.annual_special_allowance := NEW.annual_gross_salary - NEW.annual_basic - NEW.annual_hra - NEW.annual_lta - NEW.yfbp - 21600;
    
    -- Monthly equivalents (divide by 12)
    NEW.monthly_gross := NEW.annual_gross_salary / 12;
    NEW.monthly_basic := NEW.annual_basic / 12;
    NEW.monthly_hra := NEW.annual_hra / 12;
    NEW.monthly_lta := NEW.annual_lta / 12;
    NEW.monthly_special_allowance := NEW.annual_special_allowance / 12;
    NEW.mfbp := NEW.yfbp / 12;
    
    -- Also update the legacy salary field for backward compatibility
    NEW.salary := NEW.annual_gross_salary;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic salary calculation
CREATE TRIGGER calculate_salary_breakdown_trigger
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_salary_breakdown();

-- Update existing records to populate the new breakdown fields
UPDATE public.employees 
SET annual_gross_salary = annual_gross_salary 
WHERE annual_gross_salary IS NOT NULL;