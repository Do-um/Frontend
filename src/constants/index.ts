export const APP_CONFIG = {
  name: 'DO-WEB',
  version: '1.0.0',
  description: 'Modern web application for project management',
} as const;

export const API_ENDPOINTS = {
  users: '/api/users',
  projects: '/api/projects',
  tasks: '/api/tasks',
  auth: '/api/auth',
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
} as const;

export const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  completed: 'bg-blue-100 text-blue-800',
  archived: 'bg-gray-100 text-gray-800',
  'todo': 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-orange-100 text-orange-800',
} as const;

export const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
} as const;