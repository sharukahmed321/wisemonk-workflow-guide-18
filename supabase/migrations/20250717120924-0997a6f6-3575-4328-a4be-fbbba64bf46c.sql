-- Create the employees table with all fields from the Employee interface
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(user_id), -- Optional link to user profiles
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  job_title TEXT NOT NULL,
  department TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  salary NUMERIC(10,2),
  start_date DATE NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Onboarding', 'Exit')),
  birthday DATE, -- Store MM-DD format for birthday matching
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_employees_department ON public.employees(department);
CREATE INDEX idx_employees_status ON public.employees(status);
CREATE INDEX idx_employees_start_date ON public.employees(start_date);
CREATE INDEX idx_employees_birthday ON public.employees(birthday);
CREATE INDEX idx_employees_email ON public.employees(email);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees table
-- Managers and admins can view all employees
CREATE POLICY "Managers and admins can view all employees"
ON public.employees
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Employees can view their own record if linked to a user
CREATE POLICY "Employees can view their own record"
ON public.employees
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins and managers can insert new employees
CREATE POLICY "Admins and managers can insert employees"
ON public.employees
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Only admins and managers can update employees
CREATE POLICY "Admins and managers can update employees"
ON public.employees
FOR UPDATE
USING (
  has_role(auth.uid(), 'manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Only admins can delete employees
CREATE POLICY "Only admins can delete employees"
ON public.employees
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'superadmin'::app_role)
);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data to replace mock data
INSERT INTO public.employees (employee_id, first_name, last_name, email, phone, job_title, department, employment_type, salary, start_date, status, birthday, avatar_url) VALUES
('EMP001', 'Sarah', 'Johnson', 'sarah.johnson@company.com', '+1 555 0123', 'Senior Frontend Developer', 'Engineering', 'Full-time', 95000, '2022-03-15', 'Active', '1990-07-16', 'https://images.unsplash.com/photo-1494790108755-2616c4b26e86?w=100&h=100&fit=crop&crop=face'),
('EMP002', 'Rajesh', 'Kumar', 'rajesh.kumar@company.com', '+1 555 0124', 'Product Manager', 'Engineering', 'Full-time', 105000, '2021-11-08', 'Active', '1985-11-08', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'),
('EMP003', 'Emily', 'Chen', 'emily.chen@company.com', '+1 555 0125', 'Marketing Specialist', 'Marketing', 'Full-time', 65000, '2023-01-20', 'Onboarding', '1992-01-20', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'),
('EMP004', 'Michael', 'Rodriguez', 'michael.rodriguez@company.com', '+1 555 0126', 'UX Designer', 'Design', 'Full-time', 78000, '2022-08-12', 'Active', '1988-08-12', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'),
('EMP005', 'Jessica', 'Park', 'jessica.park@company.com', '+1 555 0127', 'Sales Representative', 'Sales', 'Part-time', 45000, '2023-06-01', 'Exit', '1991-06-01', 'https://images.unsplash.com/photo-1494790108755-2616c4b26e86?w=100&h=100&fit=crop&crop=face'),
('EMP006', 'David', 'Thompson', 'david.thompson@company.com', '+1 555 0128', 'Backend Developer', 'Engineering', 'Full-time', 88000, '2022-12-05', 'Active', '1987-12-05', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face'),
('EMP007', 'Amanda', 'Wilson', 'amanda.wilson@company.com', '+1 555 0129', 'HR Coordinator', 'HR', 'Full-time', 58000, '2023-09-10', 'Onboarding', '1989-09-10', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face');