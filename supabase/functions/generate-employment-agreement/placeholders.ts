import { formatCurrency, formatDate, formatAddress } from './formatters.ts';
import { htmlToPlainText } from './html-utils.ts';

// New function to match MSA structure - use this in pdf-generator.ts
export const createEmploymentPlaceholders = (employmentData) => {
  const fullAddress = formatAddress(
    employmentData.business_address, 
    employmentData.business_city, 
    employmentData.business_state, 
    employmentData.business_postal_code
  );
  
  return {
    '{{Client_name_address}}': `${employmentData.legal_name || employmentData.name || 'N/A'}, ${fullAddress}`,
    '{{Agreement_date}}': employmentData.currentDate ? formatDate(employmentData.currentDate) : formatDate(new Date().toISOString()),
    '{{Client}}': employmentData.legal_name || employmentData.name || 'N/A',
    '{{Name}}': `${employmentData.first_name || ''} ${employmentData.last_name || ''}`.trim() || 'N/A',
    '{{Designation}}': employmentData.job_title || 'N/A',
    
    // Additional employment-specific fields
    '{{Company}}': employmentData.legal_name || employmentData.name || 'N/A',
    '{{Employee_Name}}': `${employmentData.first_name || ''} ${employmentData.last_name || ''}`.trim() || 'N/A',
    '{{Position}}': employmentData.job_title || 'N/A',
    '{{Start_Date}}': employmentData.start_date ? formatDate(employmentData.start_date) : formatDate(new Date().toISOString()),
    '{{Employment_Type}}': employmentData.employment_type || 'Full-time',
    '{{Department}}': employmentData.department || 'N/A',
    '{{Supervisor}}': employmentData.supervisor || 'N/A',
    '{{Work_Location}}': employmentData.work_location || fullAddress,
    
    // Salary information (if provided)
    '{{Salary}}': employmentData.salary ? formatCurrency(employmentData.salary) : 'N/A',
    '{{Hourly_Rate}}': employmentData.hourly_rate ? formatCurrency(employmentData.hourly_rate) : 'N/A',
    
    // Benefits and other details
    '{{Benefits}}': employmentData.benefits || 'As per company policy',
    '{{Vacation_Days}}': employmentData.vacation_days || 'As per company policy',
    '{{Probation_Period}}': employmentData.probation_period || '90 days'
  };
};

// Existing function for backward compatibility - keep this for existing employment workflows
export const createPlaceholders = (employee) => {
  return {
    '{{client Name}}': employee.client_name || 'Company',
    '{{Manager}}': employee.manager_details || '',
    '{{First Name}}': employee.first_name,
    '{{last Name}}': employee.last_name,
    '{{Full Name}}': `${employee.first_name} ${employee.last_name}`,
    '{{email}}': employee.email,
    '{{Job role}}': employee.job_title,
    '{{Annual_gross}}': formatCurrency(employee.annual_gross_salary),
    '{{Annual_basic}}': formatCurrency(employee.annual_basic),
    '{{Annual_hra}}': formatCurrency(employee.annual_hra),
    '{{Annual_special_allowance}}': formatCurrency(employee.annual_special_allowance),
    '{{YFBP}}': formatCurrency(employee.yfbp),
    '{{Annual_LTA}}': formatCurrency(employee.annual_lta),
    '{{Monthly_gross}}': formatCurrency(employee.monthly_gross),
    '{{Monthly_basic}}': formatCurrency(employee.monthly_basic),
    '{{Monthly_hra}}': formatCurrency(employee.monthly_hra),
    '{{Monthly_special_allowance}}': formatCurrency(employee.monthly_special_allowance),
    '{{Monthly_LTA}}': formatCurrency(employee.monthly_lta),
    '{{MFBP}}': formatCurrency(employee.mfbp),
    '{{Joining Date}}': formatDate(employee.joining_date),
    '{{Agreement Date}}': formatDate(new Date().toISOString()),
    '{{Id}}': employee.id,
    '{{Role details}}': employee.job_description ? htmlToPlainText(employee.job_description) : '',
    '{{Last Date}}': employee.last_date ? formatDate(employee.last_date) : '',
    '{{Address State}}': employee.state || '',
    '{{Pincode}}': employee.pincode || '',
    '{{Address City}}': employee.city || '',
    '{{Address Line 2}}': employee.address_line2 || '',
    '{{Address Line 1}}': employee.address_line1 || '',
    '{{relation}}': employee.gender || '',
    '{{Fathers name}}': employee.fathers_name || '',
    '{{Age}}': employee.age ? employee.age.toString() : '',
    '{{Aadhar}}': employee.aadhar || '',
    '{{bonus}}': employee.bonus ? formatCurrency(employee.bonus) : formatCurrency(0)
  };
};

export const replacePlaceholders = (template, employee) => {
  const placeholders = createPlaceholders(employee);
  let processedTemplate = template;
  
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    processedTemplate = processedTemplate.replace(
      new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), 
      value
    );
  });
  
  // Clean up any remaining empty placeholder patterns
  processedTemplate = processedTemplate.replace(/\{\{[^}]+\}\}/g, '');
  
  // Clean up excessive empty lines but preserve intentional spacing
  processedTemplate = processedTemplate.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Clean up trailing whitespace from lines
  processedTemplate = processedTemplate.replace(/[ \t]+$/gm, '');
  
  return processedTemplate;
};
