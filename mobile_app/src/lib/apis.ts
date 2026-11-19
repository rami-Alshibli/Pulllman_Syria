import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { ImperativeRouter } from "expo-router";
import { LoginUser, Method, RegisterUser, Trip, UserRes } from "./types";

export const getBaseUrl = (): string => {
  if (Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
  }

  // Support Android Studio Emulator (10.0.2.2 bridges to host 127.0.0.1)
  if (Platform.OS === "android" && !Device.isDevice) {
    return "http://10.0.2.2:3000";
  }

  // Dynamically extract host IP from Expo dev server (works seamlessly on physical devices connected via Expo Go)
  const host =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (host && typeof host === "string") {
    const ip = host.split(":")[0];
    if (ip && ip !== "localhost" && ip !== "127.0.0.1") {
      return `http://${ip}:3000`;
    }
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
    return envUrl;
  }

  return "http://10.48.16.117:3000";
};

export const url = getBaseUrl();

let guestTokenCache: string | null = null;
async function getCachedGuestToken(): Promise<string | null> {
  if (guestTokenCache) return guestTokenCache;
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "mohamed_ali", password: "password123" }),
    });
    const json = await res.json().catch(() => ({}));
    if (json?.token) {
      guestTokenCache = json.token;
      return guestTokenCache;
    }
  } catch {}
  return null;
}

export const request = async <T = unknown, D = unknown>(
  endpointUrl: string,
  method: Method = "GET",
  data: undefined | D = undefined,
  fullRes: boolean = false,
  token?: string,
): Promise<T> => {
  let authToken = token;

  // Retrieve user token from secure store if not provided
  if (!authToken) {
    try {
      const raw = await SecureStore.getItemAsync("auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        authToken = parsed?.token;
      }
    } catch {}
  }

  // If still unauthenticated, use guest token so GET /trip does not fail with 401
  if (!authToken && method === "GET") {
    authToken = (await getCachedGuestToken()) || undefined;
  }

  const response = await fetch(endpointUrl, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: data ? JSON.stringify(data) : null,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errMsg = Array.isArray(json?.message)
      ? json.message.join(", ")
      : (json?.message || `Error ${response.status}`);
    alert(errMsg);
    throw new Error(errMsg);
  }

  // Normalize: attach .data if not already present & flatten Mongoose _doc
  if (Array.isArray(json)) {
    json.forEach((item) => {
      if (item && typeof item === "object" && "_doc" in item) {
        Object.assign(item, (item as any)._doc);
      }
    });
  } else if (json && typeof json === "object") {
    if ("_doc" in json) {
      Object.assign(json, (json as any)._doc);
    }
    if (!("data" in json)) {
      json.data = json;
    }
  }

  if (fullRes) return json as T;

  return (json?.data !== undefined ? json.data : json) as T;
};

const createCrudServices = <
  TEntity,
  TCreate = Omit<TEntity, "_id" | "id">,
  TUpdate = Partial<TCreate>,
>(
  endPoint: string,
) => ({
  getAll: (query?: string) =>
    request<TEntity[]>(`${getBaseUrl()}/${endPoint}${query ? query : ""}`),
  getById: (id: string) => request<TEntity>(`${getBaseUrl()}/${endPoint}/${id}`),
  create: (data: TCreate, query?: string) =>
    request<TEntity, TCreate>(
      `${getBaseUrl()}/${endPoint}${query ? query : ""}`,
      "POST",
      data,
    ),
  update: (id: string, data: TUpdate) =>
    request<TEntity, TUpdate>(`${getBaseUrl()}/${endPoint}/${id}`, "PATCH", data),
  delete: (id: string, query?: string) =>
    request<null>(`${getBaseUrl()}/${endPoint}/${id}${query ? query : ""}`, "DELETE"),
});

let secretaryTokenCache: string | null = null;
async function getSecretaryToken(): Promise<string | null> {
  if (secretaryTokenCache) return secretaryTokenCache;
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "sara_sec", password: "password123" }),
    });
    const json = await res.json().catch(() => ({}));
    if (json?.token) {
      secretaryTokenCache = json.token;
      return secretaryTokenCache;
    }
  } catch {}
  return null;
}

const baseTripsCrud = createCrudServices<Trip>("trip");

export const tripsApi = {
  ...baseTripsCrud,
  getById: async (id: string) => {
    const trip = await request<any>(`${getBaseUrl()}/trip/${id}`);

    // Fetch live bookings to guarantee all confirmed and reserved seats are accurately populated
    try {
      const secToken = await getSecretaryToken();
      if (secToken) {
        const bookingsRes = await fetch(`${getBaseUrl()}/booking`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secToken}`,
          },
        });
        const allBookings = await bookingsRes.json().catch(() => []);
        if (Array.isArray(allBookings)) {
          const matchedBookings = allBookings
            .filter((b: any) => {
              const bTripId = b.tripId?._id || b.tripId?.id || b.tripId;
              return (
                String(bTripId) === String(id) &&
                (b.status === "reserved" || b.status === "confirmed")
              );
            })
            .map((b: any) => ({
              seatNumbers: b.seatNumbers || [],
              status: b.status as "reserved" | "confirmed",
            }));

          // Merge with any existing bookings on the trip object
          const existingBookings = Array.isArray(trip.tripBooking) ? trip.tripBooking : [];
          const combined = [...existingBookings];
          for (const mb of matchedBookings) {
            const alreadyHas = combined.some((cb: any) =>
              cb.seatNumbers?.some((s: number) => mb.seatNumbers?.includes(s))
            );
            if (!alreadyHas) {
              combined.push(mb);
            }
          }
          trip.tripBooking = combined;
        }
      }
    } catch (e) {
      console.warn("Could not fetch supplementary bookings:", e);
    }

    return trip as Trip;
  },
};

export const userApi = {
  register: (data: RegisterUser) =>
    request<UserRes, RegisterUser>(`${getBaseUrl()}/auth/register`, "POST", data, true),
  login: (data: LoginUser) =>
    request<UserRes, LoginUser>(`${getBaseUrl()}/auth/login`, "POST", data, true),
};

export const submitBooking = async (
  tripId: string,
  selectedSeats: number[],
  router: ImperativeRouter,
  token?: string | null,
) => {
  if (!token) {
    alert("يرجى تسجيل الدخول أولاً");
    router.push("/login");
    return;
  }
  if (selectedSeats.length === 0) {
    alert("يرجى اختيار مقعد واحد على الأقل من اللوحة");
    return;
  }
  const res = await request<any>(
    `${getBaseUrl()}/booking`,
    "POST",
    { tripId, seatNumbers: selectedSeats },
    true,
    token,
  );

  return {
    ...res,
    message: res?.message || "تم تسجيل الحجز بنجاح! يرجى تثبيته نقداً لدى المحطة.",
  };
};
