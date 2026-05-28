import axios from 'axios';

// Di production (Vercel), panggil langsung ke backend Railway
// Di development (localhost), pakai proxy Vite
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err.response?.data?.error || err.message || 'Terjadi kesalahan';
    return Promise.reject(new Error(msg));
  }
);

export default api;

export const formatRp = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDateLong = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export const getNowMonthYear = () => {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
};

export const getMonthName = (month, year) => {
  return new Date(year, month - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};
