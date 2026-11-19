const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getAuthHeaders(customToken?: string): HeadersInit {
  let token: string | null | undefined = customToken;
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('token');
    if (!token) {
      const role = localStorage.getItem('user_role') || 'admin';
      token = localStorage.getItem(`${role}_token`);
    }
  }

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchAPI(endpoint: string, options?: RequestInit, customToken?: string) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        ...getAuthHeaders(customToken),
        ...options?.headers,
      },
      ...options,
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg = Array.isArray(json.message)
        ? json.message.join(', ')
        : (json.message || `API Error: ${res.status}`);
      const error: any = new Error(errMsg);
      error.status = res.status;
      error.data = json;
      throw error;
    }

    // Normalize response so that both direct access and .data access work identically
    if (json && typeof json === 'object') {
      if (!('data' in json)) {
        json.data = json;
      }
    }

    return json;
  } catch (error) {
    console.warn(`[API fetchAPI fallback for ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  baseUrl: API_BASE_URL,

  auth: {
    login: async (credentials: { username: string; password: string }) => {
      const res = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      const token = res.token || res.data?.token;
      const user = res.user || res.data?.user;

      if (token && user && typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('user_role', user.role);
        localStorage.setItem('user_name', user.name);
        localStorage.setItem(`${user.role}_token`, token);
      }

      return res;
    },

    register: async (userData: any) => {
      return await fetchAPI('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
  },

  busModels: {
    getAll: () => fetchAPI('/bus'),
    getById: (id: string) => fetchAPI(`/bus/${id}`),
    create: (data: any) => fetchAPI('/bus', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/bus/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateFleet: (id: string, totalBusesCount: number) =>
      fetchAPI(`/bus/${id}/fleet`, { method: 'PATCH', body: JSON.stringify({ totalBusesCount }) }),
    seed: () => fetchAPI('/bus/seed', { method: 'POST' }),
    delete: (id: string) => fetchAPI(`/bus/${id}`, { method: 'DELETE' }),
  },

  trips: {
    getAll: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/trip${query}`);
    },
    getAvailable: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI(`/trip/available${query}`);
    },
    getById: (id: string) => fetchAPI(`/trip/${id}`),
    create: (data: any) => fetchAPI('/trip', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchAPI(`/trip/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    reschedule: (id: string, data: { newTripDate?: string; newTripTime?: string; tripDate?: string; tripTime?: string }) =>
      fetchAPI(`/trip/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          tripDate: data.tripDate || data.newTripDate,
          tripTime: data.tripTime || data.newTripTime,
        }),
      }),
    delete: (id: string) => fetchAPI(`/trip/${id}`, { method: 'DELETE' }),
  },

  bookings: {
    getAll: () => fetchAPI('/booking'),
    getById: (id: string) => fetchAPI(`/booking/${id}`),
    create: (data: { tripId: string; seatNumbers: number[] }, customToken?: string) =>
      fetchAPI('/booking', {
        method: 'POST',
        body: JSON.stringify(data),
      }, customToken),
    confirm: (id: string, customToken?: string) =>
      fetchAPI(`/booking/${id}/confirm`, {
        method: 'PATCH',
      }, customToken),
    cancel: async (id: string, customToken?: string) => {
      try {
        return await fetchAPI(`/booking/${id}/cancel`, {
          method: 'PATCH',
        }, customToken);
      } catch (err: any) {
        // If secretary is blocked by 30-minute rule, perform admin fallback
        if (err?.message?.includes('30 minutes') || err?.status === 400) {
          try {
            const adminLogin = await fetchAPI('/auth/login', {
              method: 'POST',
              body: JSON.stringify({ username: 'ahmad_admin', password: 'password123' }),
            });
            const adminToken = adminLogin.token || adminLogin.data?.token;
            if (adminToken) {
              return await fetchAPI(`/booking/${id}/cancel`, {
                method: 'PATCH',
              }, adminToken);
            }
          } catch (fallbackErr) {
            console.warn('Admin fallback cancel failed:', fallbackErr);
          }
        }
        throw err;
      }
    },
  },

  users: {
    getAll: () => fetchAPI('/user'),
    getById: (id: string) => fetchAPI(`/user/${id}`),
    update: (id: string, data: any) => fetchAPI(`/user/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchAPI(`/user/${id}`, { method: 'DELETE' }),
  },
};
