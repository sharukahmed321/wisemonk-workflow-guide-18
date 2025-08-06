
import { formatCurrency, formatDate, formatAddress } from './formatters.ts';
import { htmlToPlainText } from './html-utils.ts';

// Enhanced function to create employment placeholders with comprehensive employee data
export const createEmploymentPlaceholders = (employmentData) => {
  const fullAddress = formatAddress(
    employmentData.business_address, 
    employmentData.business_city, 
    employmentData.business_state, 
    employmentData.business_postal_code
  );
  
  return {
    // Client and Company Information
    '{{Client_name_address}}': `${employmentData.legal_name || employmentData.name || 'N/A'}, ${fullAddress}`,
    '{{Agreement_date}}': employmentData.agreement_date ? formatDate(employmentData.agreement_date) : formatDate(new Date().toISOString()),
    '{{Client}}': employmentData.legal_name || employmentData.name || 'N/A',
    '{{Company}}': employmentData.legal_name || employmentData.name || 'N/A',
    '{{client Name}}': employmentData.legal_name || employmentData.name || 'Company',
    
    // Employee Basic Information
    '{{Name}}': `${employmentData.first_name || ''} ${employmentData.last_name || ''}`.trim() || 'N/A',
    '{{Employee_Name}}': `${employmentData.first_name || ''} ${employmentData.last_name || ''}`.trim() || 'N/A',
    '{{First Name}}': employmentData.first_name || 'N/A',
    '{{last Name}}': employmentData.last_name || 'N/A',
    '{{Full Name}}': `${employmentData.first_name || ''} ${employmentData.last_name || ''}`.trim() || 'N/A',
    '{{email}}': employmentData.email || 'N/A',
    '{{Id}}': employmentData.id || employmentData.employee_id || 'N/A',
    
    // Job Information
    '{{Designation}}': employmentData.job_title || 'N/A',
    '{{Position}}': employmentData.job_title || 'N/A',
    '{{Job role}}': employmentData.job_title || 'N/A',
    '{{Role details}}': employmentData.job_description ? htmlToPlainText(employmentData.job_description) : 'N/A',
    '{{Department}}': employmentData.department || 'N/A',
    '{{Manager}}': employmentData.manager_details || 'N/A',
    
    // Employment Details
    '{{Employment_Type}}': employmentData.employment_type || 'Full-time',
    '{{Start_Date}}': employmentData.start_date ? formatDate(employmentData.start_date) : (employmentData.joining_date ? formatDate(employmentData.joining_date) : formatDate(new Date().toISOString())),
    '{{Joining Date}}': employmentData.joining_date ? formatDate(employmentData.joining_date) : (employmentData.start_date ? formatDate(employmentData.start_date) : formatDate(new Date().toISOString())),
    '{{Last Date}}': employmentData.last_date ? formatDate(employmentData.last_date) : 'N/A',
    '{{Work_Location}}': employmentData.work_location || fullAddress,
    
    // Salary Information - Annual
    '{{Annual_gross}}': employmentData.annual_gross_salary ? formatCurrency(employmentData.annual_gross_salary) : 'N/A',
    '{{Annual_basic}}': employmentData.annual_basic ? formatCurrency(employmentData.annual_basic) : 'N/A',
    '{{Annual_hra}}': employmentData.annual_hra ? formatCurrency(employmentData.annual_hra) : 'N/A',
    '{{Annual_special_allowance}}': employmentData.annual_special_allowance ? formatCurrency(employmentData.annual_special_allowance) : 'N/A',
    '{{YFBP}}': employmentData.yfbp ? formatCurrency(employmentData.yfbp) : 'N/A',
    '{{Annual_LTA}}': employmentData.annual_lta ? formatCurrency(employmentData.annual_lta) : 'N/A',
    
    // Salary Information - Monthly
    '{{Monthly_gross}}': employmentData.monthly_gross ? formatCurrency(employmentData.monthly_gross) : 'N/A',
    '{{Monthly_basic}}': employmentData.monthly_basic ? formatCurrency(employmentData.monthly_basic) : 'N/A',
    '{{Monthly_hra}}': employmentData.monthly_hra ? formatCurrency(employmentData.monthly_hra) : 'N/A',
    '{{Monthly_special_allowance}}': employmentData.monthly_special_allowance ? formatCurrency(employmentData.monthly_special_allowance) : 'N/A',
    '{{Monthly_LTA}}': employmentData.monthly_lta ? formatCurrency(employmentData.monthly_lta) : 'N/A',
    '{{MFBP}}': employmentData.mfbp ? formatCurrency(employmentData.mfbp) : 'N/A',
    
    // Legacy salary field for backward compatibility
    '{{Salary}}': employmentData.annual_gross_salary ? formatCurrency(employmentData.annual_gross_salary) : 'N/A',
    '{{Hourly_Rate}}': employmentData.hourly_rate ? formatCurrency(employmentData.hourly_rate) : 'N/A',
    '{{bonus}}': employmentData.bonus ? formatCurrency(employmentData.bonus) : formatCurrency(0),
    
    // Personal Details
    '{{Fathers name}}': employmentData.father_name || 'N/A',
    '{{Age}}': employmentData.age ? employmentData.age.toString() : 'N/A',
    '{{relation}}': employmentData.gender || 'N/A', // Maps to gender field
    '{{Aadhar}}': employmentData.aadhaar_number || 'N/A',
    
    // Address Information
    '{{Address Line 1}}': employmentData.address_line_1 || 'N/A',
    '{{Address Line 2}}': employmentData.address_line_2 || 'N/A',
    '{{Address City}}': employmentData.city || 'N/A',
    '{{Address State}}': employmentData.state || 'N/A',
    '{{Pincode}}': employmentData.pincode || 'N/A',
    
    // Benefits and Other Details
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
