
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export interface StorageInfo {
  totalQuota: number;
  usedQuota: number;
  freeQuota: number;
  usagePercentage: number;
  driveUsage: {
    totalFiles: number;
    totalSize: number;
    msaFiles: number;
    msaSize: number;
  };
  warningLevel: 'low' | 'medium' | 'high' | 'critical';
}

export async function checkStorageUsage(): Promise<StorageInfo> {
  console.log('💾 Checking storage usage...');
  
  try {
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    // Get about info for quota
    const aboutResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=storageQuota', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    let storageQuota = {
      limit: 0,
      usage: 0
    };

    if (aboutResponse.ok) {
      const aboutData = await aboutResponse.json();
      storageQuota = {
        limit: parseInt(aboutData.storageQuota?.limit || '0'),
        usage: parseInt(aboutData.storageQuota?.usage || '0')
      };
    }

    // Get drive usage
    const driveUsage = await getDriveUsage(accessToken, sharedDriveId);
    
    const freeQuota = storageQuota.limit - storageQuota.usage;
    const usagePercentage = storageQuota.limit > 0 ? (storageQuota.usage / storageQuota.limit) * 100 : 0;
    
    let warningLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (usagePercentage > 95) warningLevel = 'critical';
    else if (usagePercentage > 85) warningLevel = 'high';
    else if (usagePercentage > 70) warningLevel = 'medium';

    const storageInfo: StorageInfo = {
      totalQuota: storageQuota.limit,
      usedQuota: storageQuota.usage,
      freeQuota,
      usagePercentage,
      driveUsage,
      warningLevel
    };

    console.log('💾 Storage usage:', {
      used: formatBytes(storageInfo.usedQuota),
      total: formatBytes(storageInfo.totalQuota),
      percentage: `${usagePercentage.toFixed(1)}%`,
      warning: warningLevel
    });

    return storageInfo;

  } catch (error) {
    console.error('❌ Failed to check storage usage:', error);
    throw error;
  }
}

async function getDriveUsage(accessToken: string, sharedDriveId: string): Promise<any> {
  console.log('📊 Getting drive usage details...');
  
  try {
    // Get all files in the shared drive
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&fields=files(id,name,size,createdTime)&pageSize=1000`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Drive usage query failed: ${response.status}`);
    }

    const data = await response.json();
    const files = data.files || [];
    
    const totalFiles = files.length;
    const totalSize = files.reduce((sum: number, file: any) => sum + parseInt(file.size || '0'), 0);
    
    // Filter MSA files
    const msaFiles = files.filter((file: any) => file.name.includes('MSA_'));
    const msaSize = msaFiles.reduce((sum: number, file: any) => sum + parseInt(file.size || '0'), 0);

    return {
      totalFiles,
      totalSize,
      msaFiles: msaFiles.length,
      msaSize
    };

  } catch (error) {
    console.error('❌ Failed to get drive usage:', error);
    return {
      totalFiles: 0,
      totalSize: 0,
      msaFiles: 0,
      msaSize: 0
    };
  }
}

export async function monitorStorageHealth(): Promise<any> {
  console.log('🏥 Monitoring storage health...');
  
  try {
    const storageInfo = await checkStorageUsage();
    const health = {
      status: 'healthy',
      warnings: [],
      recommendations: []
    };

    // Check for warnings
    if (storageInfo.warningLevel === 'critical') {
      health.status = 'critical';
      health.warnings.push('Storage usage is critically high (>95%)');
      health.recommendations.push('Immediate cleanup required');
      health.recommendations.push('Consider upgrading storage plan');
    } else if (storageInfo.warningLevel === 'high') {
      health.status = 'warning';
      health.warnings.push('Storage usage is high (>85%)');
      health.recommendations.push('Schedule cleanup of old files');
    } else if (storageInfo.warningLevel === 'medium') {
      health.status = 'caution';
      health.warnings.push('Storage usage is moderate (>70%)');
      health.recommendations.push('Monitor usage regularly');
    }

    // Check MSA file usage
    const msaUsagePercentage = storageInfo.totalQuota > 0 ? 
      (storageInfo.driveUsage.msaSize / storageInfo.totalQuota) * 100 : 0;

    if (msaUsagePercentage > 10) {
      health.warnings.push(`MSA files using ${msaUsagePercentage.toFixed(1)}% of total storage`);
      health.recommendations.push('Consider cleaning up old MSA documents');
    }

    // Check file count
    if (storageInfo.driveUsage.totalFiles > 10000) {
      health.warnings.push(`Large number of files (${storageInfo.driveUsage.totalFiles})`);
      health.recommendations.push('Consider archiving old files');
    }

    console.log('🏥 Storage health:', health.status);
    if (health.warnings.length > 0) {
      console.log('⚠️ Warnings:', health.warnings);
    }
    if (health.recommendations.length > 0) {
      console.log('💡 Recommendations:', health.recommendations);
    }

    return {
      storageInfo,
      health
    };

  } catch (error) {
    console.error('❌ Storage health monitoring failed:', error);
    return {
      storageInfo: null,
      health: {
        status: 'error',
        warnings: ['Storage health check failed'],
        recommendations: ['Check system connectivity']
      }
    };
  }
}

