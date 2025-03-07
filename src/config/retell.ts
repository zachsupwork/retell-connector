
// Base URL and API key for Retell API
export const RETELL_API_BASE_URL = "https://api.retell.ai";
export const RETELL_API_KEY = "key_eca5e99df9334eb12d9a471da9f2";

// API timeout in milliseconds
export const RETELL_API_TIMEOUT = 30000; // 30 seconds for better reliability

// CORS proxy URL for browser-based API calls
export const RETELL_API_PROXY_URL = "https://corsproxy.io/?";

// Retry configuration
export const RETELL_API_MAX_RETRIES = 3;
export const RETELL_API_RETRY_DELAY = 1000; // milliseconds

// API Endpoints based on the Retell SDK
export const RETELL_API_ENDPOINTS = {
  // Agent endpoints
  AGENTS: "/agents",
  AGENT: (id: string) => `/agents/${id}`,
  
  // Voice endpoints
  VOICES: "/voices",
  VOICE: (id: string) => `/voices/${id}`,
  
  // LLM endpoints
  LLMS: "/llms",
  LLM: (id: string) => `/llms/${id}`,
  
  // Call endpoints
  CALLS: "/calls",
  CALL: (id: string) => `/calls/${id}`,
  CREATE_WEB_CALL: "/calls/web",
  CREATE_PHONE_CALL: "/calls/phone",
  
  // Phone number endpoints
  PHONE_NUMBERS: "/phone_numbers",
  PHONE_NUMBER: (id: string) => `/phone_numbers/${id}`
};
