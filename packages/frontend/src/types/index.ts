export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
  avatar: string | null;
  timezone: string;
  organizationId: string | null;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  logo: string | null;
  customDomain: string | null;
  primaryColor: string;
  maxUsers: number;
  storageUsedBytes: string;
  memberCount: number;
  projectCount: number;
  teamCount: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  visibility: 'EVERYONE' | 'MEMBERS';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
