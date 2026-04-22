// src/config/apiConfig.ts — Centralized API configuration for environment-aware requests
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
export const API_AUTH_URL = `${API_BASE_URL}/api/auth`;
export const API_BRAND_URL = `${API_BASE_URL}/api/brand`;
export const API_PRODUCTS_URL = `${API_BASE_URL}/api/products`;
export const API_ORDERS_URL = `${API_BASE_URL}/api/orders`;
export const API_ADMIN_URL = `${API_BASE_URL}/api/admin`;
export const API_STAFF_URL = `${API_BASE_URL}/api/staff`;
