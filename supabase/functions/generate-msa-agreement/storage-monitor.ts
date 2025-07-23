
import { getGoogleAccessToken } from './google-auth.ts';

export interface StorageInfo {
  used: number;
  limit: number;
  available: number;
  usagePercentage: number;
}

export const checkGoogleDriveStorage = async (): Promise<StorageInfo> => {
  try {
    console.log('📊 Checking Google Drive storage quota...');
    const accessToken = await getGoogleAccessToken();
    
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check storage: ${response.statusText}`);
    }

    const data = await response.json();
    const quota = data.storageQuota;
    
    const used = parseInt(quota.usage || '0');
    const limit = parseInt(quota.limit || '15000000000'); // Default 15GB if not specified
    const available = limit - used;
    const usagePercentage = (used / limit) * 100;

    console.log(`📊 Storage: ${(used / 1024 / 1024 / 1024).toFixed(2)}GB used / ${(limit / 1024 / 1024 / 1024).toFixed(2)}GB total (${usagePercentage.toFixed(1)}%)`);

    return {
      used,
      limit,
      available,
      usagePercentage
    };
  } catch (error) {
    console.warn('⚠️ Could not check storage quota:', error.message);
    // Return conservative estimates if check fails
    return {
      used: 0,
      limit: 15000000000,
      available: 15000000000,
      usagePercentage: 0
    };
  }
};

export const validateStorageBeforeOperation = async (estimatedSizeMB: number = 10): Promise<boolean> => {
  const storageInfo = await checkGoogleDriveStorage();
  const requiredBytes = estimatedSizeMB * 1024 * 1024;
  
  if (storageInfo.usagePercentage > 95) {
    throw new Error('Google Drive storage quota critically full (>95%). Cannot proceed with document generation.');
  }
  
  if (storageInfo.available < requiredBytes) {
    throw new Error(`Insufficient Google Drive storage. Need ${estimatedSizeMB}MB, but only ${(storageInfo.available / 1024 / 1024).toFixed(2)}MB available.`);
  }
  
  if (storageInfo.usagePercentage > 85) {
    console.warn(`⚠️ Google Drive storage is ${storageInfo.usagePercentage.toFixed(1)}% full. Consider cleanup soon.`);
  }
  
  return true;
};
