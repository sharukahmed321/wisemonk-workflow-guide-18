export interface FileUploadStatus {
  fileName?: string;
  fileSize?: number;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  uploadedAt?: string;
  errorMessage?: string;
  uploadedUrl?: string;
  fileType?: string;
  originalFile?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

export interface OnboardingProgressData {
  currentStep: number;
  completedSteps: number[];
  personalInfoData: any;
  documentData: any;
  bankDetailsData: any;
  fileUploadStatus: Record<string, FileUploadStatus>;
}

export interface PreboardingProgressData {
  currentStep: number;
  completedSteps: number[];
  personalDetailsData: any;
  backgroundVerificationData: any;
  employmentAgreementData: any;
  fileUploadStatus: Record<string, FileUploadStatus>;
}

class ProgressStateManager {
  private static readonly ONBOARDING_KEY_PREFIX = 'employee_onboarding_';
  private static readonly PREBOARDING_KEY_PREFIX = 'employee_preboarding_';

  // Safe serialization that handles File objects and dates
  private static safeStringify(data: any): string {
    return JSON.stringify(data, (key, value) => {
      if (value instanceof File) {
        return {
          _type: 'File',
          name: value.name,
          size: value.size,
          type: value.type,
          lastModified: value.lastModified
        };
      }
      if (value instanceof Date) {
        return {
          _type: 'Date',
          value: value.toISOString()
        };
      }
      return value;
    });
  }

  // Safe parsing that reconstructs special objects
  private static safeParse(jsonString: string): any {
    try {
      return JSON.parse(jsonString, (key, value) => {
        if (value && typeof value === 'object' && value._type === 'Date') {
          return new Date(value.value);
        }
        // Note: File objects cannot be reconstructed, we'll mark them as needing re-upload
        if (value && typeof value === 'object' && value._type === 'File') {
          return {
            _needsReupload: true,
            name: value.name,
            size: value.size,
            type: value.type
          };
        }
        return value;
      });
    } catch (error) {
      console.error('Error parsing stored data:', error);
      return null;
    }
  }

  // Get data from localStorage with validation
  private static getLocalStorageData<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const parsed = this.safeParse(stored);
      return parsed;
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(key);
      return null;
    }
  }

  // Save data to localStorage with safe serialization
  private static setLocalStorageData<T>(key: string, data: T): void {
    try {
      const serialized = this.safeStringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  }

  // Onboarding methods
  static loadOnboardingProgress(employeeId: string): OnboardingProgressData | null {
    const localKey = `${this.ONBOARDING_KEY_PREFIX}${employeeId}`;
    return this.getLocalStorageData<OnboardingProgressData>(localKey);
  }

  static saveOnboardingProgress(employeeId: string, data: OnboardingProgressData): void {
    const localKey = `${this.ONBOARDING_KEY_PREFIX}${employeeId}`;
    this.setLocalStorageData(localKey, data);
  }

  static clearOnboardingProgress(employeeId: string): void {
    const localKey = `${this.ONBOARDING_KEY_PREFIX}${employeeId}`;
    localStorage.removeItem(localKey);
  }

  // Preboarding methods
  static loadPreboardingProgress(employeeId: string): PreboardingProgressData | null {
    const localKey = `${this.PREBOARDING_KEY_PREFIX}${employeeId}`;
    return this.getLocalStorageData<PreboardingProgressData>(localKey);
  }

  static savePreboardingProgress(employeeId: string, data: PreboardingProgressData): void {
    const localKey = `${this.PREBOARDING_KEY_PREFIX}${employeeId}`;
    this.setLocalStorageData(localKey, data);
  }

  static clearPreboardingProgress(employeeId: string): void {
    const localKey = `${this.PREBOARDING_KEY_PREFIX}${employeeId}`;
    localStorage.removeItem(localKey);
  }

  // File upload status helpers
  static updateFileUploadStatus(
    currentStatus: Record<string, FileUploadStatus>,
    fileKey: string,
    status: Partial<FileUploadStatus>
  ): Record<string, FileUploadStatus> {
    return {
      ...currentStatus,
      [fileKey]: {
        ...currentStatus[fileKey],
        ...status
      }
    };
  }

  static hasLostFiles(fileUploadStatus: Record<string, FileUploadStatus>): boolean {
    return Object.values(fileUploadStatus).some(status => 
      status.uploadStatus === 'success' && !status.fileName
    );
  }

  static getLostFiles(fileUploadStatus: Record<string, FileUploadStatus>): string[] {
    return Object.entries(fileUploadStatus)
      .filter(([key, status]) => status.uploadStatus === 'success' && !status.fileName)
      .map(([key]) => key);
  }

  // Validation helpers
  static validateOnboardingData(data: any): data is OnboardingProgressData {
    return data && 
           typeof data.currentStep === 'number' &&
           Array.isArray(data.completedSteps) &&
           typeof data.personalInfoData === 'object' &&
           typeof data.documentData === 'object' &&
           typeof data.bankDetailsData === 'object' &&
           typeof data.fileUploadStatus === 'object';
  }

  static validatePreboardingData(data: any): data is PreboardingProgressData {
    return data && 
           typeof data.currentStep === 'number' &&
           Array.isArray(data.completedSteps) &&
           typeof data.personalDetailsData === 'object' &&
           typeof data.backgroundVerificationData === 'object' &&
           typeof data.employmentAgreementData === 'object' &&
           typeof data.fileUploadStatus === 'object';
  }
}

export default ProgressStateManager;