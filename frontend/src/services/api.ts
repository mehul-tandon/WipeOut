import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// Types
export interface OSDetection {
  detectedOS: string;
  recommendedTool: string;
  confidence: string;
  downloadUrl?: string;
  toolInfo?: {
    displayName: string;
    version: string;
    size: string;
    requirements: string;
    description: string;
  };
  note?: string;
}

export interface Tool {
  filename: string;
  displayName: string;
  version: string;
  size: string;
  actualSize?: string;
  architecture: string;
  requirements: string;
  description: string;
  downloadUrl: string;
  available: boolean;
  status?: string;
  lastModified?: string;
}

export interface ToolsResponse {
  tools: Record<string, Tool>;
  totalAvailable: number;
  buildInstructions: string;
}

export interface CertificateVerification {
  certificateId: string;
  valid: boolean;
  verifiedAt: string;
  wipeDetails?: {
    deviceId: string;
    algorithm: string;
    passes: number;
    status: string;
    startTime: string;
    endTime: string;
    duration: string;
  };
  issuer?: string;
  timestamp?: string;
}

export interface WipeSubmission {
  deviceId: string;
  serialNumber: string;
  algorithm: 'nist' | 'dod' | 'gutmann' | 'random';
  passes: number;
  startTime: string;
  endTime: string;
  status: 'success' | 'failed' | 'partial';
  verification?: boolean;
  deviceInfo?: {
    manufacturer?: string;
    model?: string;
    capacity?: string;
    interface?: string;
    firmware?: string;
  };
  wipeDetails?: {
    sectorsWiped?: number;
    totalSectors?: number;
    bytesWiped?: number;
    totalBytes?: number;
    errorCount?: number;
    warnings?: string[];
  };
  environment?: {
    os?: string;
    osVersion?: string;
    architecture?: string;
    hostname?: string;
    username?: string;
  };
}

// API Functions

// OS Detection
export const detectOS = async (): Promise<OSDetection> => {
  const response = await api.get('/api/download/detect-os');
  return response.data;
};

// Tools
export const getAvailableTools = async (): Promise<ToolsResponse> => {
  const response = await api.get('/api/download/tools');
  return response.data;
};

export const downloadTool = (platform: string): string => {
  return `${API_BASE_URL}/api/download/tool/${platform}`;
};

export const getInstructions = async (platform: string) => {
  const response = await api.get(`/api/download/instructions/${platform}`);
  return response.data;
};

// Certificate Verification
export const verifyCertificateById = async (certificateId: string): Promise<CertificateVerification> => {
  const response = await api.get(`/api/certificate/verify/${certificateId}`);
  return response.data;
};

export const verifyCertificateByFile = async (file: File, certificateId?: string): Promise<CertificateVerification> => {
  const formData = new FormData();
  formData.append('certificate', file);
  if (certificateId) {
    formData.append('certificateId', certificateId);
  }

  const response = await api.post('/api/certificate/verify', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const downloadCertificate = (certificateId: string): string => {
  return `${API_BASE_URL}/api/certificate/download/${certificateId}`;
};

export const getPublicKey = async () => {
  const response = await api.get('/api/certificate/public-key');
  return response.data;
};

// Wipe Submission
export const submitWipeData = async (wipeData: WipeSubmission) => {
  const response = await api.post('/api/wipe/submit', wipeData);
  return response.data;
};

export const uploadWipeReport = async (file: File) => {
  const formData = new FormData();
  formData.append('wipeReport', file);

  const response = await api.post('/api/wipe/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getWipeStatus = async (submissionId: string) => {
  const response = await api.get(`/api/wipe/status/${submissionId}`);
  return response.data;
};

// Health Check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
