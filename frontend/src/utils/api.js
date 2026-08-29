import { useAuthStore } from '../stores/authStore';

/**
 * 封装后的 Authenticated Fetch 工具函数
 * 自动注入 Bearer Token，并在遇到 401 未授权时自动触发登出
 */
export async function apiFetch(url, options = {}) {
  const token = useAuthStore.getState().token;
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  const res = await fetch(url, options);

  if (res.status === 401) {
    useAuthStore.getState().logout();
  }

  return res;
}
