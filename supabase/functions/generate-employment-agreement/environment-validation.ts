export function validateAndCorrectEnvironmentVariables() {
  console.log('🔍 Validating and correcting environment variables...');
  
  const issues = [];
  const recommendations = [];
  let correctedVars = null;
  
  // Check Google Service Account Key
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  if (!serviceAccountKey) {
    issues.push('GOOGLE_SERVICE_ACCOUNT_KEY is not set');
    recommendations.push('Set GOOGLE_SERVICE_ACCOUNT_KEY in Supabase secrets');
    return { valid: false, issues, recommendations, correctedVars };
  }
  
  // Check Shared Drive ID
  const sharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
  if (!sharedDriveId) {
    issues.push('GOOGLE_SHARED_DRIVE_ID is not set');
    recommendations.push('Set GOOGLE_SHARED_DRIVE_ID in Supabase secrets');
    return { valid: false, issues, recommendations, correctedVars };
  }
  
  // Template Document ID - Employment Agreement specific or fallback
  let templateDocId = null;
  let templateSource = 'missing';
  
  // First check for employment-specific template
  const employmentTemplateId = Deno.env.get('DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID');
  if (employmentTemplateId) {
    templateDocId = employmentTemplateId;
    templateSource = 'employment-specific';
    console.log('📄 Using employment-specific template document');
  } else {
    // Fall back to generic template
    const genericTemplateId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
    if (genericTemplateId) {
      templateDocId = genericTemplateId;
      templateSource = 'generic-fallback';
      console.log('📄 Using generic template document as fallback');
      recommendations.push('Consider setting DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID for employment-specific template');
    }
  }
  
  if (!templateDocId) {
    issues.push('No template document ID available (DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID or DEFAULT_GOOGLE_DOC_ID)');
    recommendations.push('Set DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID in Supabase secrets');
    return { valid: false, issues, recommendations, correctedVars };
  }
  
  // Validate ID formats
  if (templateDocId === sharedDriveId) {
    issues.push('Template document ID cannot be the same as Shared Drive ID');
    recommendations.push('Verify DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID and GOOGLE_SHARED_DRIVE_ID are different');
    return { valid: false, issues, recommendations, correctedVars };
  }
  
  if (templateDocId.startsWith('0A')) {
    issues.push('Template document ID appears to be a Drive ID (starts with 0A), expected a Docs ID');
    recommendations.push('Verify DEFAULT_EMPLOYMENT_AGREEMENT_DOC_ID is a Google Docs document ID');
    return { valid: false, issues, recommendations, correctedVars };
  }
  
  if (!sharedDriveId.startsWith('0A')) {
    issues.push('Shared Drive ID should start with 0A');
    recommendations.push('Verify GOOGLE_SHARED_DRIVE_ID is a valid Shared Drive ID');
    return { valid: false, issues, recommendations, correctedVars };
  }
  
  correctedVars = {
    templateDocId,
    sharedDriveId,
    templateSource
  };
  
  console.log('✅ Environment validation passed');
  return { valid: true, issues, recommendations, correctedVars };
}

export function logEnvironmentIssues(validation) {
  if (validation.issues.length > 0) {
    console.log('\n⚠️ === ENVIRONMENT VALIDATION ISSUES ===');
    validation.issues.forEach(issue => console.log(`   ❌ ${issue}`));
  }
  
  if (validation.recommendations.length > 0) {
    console.log('\n💡 === ENVIRONMENT RECOMMENDATIONS ===');
    validation.recommendations.forEach(rec => console.log(`   💡 ${rec}`));
  }
  
  if (validation.correctedVars) {
    console.log('\n✅ === CORRECTED ENVIRONMENT VARIABLES ===');
    console.log(`   📄 Template Document ID: ${validation.correctedVars.templateDocId} (${validation.correctedVars.templateSource})`);
    console.log(`   📁 Shared Drive ID: ${validation.correctedVars.sharedDriveId}`);
  }
  
  console.log('\n================================================\n');
}