/** Authenticated fetch for staff endpoints — attaches the session token. */
export const api = (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('fg_admin_token') || '';
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
};
