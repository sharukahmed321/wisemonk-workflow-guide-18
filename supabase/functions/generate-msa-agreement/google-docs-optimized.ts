
import { getGoogleAccessToken } from './google-auth.ts';
import { validateAndCorrectEnvironmentVariables } from './environment-validation.ts';

export interface OptimizedGenerationMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  steps: {
    authentication: number;
    documentCreation: number;
    placeholderReplacement: number;
    pdfExport: number;
    cleanup: number;
  };
  success: boolean;
  error?: string;
}

export async function generateMSAWithOptimizedPerformance(
  templateDocId: string,
  placeholders: Record<string, string>,
  userData: any
): Promise<{ pdfBuffer: Uint8Array; metrics: OptimizedGenerationMetrics }> {
  const metrics: OptimizedGenerationMetrics = {
    startTime: Date.now(),
    endTime: 0,
    duration: 0,
    steps: {
      authentication: 0,
      documentCreation: 0,
      placeholderReplacement: 0,
      pdfExport: 0,
      cleanup: 0
    },
    success: false
  };

  let tempDocId: string | null = null;

  try {
    console.log('🚀 Starting optimized MSA generation...');
    
    // Environment validation (cached)
    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { sharedDriveId } = envValidation.correctedVars;

    // Step 1: Authentication (with caching)
    const authStart = Date.now();
    const accessToken = await getGoogleAccessToken();
    metrics.steps.authentication = Date.now() - authStart;
    console.log(`⚡ Authentication completed in ${metrics.steps.authentication}ms`);

    // Step 2: Optimized document creation
    const docStart = Date.now();
    tempDocId = await createDocumentOptimized(accessToken, templateDocId, sharedDriveId, userData);
    metrics.steps.documentCreation = Date.now() - docStart;
    console.log(`⚡ Document creation completed in ${metrics.steps.documentCreation}ms`);

    // Step 3: Batch placeholder replacement
    const placeholderStart = Date.now();
    await replaceDocumentPlaceholdersOptimized(accessToken, tempDocId, placeholders);
    metrics.steps.placeholderReplacement = Date.now() - placeholderStart;
    console.log(`⚡ Placeholder replacement completed in ${metrics.steps.placeholderReplacement}ms`);

    // Step 4: Optimized PDF export
    const pdfStart = Date.now();
    const pdfBuffer = await exportDocumentToPDFOptimized(accessToken, tempDocId);
    metrics.steps.pdfExport = Date.now() - pdfStart;
    console.log(`⚡ PDF export completed in ${metrics.steps.pdfExport}ms`);

    // Step 5: Cleanup
    const cleanupStart = Date.now();
    await deleteDocumentOptimized(accessToken, tempDocId);
    metrics.steps.cleanup = Date.now() - cleanupStart;
    console.log(`⚡ Cleanup completed in ${metrics.steps.cleanup}ms`);

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.success = true;

    console.log(`🚀 Optimized generation completed in ${metrics.duration}ms`);
    console.log('📊 Performance breakdown:', metrics.steps);

    return { pdfBuffer, metrics };

  } catch (error) {
    console.error('❌ Optimized generation failed:', error);
    metrics.error = error.message;
    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;

    // Cleanup on error
    if (tempDocId) {
      const cleanupStart = Date.now();
      try {
        await deleteDocumentOptimized(await getGoogleAccessToken(), tempDocId);
        metrics.steps.cleanup = Date.now() - cleanupStart;
      } catch (cleanupError) {
        console.error('❌ Cleanup failed:', cleanupError);
      }
    }

    throw error;
  }
}

async function createDocumentOptimized(
  accessToken: string,
  templateDocId: string,
  sharedDriveId: string,
  userData: any
): Promise<string> {
  const tempDocTitle = `MSA_Optimized_${userData.first_name}_${userData.last_name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('📄 Creating optimized document:', tempDocTitle);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${templateDocId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: tempDocTitle,
      parents: [sharedDriveId]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Optimized document creation failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Optimized document created:', result.id);
  return result.id;
}

async function replaceDocumentPlaceholdersOptimized(
  accessToken: string,
  documentId: string,
  placeholders: Record<string, string>
): Promise<void> {
  console.log('🔄 Replacing placeholders (optimized batch)...');

  const requests = [];
  for (const [placeholder, value] of Object.entries(placeholders)) {
    if (value && value.trim()) {
      requests.push({
        replaceAllText: {
          containsText: {
            text: placeholder,
            matchCase: true
          },
          replaceText: value
        }
      });
    }
  }

  if (requests.length === 0) {
    console.log('⚠️ No placeholders to replace');
    return;
  }

  console.log(`🔄 Processing ${requests.length} placeholder replacements...`);

  const response = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Optimized placeholder replacement failed: ${response.status} - ${errorText}`);
  }

  console.log('✅ Optimized placeholders replaced successfully');
}

