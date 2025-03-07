
import { Retell } from 'retell-sdk';
import { 
  RETELL_API_KEY, 
  RETELL_API_BASE_URL, 
  RETELL_API_TIMEOUT,
  RETELL_API_MAX_RETRIES,
  RETELL_API_RETRY_DELAY
} from '../config/retell';

interface RetellConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface RetellAgent {
  id: string;
  voice_id: string;
  llm_id: string;
  name: string;
  created_at: string;
}

export interface RetellVoice {
  id: string;
  name: string;
  created_at: string;
}

export interface RetellLLM {
  id: string;
  type: string;
  name: string;
  created_at: string;
}

export interface RetellCall {
  id: string;
  agent_id: string;
  status: string;
  created_at: string;
  ended_at: string | null;
  duration: number | null;
}

export interface PhoneNumber {
  id: string;
  phone_number: string;
  created_at: string;
}

export interface CreateCallRequest {
  agent_id: string;
  metadata?: Record<string, string>;
}

export interface CreateAgentRequest {
  voice_id: string;
  llm_id: string;
  name: string;
  initial_message?: string;
  llm_webhook_url?: string;
  metadata?: Record<string, string>;
  custom_data?: Record<string, any>;
  response_engine: { type: string };
}

interface RetellResponseBase {
  id?: string;
  created_at?: string;
}

