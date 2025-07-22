
import { getGoogleAccessToken } from './google-auth.ts';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
}

export interface ComprehensiveDiagnostic {
  sharedDriveAccess: DiagnosticResult;
  templateDocumentAccess: DiagnosticResult;
  serviceAccountInfo: DiagnosticResult;
  overallStatus: 'ready' | 'configuration_error' | 'access_error';
  recommendations: string[];
}

export const runComprehensiveDiagnostics = async (): Promise<ComprehensiveDiagnostic> => {
  console.log('🔍 Running comprehensive Shared Drive diagnostics...');
  
  const results: ComprehensiveDiagnostic = {
    sharedDriveAccess: { success: false, message: 'Not tested' },
    templateDocumentAccess: { success: false, message: 'Not tested' },
    serviceAccountInfo: { success: false, message: 'Not tested' },
    overallStatus: 'configuration_error',
    recommendations: []
  };

  try {
    const accessToken = await getGoogleAccessToken();
    
    // Test 1: Service Account Info
    results.serviceAccountInfo = await testServiceAccountInfo(accessToken);
    
    // Test 2: Shared Drive Access
    const sharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');
    if (sharedDriveId) {
      results.sharedDriveAccess = await testSharedDriveAccess(accessToken, sharedDriveId);
    } else {
      results.sharedDriveAccess = {
        success: false,
        message: 'GOOGLE_SHARED_DRIVE_ID environment variable not configured'
      };
    }
    
    // Test 3: Template Document Access
    const templateDocId = Deno.env.get('DEFAULT_GOOGLE_DOC_ID');
    if (templateDocId) {
      results.templateDocumentAccess = await testTemplateDocumentAccess(accessToken, templateDocId, sharedDriveId);
    } else {
      results.templateDocumentAccess = {
        success: false,
        message: 'DEFAULT_GOOGLE_DOC_ID environment variable not configured'
      };
    }
    
    // Determine overall status and recommendations
    const allTestsPassed = results.serviceAccountInfo.success && 
                          results.sharedDriveAccess.success && 
                          results.templateDocumentAccess.success;
    
    if (allTestsPassed) {
      results.overallStatus = 'ready';
      results.recommendations.push('✅ All diagnostics passed! Shared Drive workflow should work correctly.');
    } else {
      results.overallStatus = 'access_error';
      
      if (!results.serviceAccountInfo.success) {
        results.recommendations.push('❌ Service account configuration issue detected. Check GOOGLE_SERVICE_ACCOUNT_KEY.');
      }
      
      if (!results.sharedDriveAccess.success) {
        results.recommendations.push('❌ Shared Drive access failed. Verify GOOGLE_SHARED_DRIVE_ID and service account permissions.');
      }
      
      if (!results.templateDocumentAccess.success) {
        results.recommendations.push('❌ Template document access failed. Verify DEFAULT_GOOGLE_DOC_ID and document permissions.');
      }
    }
    
  } catch (error) {
    console.error('💥 Diagnostic process failed:', error);
    results.recommendations.push(`💥 Diagnostic process failed: ${error.message}`);
  }
  
  return results;
};

async function testServiceAccountInfo(accessToken: string): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Testing service account info...');
    
    const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      return {
        success: false,
        message: `Service account token validation failed: ${response.status}`,
        details: await response.text()
      };
    }
    
    const tokenInfo = await response.json();
    console.log('✅ Service account email:', tokenInfo.email);
    
    return {
      success: true,
      message: `Service account authenticated as: ${tokenInfo.email}`,
      details: tokenInfo
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Service account test failed: ${error.message}`
    };
  }
}

async function testSharedDriveAccess(accessToken: string, sharedDriveId: string): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Testing Shared Drive access...');
    console.log('📁 Shared Drive ID:', sharedDriveId);
    
    // Test 1: Can we get drive info?
    const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/drives/${sharedDriveId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!driveResponse.ok) {
      const errorText = await driveResponse.text();
      console.error('❌ Shared Drive info failed:', errorText);
      
      if (driveResponse.status === 404) {
        return {
          success: false,
          message: `Shared Drive not found. ID '${sharedDriveId}' may be incorrect or inaccessible.`,
          details: { status: 404, response: errorText }
        };
      }
      
      return {
        success: false,
        message: `Shared Drive access failed: ${driveResponse.status}`,
        details: { status: driveResponse.status, response: errorText }
      };
    }
    
    const driveInfo = await driveResponse.json();
    console.log('✅ Shared Drive found:', driveInfo.name);
    
    // Test 2: Can we list files in the drive?
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&pageSize=10`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );
    
    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.warn('⚠️ Cannot list files in Shared Drive:', errorText);
      
      return {
        success: false,
        message: `Can access Shared Drive '${driveInfo.name}' but cannot list files. Check service account permissions.`,
        details: { driveInfo, listError: errorText }
      };
    }
    
    const listData = await listResponse.json();
    console.log(`✅ Can list files in Shared Drive (${listData.files?.length || 0} files found)`);
    
    // Test 3: Can we create a test document?
    const testCreateResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `diagnostic-test-${Date.now()}`,
        parents: [sharedDriveId],
        mimeType: 'application/vnd.google-apps.document',
        supportsAllDrives: true
      })
    });
    
    if (testCreateResponse.ok) {
      const testDoc = await testCreateResponse.json();
      console.log('✅ Can create documents in Shared Drive');
      
      // Clean up test document
      await fetch(`https://www.googleapis.com/drive/v3/files/${testDoc.id}?supportsAllDrives=true`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      console.log('✅ Test document cleaned up');
      
      return {
        success: true,
        message: `Full access to Shared Drive '${driveInfo.name}' confirmed. Can read, list, create, and delete documents.`,
        details: { driveInfo, fileCount: listData.files?.length || 0 }
      };
    } else {
      const createErrorText = await testCreateResponse.text();
      console.error('❌ Cannot create documents in Shared Drive:', createErrorText);
      
      return {
        success: false,
        message: `Can access Shared Drive '${driveInfo.name}' but cannot create documents. Service account needs Editor permissions.`,
        details: { driveInfo, createError: createErrorText }
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: `Shared Drive test failed: ${error.message}`
    };
  }
}

