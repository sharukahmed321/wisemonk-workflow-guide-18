-- Create trigger to automatically calculate salary breakdown when employee is inserted or updated
CREATE TRIGGER trigger_calculate_salary_breakdown
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_salary_breakdown();