// Sleep function for retry mechanism
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class RetellAPI {
  private client: Retell;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config: RetellConfig) {
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries || RETELL_API_MAX_RETRIES;
    this.retryDelay = config.retryDelay || RETELL_API_RETRY_DELAY;
    
    console.log("Initializing Retell SDK client with:", {
      baseURL: config.baseUrl || RETELL_API_BASE_URL,
      timeout: config.timeout || RETELL_API_TIMEOUT
    });
    
    // Initialize the Retell SDK client with explicit baseURL and timeout
    this.client = new Retell({
      apiKey: this.apiKey,
      baseURL: config.baseUrl || RETELL_API_BASE_URL, // Note: Retell SDK uses baseURL not baseUrl
      timeout: config.timeout || RETELL_API_TIMEOUT,
    });
  }

  // Wrapper for API calls with retry logic
  private async callWithRetry<T>(
    apiCall: () => Promise<T>,
    operation: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for ${operation}`);
          await sleep(this.retryDelay * attempt); // Exponential backoff
        }
        
        return await apiCall();
      } catch (error) {
        lastError = error;
        console.error(`Error in ${operation} (attempt ${attempt + 1}/${this.maxRetries + 1}):`, error);
        
        // Check if error is related to rate limiting or temporary failure
        const shouldRetry = this.isRetryableError(error);
        if (!shouldRetry) {
          console.log(`Non-retryable error for ${operation}, giving up.`);
          break;
        }
      }
    }
    
    throw this.formatError(lastError);
  }
  
  // Determine if an error should trigger a retry
  private isRetryableError(error: any): boolean {
    // Network errors, timeouts, and rate limits (429) should be retried
    if (!error.response) {
      return true; // Network error, retry
    }
    
    const status = error.response?.status;
    return status === 429 || (status >= 500 && status < 600);
  }

  // Agents
  async listAgents() {
    return this.callWithRetry(async () => {
      console.log("Fetching agents from:", RETELL_API_BASE_URL);
      const response = await this.client.agent.list({}) as any;
      
      // Convert SDK response to expected format
      const agents: RetellAgent[] = (response.agents || []).map((agent: any) => ({
        id: agent.id || "",
        voice_id: agent.voice_id || "",
        llm_id: agent.llm_id || "",
        name: agent.name || "",
        created_at: agent.created_at || ""
      }));
      
      return { data: agents };
    }, "listAgents");
  }

  async getAgent(agentId: string) {
    return this.callWithRetry(async () => {
      const agent = await this.client.agent.retrieve(agentId) as any;
      
      // Convert the SDK response to our expected format
      const result: RetellAgent = {
        id: agent.id || "",
        voice_id: agent.voice_id || "",
        llm_id: agent.llm_id || "",
        name: agent.name || "",
        created_at: agent.created_at || "",
      };
      
      return result;
    }, `getAgent(${agentId})`);
  }

  async createAgent(data: CreateAgentRequest) {
    return this.callWithRetry(async () => {
      // Prepare the request to match the API's expected format according to docs
      const requestData: any = {
        name: data.name,
        voice_id: data.voice_id,
        llm_id: data.llm_id,
        initial_talk: data.initial_message,
        metadata: data.metadata || {},
        custom_data: data.custom_data || {},
        response_engine: {
          type: "retell_llm" // As per API docs
        }
      };
      
      console.log("Creating agent with data:", requestData);
      const response = await this.client.agent.create(requestData) as any;
      
      // Convert the SDK response to our expected format
      const agent: RetellAgent = {
        id: response.id || "",
        voice_id: response.voice_id || "",
        llm_id: response.llm_id || "",
        name: response.name || "",
        created_at: response.created_at || "",
      };
      
      return agent;
    }, "createAgent");
  }

  // Voices
  async listVoices() {
    return this.callWithRetry(async () => {
      console.log("Fetching voices from:", RETELL_API_BASE_URL);
      const response = await this.client.voice.list() as any;
      
      // Convert SDK response to expected format
      const voices: RetellVoice[] = (response.voices || []).map((voice: any) => ({
        id: voice.id || "",
        name: voice.name || "",
        created_at: voice.created_at || ""
      }));
      
      return { data: voices };
    }, "listVoices");
  }

  async getVoice(voiceId: string) {
    return this.callWithRetry(async () => {
      const response = await this.client.voice.retrieve(voiceId) as any;
      return response;
    }, `getVoice(${voiceId})`);
  }

  // LLMs
  async listLLMs() {
    return this.callWithRetry(async () => {
      console.log("Fetching LLMs from:", RETELL_API_BASE_URL);
      const response = await this.client.llm.list() as any;
      
      // Convert SDK response to expected format
      const llms: RetellLLM[] = (response.llms || []).map((llm: any) => ({
        id: llm.id || "",
        type: llm.type || "",
        name: llm.name || "",
        created_at: llm.created_at || ""
      }));
      
      return { data: llms };
    }, "listLLMs");
  }

  async getLLM(llmId: string) {
    return this.callWithRetry(async () => {
      const response = await this.client.llm.retrieve(llmId) as any;
      return response;
    }, `getLLM(${llmId})`);
  }

  // Web Calls - Updated according to API docs
  async createWebCall(data: CreateCallRequest) {
    return this.callWithRetry(async () => {
      // Following API docs: https://docs.retellai.com/api-references/create-web-call
      const callParams = {
        agent_id: data.agent_id,
        metadata: data.metadata || {}
      };
      
      console.log("Creating web call with params:", callParams);
      const response = await this.client.call.createWebCall(callParams) as any;
      
      // Format the response to match our expected interface
      return {
        id: response.id || "",
        register_url: response.register_url || ""
      };
    }, "createWebCall");
  }

  // Phone Calls - Updated according to API docs
  async createPhoneCall(data: { agent_id: string; to_phone: string; metadata?: Record<string, string> }) {
    return this.callWithRetry(async () => {
      // Following API docs: https://docs.retellai.com/api-references/create-phone-call
      const callParams = {
        agent_id: data.agent_id,
        to_phone: data.to_phone,
        metadata: data.metadata || {}
      };
      
      console.log("Creating phone call with params:", callParams);
      const response = await this.client.call.createPhoneCall(callParams as any);
      return response;
    }, "createPhoneCall");
  }

  // Calls - Updated according to API docs
  async listCalls() {
    return this.callWithRetry(async () => {
      console.log("Fetching calls from:", RETELL_API_BASE_URL);
      // Empty object is needed per the API docs
      const response = await this.client.call.list({}) as any;
      
      // Convert SDK response to expected format
      const calls: RetellCall[] = (response.calls || []).map((call: any) => ({
        id: call.id || "",
        agent_id: call.agent_id || "",
        status: call.status || "",
        created_at: call.created_at || "",
        ended_at: call.ended_at || null,
        duration: call.duration || null
      }));
      
      return { data: calls };
    }, "listCalls");
  }

  async getCall(callId: string) {
    return this.callWithRetry(async () => {
      // Following API docs: https://docs.retellai.com/api-references/get-call
      const call = await this.client.call.retrieve(callId) as any;
      
      // Convert to RetellCall format
      const result: RetellCall = {
        id: call.id || "",
        agent_id: call.agent_id || "",
        status: call.status || "",
        created_at: call.created_at || "",
        ended_at: call.ended_at || null,
        duration: call.duration || null
      };
      return result;
    }, `getCall(${callId})`);
  }

  // Phone Numbers
  async listPhoneNumbers() {
    return this.callWithRetry(async () => {
      const response = await this.client.phoneNumber.list() as any;
      
      // Convert SDK response to expected format
      const phoneNumbers: PhoneNumber[] = (response.phone_numbers || []).map((phone: any) => ({
        id: phone.id || "",
        phone_number: phone.phone_number || "",
        created_at: phone.created_at || ""
      }));
      
      return { data: phoneNumbers };
    }, "listPhoneNumbers");
  }

  async getPhoneNumber(phoneNumberId: string) {
    return this.callWithRetry(async () => {
      const response = await this.client.phoneNumber.retrieve(phoneNumberId) as any;
      return response;
    }, `getPhoneNumber(${phoneNumberId})`);
  }

  // Helper method to format errors in a consistent way and provide more details for debugging
  private formatError(error: any): Error {
    console.log("Full error details:", error);
    
    // Improved error formatting with more detailed information
    let errorMessage = "Retell API Error: ";
    
    if (error.response?.data) {
      errorMessage += `${error.response.status} ${JSON.stringify(error.response.data)}`;
    } else if (error.message) {
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        errorMessage += "Network connectivity issue. Please check your internet connection and try again.";
      } else if (error.message.includes("timed out")) {
        errorMessage += "Request timed out. The server took too long to respond.";
      } else {
        errorMessage += error.message;
      }
    } else {
      errorMessage += "Unknown error occurred";
    }
    
    return new Error(errorMessage);
  }
}

export const createRetellAPI = (config: RetellConfig) => {
  console.log("Creating Retell API client with:", {
    baseUrl: config.baseUrl || RETELL_API_BASE_URL,
    timeout: config.timeout || RETELL_API_TIMEOUT,
    maxRetries: config.maxRetries || RETELL_API_MAX_RETRIES
  });
  
  return new RetellAPI({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl || RETELL_API_BASE_URL,
    timeout: config.timeout || RETELL_API_TIMEOUT,
    maxRetries: config.maxRetries || RETELL_API_MAX_RETRIES,
    retryDelay: config.retryDelay || RETELL_API_RETRY_DELAY
  });
};
