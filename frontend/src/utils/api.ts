import { useAuthStore } from '../stores/authStore';

/**
 * 封装后的 Authenticated Fetch 工具函数
 * 自动注入 Bearer Token，并在遇到 401 未授权时自动触发登出
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
  }

  return res;
}
