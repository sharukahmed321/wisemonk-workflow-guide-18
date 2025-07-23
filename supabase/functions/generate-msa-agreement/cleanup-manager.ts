
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  failedCount: number;
  errors: string[];
  orphanedDocuments: string[];
}

export async function cleanupOrphanedDocuments(olderThanHours: number = 24): Promise<CleanupResult> {
  console.log(`🧹 Starting cleanup of orphaned documents older than ${olderThanHours} hours...`);
  
  const result: CleanupResult = {
    success: true,
    deletedCount: 0,
    failedCount: 0,
    errors: [],
    orphanedDocuments: []
  };

  try {
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    // Find orphaned documents
    const orphanedDocs = await findOrphanedDocuments(accessToken, sharedDriveId, olderThanHours);
    result.orphanedDocuments = orphanedDocs.map(doc => doc.id);
    
    console.log(`🔍 Found ${orphanedDocs.length} orphaned documents to cleanup`);

    // Delete orphaned documents
    for (const doc of orphanedDocs) {
      try {
        await deleteDocument(accessToken, doc.id);
        result.deletedCount++;
        console.log(`🗑️ Deleted orphaned document: ${doc.name} (${doc.id})`);
      } catch (error) {
        result.failedCount++;
        result.errors.push(`Failed to delete ${doc.name}: ${error.message}`);
        console.error(`❌ Failed to delete ${doc.name}:`, error.message);
      }
    }

    if (result.failedCount > 0) {
      result.success = false;
    }

    console.log(`🧹 Cleanup completed: ${result.deletedCount} deleted, ${result.failedCount} failed`);
    return result;

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    result.success = false;
    result.errors.push(error.message);
    return result;
  }
}

async function findOrphanedDocuments(
  accessToken: string,
  sharedDriveId: string,
  olderThanHours: number
): Promise<any[]> {
  console.log('🔍 Finding orphaned documents...');
  
  const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const orphanedDocs = [];

  try {
    // Search for MSA documents in the shared drive
    const searchQuery = `name contains "MSA_" and parents in "${sharedDriveId}"`;
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&fields=files(id,name,createdTime,modifiedTime)`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`📋 Found ${data.files?.length || 0} MSA documents`);

    // Filter documents that are older than cutoff time
    for (const file of data.files || []) {
      const createdTime = new Date(file.createdTime);
      const modifiedTime = new Date(file.modifiedTime);
      
      // Consider document orphaned if it's old and follows temporary naming pattern
      if (createdTime < cutoffTime && modifiedTime < cutoffTime) {
        const isTemporary = file.name.includes('MSA_') && 
                           (file.name.includes('_Shared') || 
                            file.name.includes('_Test') || 
                            file.name.includes('_Diagnostic') ||
                            file.name.includes('_Enhanced') ||
                            file.name.includes('_Optimized') ||
                            file.name.includes('_Primary') ||
                            file.name.includes('_Direct') ||
                            file.name.includes('_MyDrive') ||
                            file.name.includes('_Workflow') ||
                            file.name.includes('_Fallback'));
        
        if (isTemporary) {
          orphanedDocs.push(file);
          console.log(`🔍 Found orphaned document: ${file.name} (created: ${createdTime.toISOString()})`);
        }
      }
    }

    return orphanedDocs;

  } catch (error) {
    console.error('❌ Failed to find orphaned documents:', error);
    throw error;
  }
}

async function deleteDocument(accessToken: string, documentId: string): Promise<void> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text();
    throw new Error(`Delete failed: ${response.status} - ${errorText}`);
  }
}

export async function cleanupTestDocuments(): Promise<CleanupResult> {
  console.log('🧹 Starting cleanup of test documents...');
  
  const result: CleanupResult = {
    success: true,
    deletedCount: 0,
    failedCount: 0,
    errors: [],
    orphanedDocuments: []
  };

  try {
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    // Find test documents
    const testDocs = await findTestDocuments(accessToken, sharedDriveId);
    result.orphanedDocuments = testDocs.map(doc => doc.id);
    
    console.log(`🔍 Found ${testDocs.length} test documents to cleanup`);

    // Delete test documents
    for (const doc of testDocs) {
      try {
        await deleteDocument(accessToken, doc.id);
        result.deletedCount++;
        console.log(`🗑️ Deleted test document: ${doc.name} (${doc.id})`);
      } catch (error) {
        result.failedCount++;
        result.errors.push(`Failed to delete ${doc.name}: ${error.message}`);
        console.error(`❌ Failed to delete ${doc.name}:`, error.message);
      }
    }

    if (result.failedCount > 0) {
      result.success = false;
    }

    console.log(`🧹 Test cleanup completed: ${result.deletedCount} deleted, ${result.failedCount} failed`);
    return result;

  } catch (error) {
    console.error('❌ Test cleanup failed:', error);
    result.success = false;
    result.errors.push(error.message);
    return result;
  }
}

async function findTestDocuments(accessToken: string, sharedDriveId: string): Promise<any[]> {
  console.log('🔍 Finding test documents...');
  
  const testDocs = [];

  try {
    // Search for test documents
    const testPatterns = [
      'MSA_Test_',
      'MSA_Diagnostic_',
      'MSA_Enhanced_',
      'MSA_Optimized_',
      'MSA_Primary_',
      'MSA_Direct_',
      'MSA_MyDrive_',
      'MSA_Workflow_',
      'MSA_Fallback_',
      'MSA_Benchmark_'
    ];

    for (const pattern of testPatterns) {
      const searchQuery = `name contains "${pattern}" and parents in "${sharedDriveId}"`;
      const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&fields=files(id,name,createdTime)`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        testDocs.push(...(data.files || []));
      }
    }

    // Remove duplicates
    const uniqueDocs = testDocs.filter((doc, index, self) => 
      index === self.findIndex(d => d.id === doc.id)
    );

    return uniqueDocs;

  } catch (error) {
    console.error('❌ Failed to find test documents:', error);
    throw error;
  }
}