async function exportDocumentToPDFOptimized(
  accessToken: string,
  documentId: string
): Promise<Uint8Array> {
  console.log('📄 Exporting PDF (optimized)...');

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=application/pdf`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Optimized PDF export failed: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const pdfBuffer = new Uint8Array(arrayBuffer);
  
  console.log('✅ Optimized PDF export successful, size:', pdfBuffer.byteLength);
  return pdfBuffer;
}

async function deleteDocumentOptimized(accessToken: string, documentId: string): Promise<void> {
  console.log('🗑️ Deleting document (optimized):', documentId);

  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${documentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!response.ok && response.status !== 404) {
    console.warn('⚠️ Optimized document deletion failed:', response.status);
  } else {
    console.log('✅ Optimized document deleted successfully');
  }
}

export async function benchmarkOptimizedGeneration(): Promise<OptimizedGenerationMetrics[]> {
  const benchmarks: OptimizedGenerationMetrics[] = [];
  
  try {
    console.log('🧪 Running optimized generation benchmark...');
    
    const testPlaceholders = {
      '{{Client}}': 'Benchmark Client',
      '{{Name}}': 'Benchmark User',
      '{{Agreement_date}}': new Date().toLocaleDateString()
    };

    const testUserData = {
      first_name: 'Benchmark',
      last_name: 'User'
    };

    const envValidation = validateAndCorrectEnvironmentVariables();
    if (!envValidation.valid || !envValidation.correctedVars) {
      throw new Error('Environment validation failed');
    }

    const { templateDocId } = envValidation.correctedVars;
    
    // Run multiple benchmarks
    for (let i = 0; i < 3; i++) {
      console.log(`🏁 Benchmark run ${i + 1}/3`);
      
      const { metrics } = await generateMSAWithOptimizedPerformance(
        templateDocId,
        testPlaceholders,
        { ...testUserData, iteration: i }
      );
      
      benchmarks.push(metrics);
      
      // Wait between runs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate averages
    const avgMetrics = {
      duration: benchmarks.reduce((sum, m) => sum + m.duration, 0) / benchmarks.length,
      authentication: benchmarks.reduce((sum, m) => sum + m.steps.authentication, 0) / benchmarks.length,
      documentCreation: benchmarks.reduce((sum, m) => sum + m.steps.documentCreation, 0) / benchmarks.length,
      placeholderReplacement: benchmarks.reduce((sum, m) => sum + m.steps.placeholderReplacement, 0) / benchmarks.length,
      pdfExport: benchmarks.reduce((sum, m) => sum + m.steps.pdfExport, 0) / benchmarks.length,
      cleanup: benchmarks.reduce((sum, m) => sum + m.steps.cleanup, 0) / benchmarks.length
    };

    console.log('📊 Benchmark results (averages):');
    console.log(`  Total duration: ${avgMetrics.duration.toFixed(2)}ms`);
    console.log(`  Authentication: ${avgMetrics.authentication.toFixed(2)}ms`);
    console.log(`  Document creation: ${avgMetrics.documentCreation.toFixed(2)}ms`);
    console.log(`  Placeholder replacement: ${avgMetrics.placeholderReplacement.toFixed(2)}ms`);
    console.log(`  PDF export: ${avgMetrics.pdfExport.toFixed(2)}ms`);
    console.log(`  Cleanup: ${avgMetrics.cleanup.toFixed(2)}ms`);

    return benchmarks;

  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    throw error;
  }
}

export async function performanceTest(): Promise<any> {
  try {
    console.log('🧪 Running performance test...');
    
    const benchmarks = await benchmarkOptimizedGeneration();
    
    const successfulRuns = benchmarks.filter(b => b.success);
    const failedRuns = benchmarks.filter(b => !b.success);
    
    return {
      success: true,
      totalRuns: benchmarks.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      averageDuration: successfulRuns.reduce((sum, b) => sum + b.duration, 0) / successfulRuns.length,
      benchmarks: benchmarks
    };

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    return { success: false, error: error.message };
  }
}
