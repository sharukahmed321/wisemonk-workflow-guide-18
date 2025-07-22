
import { getGoogleAccessToken } from './google-auth.ts';
import { getSharedDriveInfo, listSharedDrives } from './google-docs-shared-drive.ts';

export interface SharedDriveStorageInfo {
  driveId: string;
  driveName: string;
  quotaUsed?: number;
  quotaLimit?: number;
  usagePercentage?: number;
  fileCount?: number;
  canCreateFiles: boolean;
  capabilities?: any;
}

export const checkSharedDriveStorage = async (): Promise<SharedDriveStorageInfo> => {
  try {
    console.log('📊 Checking Shared Drive storage and capabilities...');
    const accessToken = await getGoogleAccessToken();
    const sharedDriveId = Deno.env.get('GOOGLE_SHARED_DRIVE_ID');

    if (!sharedDriveId) {
      throw new Error('GOOGLE_SHARED_DRIVE_ID environment variable not configured');
    }
    
    // Get drive information
    const driveInfo = await getSharedDriveInfo(accessToken, sharedDriveId);
    
    // Get file count in the drive
    const filesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&pageSize=1000`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }
    );

    let fileCount = 0;
    if (filesResponse.ok) {
      const filesData = await filesResponse.json();
      fileCount = filesData.files?.length || 0;
    }

    const storageInfo: SharedDriveStorageInfo = {
      driveId: driveInfo.id,
      driveName: driveInfo.name,
      fileCount,
      canCreateFiles: driveInfo.capabilities?.canAddChildren !== false,
      capabilities: driveInfo.capabilities
    };

    console.log(`📊 Shared Drive "${driveInfo.name}": ${fileCount} files, can create: ${storageInfo.canCreateFiles}`);

    return storageInfo;
  } catch (error) {
    console.warn('⚠️ Could not check Shared Drive storage:', error.message);
    // Return conservative estimates if check fails
    return {
      driveId: Deno.env.get('GOOGLE_SHARED_DRIVE_ID') || 'unknown',
      driveName: 'Unknown Drive',
      fileCount: 0,
      canCreateFiles: true
    };
  }
};

export const validateSharedDriveBeforeOperation = async (): Promise<boolean> => {
  const storageInfo = await checkSharedDriveStorage();
  
  if (!storageInfo.canCreateFiles) {
    throw new Error(`Cannot create files in Shared Drive "${storageInfo.driveName}". Check drive permissions and restrictions.`);
  }
  
  if (storageInfo.fileCount && storageInfo.fileCount > 10000) {
    console.warn(`⚠️ Shared Drive "${storageInfo.driveName}" has ${storageInfo.fileCount} files. Consider cleanup for better performance.`);
  }
  
  console.log(`✅ Shared Drive "${storageInfo.driveName}" is ready for operations`);
  return true;
};

export const listAvailableSharedDrives = async () => {
  try {
    console.log('📋 Listing available Shared Drives...');
    const accessToken = await getGoogleAccessToken();
    const drives = await listSharedDrives(accessToken);
    
    console.log(`📋 Found ${drives.length} available Shared Drives:`);
    drives.forEach(drive => {
      console.log(`  - ${drive.name} (${drive.id})`);
    });
    
    return drives;
  } catch (error) {
    console.warn('⚠️ Could not list Shared Drives:', error.message);
    return [];
  }
};