export async function generateStorageReport(): Promise<any> {
  console.log('📋 Generating storage report...');
  
  try {
    const accessToken = await getGoogleAccessToken();
    const envValidation = validateAndCorrectEnvironmentVariables();
    
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { sharedDriveId } = envValidation.correctedVars;
    
    // Get detailed file information
    const response = await fetch(`https://www.googleapis.com/drive/v3/files?driveId=${sharedDriveId}&includeItemsFromAllDrives=true&supportsAllDrives=true&corpora=drive&fields=files(id,name,size,createdTime,modifiedTime,mimeType)&pageSize=1000`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      throw new Error(`Storage report query failed: ${response.status}`);
    }

    const data = await response.json();
    const files = data.files || [];
    
    // Analyze files
    const fileTypes = {};
    const sizeDistribution = {
      small: 0,    // < 1MB
      medium: 0,   // 1MB - 10MB
      large: 0,    // 10MB - 100MB
      xlarge: 0    // > 100MB
    };
    
    const now = new Date();
    const ageDistribution = {
      recent: 0,   // < 1 day
      current: 0,  // 1-7 days
      old: 0,      // 1-30 days
      ancient: 0   // > 30 days
    };

    files.forEach((file: any) => {
      const size = parseInt(file.size || '0');
      const createdTime = new Date(file.createdTime);
      const ageInDays = (now.getTime() - createdTime.getTime()) / (1000 * 60 * 60 * 24);
      
      // File type analysis
      const mimeType = file.mimeType || 'unknown';
      fileTypes[mimeType] = (fileTypes[mimeType] || 0) + 1;
      
      // Size distribution
      if (size < 1024 * 1024) sizeDistribution.small++;
      else if (size < 10 * 1024 * 1024) sizeDistribution.medium++;
      else if (size < 100 * 1024 * 1024) sizeDistribution.large++;
      else sizeDistribution.xlarge++;
      
      // Age distribution
      if (ageInDays < 1) ageDistribution.recent++;
      else if (ageInDays < 7) ageDistribution.current++;
      else if (ageInDays < 30) ageDistribution.old++;
      else ageDistribution.ancient++;
    });

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalFiles: files.length,
        totalSize: files.reduce((sum: number, file: any) => sum + parseInt(file.size || '0'), 0),
        avgFileSize: files.length > 0 ? files.reduce((sum: number, file: any) => sum + parseInt(file.size || '0'), 0) / files.length : 0
      },
      fileTypes,
      sizeDistribution,
      ageDistribution,
      topLargestFiles: files
        .sort((a: any, b: any) => parseInt(b.size || '0') - parseInt(a.size || '0'))
        .slice(0, 10)
        .map((file: any) => ({
          name: file.name,
          size: parseInt(file.size || '0'),
          sizeFormatted: formatBytes(parseInt(file.size || '0')),
          createdTime: file.createdTime
        })),
      oldestFiles: files
        .sort((a: any, b: any) => new Date(a.createdTime).getTime() - new Date(b.createdTime).getTime())
        .slice(0, 10)
        .map((file: any) => ({
          name: file.name,
          createdTime: file.createdTime,
          ageInDays: Math.floor((now.getTime() - new Date(file.createdTime).getTime()) / (1000 * 60 * 60 * 24))
        }))
    };

    console.log('📋 Storage report generated');
    console.log('📊 Summary:', report.summary);
    
    return report;

  } catch (error) {
    console.error('❌ Storage report generation failed:', error);
    return { error: error.message };
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function startStorageMonitoring(intervalMinutes: number = 60): Promise<void> {
  console.log(`🔄 Starting storage monitoring (every ${intervalMinutes} minutes)...`);
  
  const monitor = async () => {
    try {
      const health = await monitorStorageHealth();
      
      if (health.health.status === 'critical') {
        console.error('🚨 CRITICAL: Storage usage is critically high!');
        // Here you could send alerts, trigger cleanup, etc.
      } else if (health.health.status === 'warning') {
        console.warn('⚠️ WARNING: Storage usage is high');
      }
      
    } catch (error) {
      console.error('❌ Storage monitoring failed:', error);
    }
  };

  // Run monitoring immediately
  await monitor();
  
  // Schedule recurring monitoring
  setInterval(monitor, intervalMinutes * 60 * 1000);
}
