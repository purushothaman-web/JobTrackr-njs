import axios from 'axios';
import { api } from '@/lib/api';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

type RequestConfig = {
  headers?: Record<string, string>;
  responseType?: 'blob';
};

const getConfig = (token?: string, responseType?: 'blob'): RequestConfig => {
  const config: RequestConfig = {};
  if (token) {
    config.headers = { Authorization: `Bearer ${token}` };
  }
  if (responseType) {
    config.responseType = responseType;
  }
  return config;
};

const getApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: string; message?: string } | undefined)?.error ||
      (error.response?.data as { error?: string; message?: string } | undefined)?.message ||
      error.message
    );
  }
  return 'Something went wrong';
};

const unwrap = <T>(payload: ApiResponse<T>) => {
  if (!payload.success) {
    throw new Error(payload.error || 'Request failed');
  }
  return payload.data;
};

export const fetchJobs = async ({
  token,
  page = 1,
  limit = 10,
  status = '',
  search = '',
  sortBy = 'createdAt',
  order = 'desc',
}: any) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      order,
    });
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await api.get<ApiResponse<any>>(`/jobs?${params.toString()}`, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const fetchJob = async ({ id, token }: { id: string | number; token?: string }) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/jobs/${id}`, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const createJob = async (jobData: any, token?: string) => {
  try {
    const response = await api.post<ApiResponse<any>>('/jobs', jobData, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const updateJob = async (id: string | number, jobData: any, token?: string) => {
  try {
    const response = await api.put<ApiResponse<any>>(`/jobs/${id}`, jobData, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const updateJobStatus = async ({
  id,
  status,
  token,
}: {
  id: string | number;
  status: string;
  token?: string;
}) => {
  try {
    const response = await api.patch<ApiResponse<any>>(`/jobs/${id}/status`, { status }, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const deleteJob = async (id: string | number, token?: string) => {
  try {
    const response = await api.delete<ApiResponse<{ message: string }>>(`/jobs/${id}`, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const getJobStats = async (token?: string) => {
  try {
    const response = await api.get<ApiResponse<any>>('/jobs/stats', getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const exportJobsCSV = async (token?: string) => {
  try {
    const response = await api.get('/jobs/export', getConfig(token, 'blob'));
    return response.data as Blob;
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const sendJobSummaryEmail = async (token?: string) => {
  try {
    const response = await api.get<ApiResponse<{ message: string }>>('/jobs/email', getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const importJobs = async (rows: any[], token?: string) => {
  try {
    const response = await api.post<ApiResponse<any>>('/jobs/import', { rows }, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const getJobTimeline = async (jobId: string | number, token?: string) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/jobs/${jobId}/timeline`, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const fetchInterviews = async (jobId: string | number, token?: string) => {
  try {
    const response = await api.get<ApiResponse<any>>(`/jobs/${jobId}/interviews`, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const fetchAllInterviews = async (token?: string, filters?: { status?: string; from?: string; to?: string }) => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    const query = params.toString();
    const response = await api.get<ApiResponse<any>>(`/interviews${query ? `?${query}` : ''}`, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const createInterview = async (jobId: string | number, payload: any, token?: string) => {
  try {
    const response = await api.post<ApiResponse<any>>(`/jobs/${jobId}/interviews`, payload, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const updateInterview = async (interviewId: string | number, payload: any, token?: string) => {
  try {
    const response = await api.put<ApiResponse<any>>(`/interviews/${interviewId}`, payload, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const deleteInterview = async (interviewId: string | number, token?: string) => {
  try {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/interviews/${interviewId}`,
      getConfig(token)
    );
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const fetchCompanies = async (token?: string, search?: string) => {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const response = await api.get<ApiResponse<any>>(`/companies${query}`, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const createCompany = async (payload: any, token?: string) => {
  try {
    const response = await api.post<ApiResponse<any>>('/companies', payload, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const updateCompany = async (companyId: string | number, payload: any, token?: string) => {
  try {
    const response = await api.put<ApiResponse<any>>(`/companies/${companyId}`, payload, getConfig(token));
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};

export const deleteCompany = async (companyId: string | number, token?: string) => {
  try {
    const response = await api.delete<ApiResponse<{ message: string }>>(
      `/companies/${companyId}`,
      getConfig(token)
    );
    return unwrap(response.data);
  } catch (error) {
    throw new Error(getApiError(error));
  }
};
