// Client data management utilities

export interface UserDetails {
  firstName: string;
  lastName: string;
  designation: string;
}

export interface CompanyDetails {
  companyName: string;
  legalName: string;
  country: string;
  employeeCount: string;
}

export interface BusinessAddress {
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface MSAStatus {
  signed: boolean;
  signedDate?: string;
  signedBy?: string;
}

export interface ClientData {
  userDetails: UserDetails;
  companyDetails: CompanyDetails;
  businessAddress: BusinessAddress;
  msaStatus: MSAStatus;
}

const STORAGE_KEY = 'wisemonk_client_data';

// Default empty data structure
const defaultClientData: ClientData = {
  userDetails: {
    firstName: '',
    lastName: '',
    designation: ''
  },
  companyDetails: {
    companyName: '',
    legalName: '',
    country: '',
    employeeCount: ''
  },
  businessAddress: {
    address: '',
    city: '',
    state: '',
    postalCode: ''
  },
  msaStatus: {
    signed: false
  }
};

export function getClientData(): ClientData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultClientData, ...parsed };
    }
  } catch (error) {
    console.error('Error loading client data:', error);
  }
  return defaultClientData;
}

export function saveClientData(data: Partial<ClientData>): void {
  try {
    const current = getClientData();
    const updated = { ...current, ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving client data:', error);
  }
}

export function updateUserDetails(userDetails: UserDetails): void {
  saveClientData({ userDetails });
}

export function updateCompanyDetails(companyDetails: CompanyDetails): void {
  saveClientData({ companyDetails });
}

export function updateBusinessAddress(businessAddress: BusinessAddress): void {
  saveClientData({ businessAddress });
}

export function updateMSAStatus(msaStatus: MSAStatus): void {
  saveClientData({ msaStatus });
}