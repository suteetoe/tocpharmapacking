
const getEnv = (key: string, defaultValue: string = ''): string => {
  // ดึงจาก window.appConfig ที่ฉีดเข้ามาตอน Runtime (แบบที่ 2)
  // ถ้าไม่มี ให้ถอยไปใช้ import.meta.env (สำหรับตอนรัน npm run dev)
  return window.appConfig?.[key] || (import.meta.env[key] as string) || defaultValue;
};

export const API_URL = getEnv('VITE_API_URL');
export const BASE_URL = getEnv('VITE_APP_BASE_URL', '/');
export const APP_NAME = getEnv('VITE_APP_NAME');

// ฟังก์ชันช่วยจัดการ Base Path ให้ถูกต้อง (มี / ปิดหัวท้าย)
export const getSafeBaseUrl = () => {
  let base = BASE_URL;
  if (!base.startsWith('/')) base = '/' + base;
  if (!base.endsWith('/')) base = base + '/';
  return base;
};