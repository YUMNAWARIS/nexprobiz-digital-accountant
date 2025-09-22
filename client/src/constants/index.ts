export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
export const API_V1_BASE = `${API_BASE_URL}/v1`;

// Cookie names
export const COOKIE_ACCESS_TOKEN = "access_token";
export const COOKIE_ROLE = "role";
export const COOKIE_BUSINESS_ID = "business_id";

// App routes
export const ROUTE_LOGIN = "/login";
export const ROUTE_MASTER_HOME = "/master";
export const ROUTE_BUSINESS_HOME = "/business";