async function testTemplateDocumentAccess(accessToken: string, templateDocId: string, sharedDriveId?: string): Promise<DiagnosticResult> {
  try {
    console.log('🔍 Testing template document access...');
    console.log('📄 Template document ID:', templateDocId);
    
    // Test 1: Can we get document metadata?
    const metadataResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}?supportsAllDrives=true`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error('❌ Template document metadata failed:', errorText);
      
      if (metadataResponse.status === 404) {
        return {
          success: false,
          message: `Template document not found. ID '${templateDocId}' may be incorrect or inaccessible.`,
          details: { status: 404, response: errorText }
        };
      }
      
      return {
        success: false,
        message: `Template document access failed: ${metadataResponse.status}`,
        details: { status: metadataResponse.status, response: errorText }
      };
    }
    
    const docMetadata = await metadataResponse.json();
    console.log('✅ Template document found:', docMetadata.name);
    
    // Test 2: Can we read the document content?
    const contentResponse = await fetch(`https://docs.googleapis.com/v1/documents/${templateDocId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error('❌ Template document content access failed:', errorText);
      
      return {
        success: false,
        message: `Can see template document '${docMetadata.name}' but cannot read content. Service account needs Viewer permissions.`,
        details: { docMetadata, contentError: errorText }
      };
    }
    
    const docContent = await contentResponse.json();
    console.log('✅ Can read template document content');
    
    // Test 3: Can we copy the document?
    const testCopyName = `diagnostic-copy-test-${Date.now()}`;
    const copyBody: any = {
      name: testCopyName,
      supportsAllDrives: true
    };
    
    // If we have a shared drive, test copying to it
    if (sharedDriveId) {
      copyBody.parents = [sharedDriveId];
      copyBody.driveId = sharedDriveId;
    }
    
    const copyResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(copyBody)
    });
    
    if (copyResponse.ok) {
      const copyDoc = await copyResponse.json();
      console.log('✅ Can copy template document');
      
      // Clean up test copy
      await fetch(`https://www.googleapis.com/drive/v3/files/${copyDoc.id}?supportsAllDrives=true`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      console.log('✅ Test copy cleaned up');
      
      const destination = sharedDriveId ? 'Shared Drive' : 'My Drive';
      return {
        success: true,
        message: `Full access to template document '${docMetadata.name}' confirmed. Can read and copy to ${destination}.`,
        details: { docMetadata, hasContent: !!docContent.body }
      };
    } else {
      const copyErrorText = await copyResponse.text();
      console.error('❌ Cannot copy template document:', copyErrorText);
      
      return {
        success: false,
        message: `Can access template document '${docMetadata.name}' but cannot copy it. Check permissions or try a different copy destination.`,
        details: { docMetadata, copyError: copyErrorText }
      };
    }
    
  } catch (error) {
    return {
      success: false,
      message: `Template document test failed: ${error.message}`
    };
  }
}

export const logDiagnosticResults = (results: ComprehensiveDiagnostic): void => {
  console.log('\n🔍 === COMPREHENSIVE DIAGNOSTIC RESULTS ===');
  console.log(`📊 Overall Status: ${results.overallStatus.toUpperCase()}`);
  
  console.log('\n🔧 Service Account:');
  console.log(`   ${results.serviceAccountInfo.success ? '✅' : '❌'} ${results.serviceAccountInfo.message}`);
  
  console.log('\n📁 Shared Drive Access:');
  console.log(`   ${results.sharedDriveAccess.success ? '✅' : '❌'} ${results.sharedDriveAccess.message}`);
  
  console.log('\n📄 Template Document Access:');
  console.log(`   ${results.templateDocumentAccess.success ? '✅' : '❌'} ${results.templateDocumentAccess.message}`);
  
  console.log('\n💡 Recommendations:');
  results.recommendations.forEach(rec => console.log(`   ${rec}`));
  
  console.log('\n===========================================\n');
};