export async function scheduleCleanup(intervalHours: number = 24): Promise<void> {
  console.log(`🕐 Scheduling cleanup every ${intervalHours} hours...`);
  
  const runCleanup = async () => {
    try {
      console.log('🧹 Running scheduled cleanup...');
      
      // Clean up orphaned documents older than 2 hours
      const orphanedResult = await cleanupOrphanedDocuments(2);
      console.log(`🧹 Orphaned cleanup: ${orphanedResult.deletedCount} deleted, ${orphanedResult.failedCount} failed`);
      
      // Clean up test documents
      const testResult = await cleanupTestDocuments();
      console.log(`🧹 Test cleanup: ${testResult.deletedCount} deleted, ${testResult.failedCount} failed`);
      
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  };

  // Run cleanup immediately
  await runCleanup();
  
  // Schedule recurring cleanup
  setInterval(runCleanup, intervalHours * 60 * 60 * 1000);
}

export async function getCleanupStatistics(): Promise<any> {
  try {
    console.log('📊 Getting cleanup statistics...');
    
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    // Get all MSA documents
    const searchQuery = `name contains "MSA_" and parents in "${sharedDriveId}"`;
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&fields=files(id,name,createdTime,modifiedTime,size)`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Statistics query failed: ${response.status}`);
    }

    const data = await response.json();
    const files = data.files || [];
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const statistics = {
      total: files.length,
      lastHour: files.filter(f => new Date(f.createdTime) > oneHourAgo).length,
      lastDay: files.filter(f => new Date(f.createdTime) > oneDayAgo).length,
      lastWeek: files.filter(f => new Date(f.createdTime) > oneWeekAgo).length,
      orphaned: files.filter(f => {
        const createdTime = new Date(f.createdTime);
        const modifiedTime = new Date(f.modifiedTime);
        return createdTime < oneDayAgo && modifiedTime < oneDayAgo;
      }).length,
      testDocuments: files.filter(f => 
        f.name.includes('Test_') || 
        f.name.includes('Diagnostic_') || 
        f.name.includes('Enhanced_') ||
        f.name.includes('Optimized_') ||
        f.name.includes('Fallback_')
      ).length,
      totalSize: files.reduce((sum, f) => sum + parseInt(f.size || '0'), 0)
    };

    console.log('📊 Cleanup statistics:', statistics);
    return statistics;

  } catch (error) {
    console.error('❌ Failed to get cleanup statistics:', error);
    return { error: error.message };
  }
}
