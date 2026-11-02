import axios from 'axios';
import {
  LoginResponse,
  User,
  Group,
  Expense,
  ExpenseRequest,
  Transaction,
  CreateGroupRequest,
} from '../types';

const resolveApiBaseUrl = (): string => {
  // 1. Direct API endpoint specified via VITE_API_BASE_URL (e.g. "https://domain.com/api" or "/api")
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl && envApiUrl.trim()) {
    return envApiUrl.trim().replace(/\/+$/, '');
  }

  // 2. Base backend host specified via VITE_BACKEND_URL (e.g. "https://domain.com")
  const envBackendUrl = import.meta.env.VITE_BACKEND_URL;
  if (envBackendUrl && envBackendUrl.trim()) {
    const cleaned = envBackendUrl.trim().replace(/\/+$/, '');
    return cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`;
  }

  // 3. Fallback to /api for local Vite dev proxy or reverse-proxy deployments
  return '/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Max request attempts when backend is not available
export const MAX_BACKEND_ATTEMPTS = 5;
export const RETRY_DELAY_MS = 1000;
export const BACKEND_BUSY_MESSAGE = 'Buzy right now try again letter';

/**
 * Checks whether an error signifies that the backend is unavailable or unreachable
 */
export const isBackendUnavailable = (error: any): boolean => {
  // If there is no response from the server at all (connection refused, server down, CORS fail, offline)
  if (!error.response) return true;

  // Specific network error codes
  if (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED'
  ) {
    return true;
  }

  // HTTP 5xx errors (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
  if (typeof error.response.status === 'number' && error.response.status >= 500) {
    return true;
  }

  return false;
};

// Interceptor to inject JWT token into Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle token expiration / auth errors and retry backend availability up to 5 times
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as any;

    // Handle 401 unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('currentUser');
      return Promise.reject(error);
    }

    // Check if backend is unavailable (network error or 5xx)
    if (isBackendUnavailable(error) && config) {
      config.__retryCount = (config.__retryCount || 0) + 1;

      // Try requesting up to 5 times (initial attempt + 4 retries = 5 attempts total)
      if (config.__retryCount < MAX_BACKEND_ATTEMPTS) {
        const nextAttempt = config.__retryCount + 1;
        console.warn(
          `[Splitzee API] Backend unavailable (${error.code || error.response?.status || 'Network Error'}). Retrying request (${nextAttempt}/${MAX_BACKEND_ATTEMPTS}): ${config.url}...`
        );

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('splitzee:backend-retry', {
              detail: {
                attempt: nextAttempt,
                maxAttempts: MAX_BACKEND_ATTEMPTS,
                url: config.url,
              },
            })
          );
        }

        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        return apiClient(config);
      }

      console.error(
        `[Splitzee API] Backend unavailable after ${MAX_BACKEND_ATTEMPTS} attempts. Displaying: "${BACKEND_BUSY_MESSAGE}"`
      );

      // Retries exhausted after 5 attempts!
      // Dispatch global event for loading screen / banners
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('splitzee:backend-busy', {
            detail: {
              message: BACKEND_BUSY_MESSAGE,
              url: config.url,
              method: config.method,
            },
          })
        );
      }

      // Format error to the standard busy message
      error.message = BACKEND_BUSY_MESSAGE;
      if (!error.response) {
        error.response = {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {},
          config,
          data: {
            message: BACKEND_BUSY_MESSAGE,
          },
        };
      } else {
        if (typeof error.response.data === 'string' || !error.response.data) {
          error.response.data = {
            message: BACKEND_BUSY_MESSAGE,
          };
        } else if (typeof error.response.data === 'object') {
          error.response.data.message = BACKEND_BUSY_MESSAGE;
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/login', { username, password });
    if (response.data.jwtToken) {
      localStorage.setItem('jwtToken', response.data.jwtToken);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user || { email: username, name: username }));
    }
    return response.data;
  },

  signup: async (email: string, name: string, password: string): Promise<any> => {
    const response = await apiClient.post('/signup', { email, name, password });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<string> => {
    const response = await apiClient.get<string>('/verify-email', {
      params: { token },
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};

// Group Services
export const groupService = {
  createGroup: async (request: CreateGroupRequest): Promise<Group> => {
    const response = await apiClient.post<Group>('/group/create', request);
    return response.data;
  },

  getUserGroups: async (email?: string): Promise<Group[]> => {
    const response = await apiClient.get<Group[]>('/group/getUser/group');
    return Array.isArray(response.data) ? response.data : [];
  },

  getUserIndividuals: async (): Promise<Group[]> => {
    const response = await apiClient.get<Group[]>('/group/getUser/individual');
    return Array.isArray(response.data) ? response.data : [];
  },

  createIndividual: async (email2: string): Promise<Group> => {
    const response = await apiClient.post<Group>(
      '/group/createIndividual',
      { email: email2 }
    );
    return response.data;
  },

  deleteIndividual: async (groupId: string): Promise<string> => {
    const response = await apiClient.delete<string>(`/group/${groupId}/deleteGroup`);
    return response.data;
  },

  getGroup: async (groupId: string): Promise<Group> => {
    const response = await apiClient.get<Group>(`/group/${groupId}/showGroup`);
    return response.data;
  },

  getMembers: async (groupId: string): Promise<string[]> => {
    const response = await apiClient.get<string[]>(`/group/${groupId}/getmembers`);
    return response.data;
  },

  checkValidMember: async (email: string): Promise<boolean> => {
    try {
      const response = await apiClient.post<string>(`/group/${encodeURIComponent(email)}/checkValidMember`);
      return response.status === 200;
    } catch (err: any) {
      if (err.response && (err.response.status === 404 || err.response.status === 400)) {
        return false;
      }
      throw err;
    }
  },

  addMembers: async (groupId: string, emails: string[]): Promise<string> => {
    const response = await apiClient.post<string>(`/group/${groupId}/addmembers`, emails);
    return response.data;
  },

  inviteMembers: async (groupId: string, emails: string[]): Promise<string> => {
    const response = await apiClient.post<string>(`/group/${groupId}/invite`, emails);
    return response.data;
  },

  acceptInvite: async (token: string): Promise<string> => {
    const response = await apiClient.post<string>('/group/invitations/accept', null, {
      params: { token },
    });
    return response.data;
  },

  getPendingInvitations: async (groupId: string): Promise<string[]> => {
    try {
      const response = await apiClient.get<string[]>(`/group/${groupId}/invitations/pending`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  removeMember: async (groupId: string, email: string): Promise<string> => {
    const response = await apiClient.delete<string>(`/group/${groupId}/removeMember`, {
      data: email,
    });
    return response.data;
  },

  updateTitle: async (groupId: string, title: string): Promise<string> => {
    const response = await apiClient.patch<string>(`/group/${groupId}/updateGroupTitle`, title);
    return response.data;
  },

  deleteGroup: async (groupId: string): Promise<string> => {
    const response = await apiClient.delete<string>(`/group/${groupId}/deleteGroup`);
    return response.data;
  },

  getUserBalance: async (groupId: string, email: string): Promise<number> => {
    try {
      const response = await apiClient.get<string>(`/group/${groupId}/getUserBalance`, {
        params: { email },
      });
      const parsed = parseFloat(response.data);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  },
};

// Expense Services
export const expenseService = {
  addExpense: async (groupId: string, req: ExpenseRequest): Promise<string> => {
    const response = await apiClient.post<string>(`/group/${groupId}/add/expenses`, req);
    return response.data;
  },

  getExpenses: async (groupId: string): Promise<Expense[]> => {
    const response = await apiClient.get<Expense[]>(`/group/${groupId}/showExpenses`);
    return Array.isArray(response.data) ? response.data : [];
  },

  getOneExpense: async (groupId: string, expenseId: string): Promise<Expense> => {
    const response = await apiClient.get<any>(`/group/${groupId}/${expenseId}/showOneExpenses`);
    return response.data?.expense || response.data;
  },

  editExpense: async (groupId: string, expenseId: string, req: ExpenseRequest): Promise<string> => {
    const response = await apiClient.put<string>(`/group/${groupId}/${expenseId}/edit`, req);
    return response.data;
  },

  deleteExpense: async (groupId: string, expenseId: string): Promise<string> => {
    const response = await apiClient.delete<string>(`/group/${groupId}/${expenseId}/delete`);
    return response.data;
  },
};

// Settlement Services
export const settlementService = {
  settleGroup: async (groupId: string): Promise<Transaction[]> => {
    const response = await apiClient.get<Transaction[]>(`/group/${groupId}/settle`);
    return Array.isArray(response.data) ? response.data : [];
  },

  executeTransaction: async (transactionId: string): Promise<string> => {
    const response = await apiClient.post<string>(`/group/${transactionId}/executeTransaction`);
    return response.data;
  },
};
