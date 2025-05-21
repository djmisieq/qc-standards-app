import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { v4 as uuidv4 } from 'uuid';
import { SyncQueueItem } from '../types';

// Create axios instance with base URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
export const setupApiInterceptors = (token: string | null) => {
  api.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};

// Function to handle API requests with offline support
export const apiRequest = async <T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any,
  config?: AxiosRequestConfig,
  offlineOptions?: {
    queueOffline?: boolean;
    localDataKey?: string;
    offlineData?: any;
  }
): Promise<T> => {
  const { isOnline, getOfflineData, saveOfflineData } = useOffline();
  const { token } = useAuth();

  // Add auth token to headers
  const headers = {
    Authorization: token ? `Bearer ${token}` : '',
    ...config?.headers,
  };

  // If online, make the API request
  if (isOnline) {
    try {
      let response: AxiosResponse<T>;

      switch (method) {
        case 'GET':
          response = await api.get<T>(url, { ...config, headers });
          break;
        case 'POST':
          response = await api.post<T>(url, data, { ...config, headers });
          break;
        case 'PUT':
          response = await api.put<T>(url, data, { ...config, headers });
          break;
        case 'DELETE':
          response = await api.delete<T>(url, { ...config, headers });
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      // Cache data for offline access if requested
      if (offlineOptions?.localDataKey) {
        await saveOfflineData(offlineOptions.localDataKey, response.data);
      }

      return response.data;
    } catch (error) {
      // If API request fails and we have offline options, try offline mode
      if (offlineOptions?.queueOffline) {
        return handleOfflineRequest<T>(url, method, data, headers, offlineOptions);
      }
      throw error;
    }
  } else {
    // If offline, handle offline request
    if (offlineOptions?.queueOffline) {
      return handleOfflineRequest<T>(url, method, data, headers, offlineOptions);
    }
    
    // If we can't queue the request, try to get cached data
    if (offlineOptions?.localDataKey) {
      const cachedData = await getOfflineData<T>(offlineOptions.localDataKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Return offline data if provided
    if (offlineOptions?.offlineData) {
      return offlineOptions.offlineData as T;
    }
    
    throw new Error('No network connection and no offline data available');
  }
};

// Helper function to handle offline requests
async function handleOfflineRequest<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: any,
  headers?: Record<string, string>,
  offlineOptions?: {
    queueOffline?: boolean;
    localDataKey?: string;
    offlineData?: any;
  }
): Promise<T> {
  const { saveOfflineData, getOfflineData } = useOffline();

  // For GET requests, use cached data if available
  if (method === 'GET' && offlineOptions?.localDataKey) {
    const cachedData = await getOfflineData<T>(offlineOptions.localDataKey);
    if (cachedData) {
      return cachedData;
    }
  }

  // For other methods, queue the request for later synchronization
  if (method !== 'GET' && offlineOptions?.queueOffline) {
    // Create a sync queue item
    const syncQueueItem: SyncQueueItem = {
      id: uuidv4(),
      url,
      method,
      body: data,
      headers,
      localDataKey: offlineOptions.localDataKey,
      timestamp: Date.now(),
    };

    // Add to sync queue
    const syncQueue = await getOfflineData<SyncQueueItem[]>('syncQueue') || [];
    syncQueue.push(syncQueueItem);
    await saveOfflineData('syncQueue', syncQueue);

    // Return offline data if provided
    if (offlineOptions.offlineData) {
      return offlineOptions.offlineData as T;
    }
  }

  throw new Error('No network connection and operation cannot be queued');
}

// Error handling helper
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail: string }>;
    return axiosError.response?.data?.detail || axiosError.message;
  }
  return error instanceof Error ? error.message : 'An unknown error occurred';
}
