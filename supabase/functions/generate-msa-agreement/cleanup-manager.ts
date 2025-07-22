
import { getGoogleAccessToken } from './google-auth.ts';

export const cleanupOrphanedDocuments = async (): Promise<void> => {
  try {
    console.log('🗑️ Starting cleanup of orphaned temporary documents...');
    const accessToken = await getGoogleAccessToken();
    
    // Search for temporary MSA documents older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const query = `name contains 'MSA_' and createdTime < '${oneDayAgo}' and trashed = false`;
    
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime)`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      console.warn('⚠️ Could not search for orphaned documents:', response.statusText);
      return;
    }

    const data = await response.json();
    const orphanedFiles = data.files || [];
    
    console.log(`🔍 Found ${orphanedFiles.length} potential orphaned documents`);
    
    if (orphanedFiles.length === 0) {
      console.log('✅ No orphaned documents found');
      return;
    }

    let deletedCount = 0;
    for (const file of orphanedFiles) {
      try {
        await deleteDocumentById(file.id);
        console.log(`🗑️ Deleted orphaned document: ${file.name} (${file.id})`);
        deletedCount++;
      } catch (error) {
        console.warn(`⚠️ Failed to delete orphaned document ${file.name}:`, error.message);
      }
    }
    
    console.log(`✅ Cleanup completed: ${deletedCount}/${orphanedFiles.length} documents deleted`);
    
  } catch (error) {
    console.warn('⚠️ Cleanup process failed:', error.message);
  }
};

export const deleteDocumentById = async (documentId: string): Promise<void> => {
  const accessToken = await getGoogleAccessToken();
  
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete document: ${response.statusText}`);
  }
};

export const createTempDocumentName = (userData: any): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);
  const safeName = `${userData.first_name || 'User'}_${userData.last_name || 'Document'}`.replace(/[^a-zA-Z0-9]/g, '_');
  
  return `MSA_${safeName}_${timestamp}_${randomId}`;
};
