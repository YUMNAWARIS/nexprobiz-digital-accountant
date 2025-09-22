import { API_V1_BASE } from "@/constants";
import { COOKIE_ACCESS_TOKEN } from "@/constants";
import { getCookie } from "@/utils/cookies";

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: number | string;
  email: string;
  role: string; // "master" | other roles
  business_id?: number | string | null;
};

export type LoginResponse = {
  message: string;
  token: string;
  user: AuthUser;
};

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${API_V1_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = data?.message || "Login failed";
    throw new Error(message);
  }

  return res.json();
}


export type MasterStatsResponse = {
  message: string;
  stats: {
    users: {
      active: number;
      inactive: number;
      blocked: number;
      deleted: number;
      locked: number;
      total: number;
    };
    businesses: number;
  };
};

export async function getMasterStats(): Promise<MasterStatsResponse> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  const res = await fetch(`${API_V1_BASE}/master/stats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = data?.message || "Failed to fetch master stats";
    throw new Error(message);
  }

  return res.json();
}


// Master Businesses
export type Address = {
  line1?: string;
  line2?: string;
  zip?: string;
  city?: string;
  country?: string;
};

export type BusinessData = {
  country?: string;
  business_type?: string;
  mcc?: string;
  industry?: string;
  legal_name?: string;
  legal_address?: Address;
  dba_name?: string;
  dba_address?: Address;
  product_service_details?: string;
  registration_no?: string;
};

export type Business = {
  id: number | string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  data?: BusinessData | null;
};

export type GetBusinessesResponse = {
  message: string;
  data: Business[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

export async function getMasterBusinesses(params?: { page?: number; limit?: number; search?: string }): Promise<GetBusinessesResponse> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);

  const res = await fetch(`${API_V1_BASE}/master/businesses${query.toString() ? `?${query.toString()}` : ""}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data && data.message) || "Failed to fetch businesses";
    throw new Error(message);
  }

  return res.json();
}


export type CreateBusinessRequest = {
  name: string;
  email: string;
  user_email: string;
  password: string;
};

export type CreateBusinessResponse = {
  message: string;
  business: {
    id: number | string;
    name: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  user: {
    id: number | string;
    email: string;
    role: string;
    business_id: number | string;
  };
};

export async function createMasterBusiness(payload: CreateBusinessRequest): Promise<CreateBusinessResponse> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  const res = await fetch(`${API_V1_BASE}/master/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data && data.message) || "Failed to create business";
    throw new Error(message);
  }

  return res.json();
}

// Get business by id (for editing)
export type GetBusinessByIdResponse = {
  message: string;
  business: Business;
};

export async function getMasterBusiness(id: string | number): Promise<GetBusinessByIdResponse> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  const res = await fetch(`${API_V1_BASE}/master/businesses/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data && data.message) || "Failed to fetch business";
    throw new Error(message);
  }

  return res.json();
}

export type UpdateBusinessRequest = {
  name: string;
  email: string;
  password?: string; // optional; when set, updates admin user's password
};

export type UpdateBusinessResponse = {
  message: string;
  business: Business;
};

export async function updateMasterBusiness(id: string | number, payload: UpdateBusinessRequest): Promise<UpdateBusinessResponse> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  const res = await fetch(`${API_V1_BASE}/master/businesses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data && data.message) || "Failed to update business";
    throw new Error(message);
  }

  return res.json();
}

// Business Settings (Master)
export type BusinessSetting = {
  id: string;
  business_id: string;
  key: string;
  value: any;
  created_at: string;
  updated_at: string;
};

export type GetBusinessSettingsResponse = {
  message: string;
  settings: Record<string, string>;
};

export async function getBusinessSettings(id: string | number): Promise<Record<string, string>> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  const res = await fetch(`${API_V1_BASE}/master/business/${id}/settings`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data && data.message) || "Failed to fetch settings";
    throw new Error(message);
  }

  const data = await res.json();
  if (data && typeof data === 'object' && 'settings' in data) {
    return (data.settings as Record<string, string>) || {};
  }
  return (data as Record<string, string>) || {};
}

export type UpdateBusinessSettingsRequest = {
  settings: Record<string, string>;
};

export type UpdateBusinessSettingsResponse = {
  message: string;
  settings?: Record<string, string>;
};

export async function updateBusinessSettings(id: string | number, payload: UpdateBusinessSettingsRequest): Promise<UpdateBusinessSettingsResponse> {
  const token = getCookie(COOKIE_ACCESS_TOKEN);
  const res = await fetch(`${API_V1_BASE}/master/business/${id}/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data && data.message) || "Failed to update settings";
    throw new Error(message);
  }

  return res.json();
}

