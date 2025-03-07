
import { Retell } from 'retell-sdk';
import { 
  RETELL_API_KEY, 
  RETELL_API_BASE_URL, 
  RETELL_API_TIMEOUT,
  RETELL_API_MAX_RETRIES,
  RETELL_API_RETRY_DELAY,
  RETELL_API_PROXY_URL,
  RETELL_API_ENDPOINTS
} from '../config/retell';

interface RetellConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  proxyUrl?: string;
}

// Define our own interface for response engine types
interface RetellResponseEngineBase {
  type: string;
}

interface RetellResponseEngineRetellLLM extends RetellResponseEngineBase {
  type: "retell-llm";
  llm_id?: string;
}

interface RetellResponseEngineCustomLM extends RetellResponseEngineBase {
  type: "custom-llm";
  webhook_url?: string;
}

interface RetellResponseEngineConversationFlow extends RetellResponseEngineBase {
  type: "conversation-flow";
}

// Union type for all response engine types
type RetellResponseEngine = 
  RetellResponseEngineRetellLLM | 
  RetellResponseEngineCustomLM | 
  RetellResponseEngineConversationFlow;

// Expanded interfaces to better match the Retell SDK response structure
export interface RetellAgent {
  id: string;
  voice_id: string;
  llm_id?: string;
  name: string;
  created_at: string;
  agent_name?: string;
  response_engine?: RetellResponseEngine;
  voice_model?: string;
  language?: string;
}

// Define response engine interface to handle different types - removing this as we're using RetellResponseEngine instead
// export interface ResponseEngine {
//   type: string;
//   llm_id?: string;
// }

export interface RetellVoice {
  id: string;
  name: string;
  created_at: string;
  provider?: string;
  accent?: string;
  gender?: string;
  age?: string;
  preview_audio_url?: string;
  voice_name?: string;
}

export interface RetellLLM {
  id: string;
  type: string;
  name: string;
  created_at: string;
  model?: string;
  s2s_model?: string;
  model_temperature?: number;
  general_prompt?: string;
}

export interface RetellCall {
  id: string;
  agent_id: string;
  status: string;
  created_at: string;
  ended_at: string | null;
  duration: number | null;
  call_type?: string;
  call_id?: string;
  call_status?: string;
  access_token?: string;
  start_timestamp?: number;
  end_timestamp?: number;
  transcript?: string;
  recording_url?: string;
  disconnection_reason?: string;
  call_analysis?: {
    call_summary?: string;
    user_sentiment?: string;
    call_successful?: boolean;
  };
}

export interface PhoneNumber {
  phone_number: string;
  created_at?: string;
}

export interface CreateWebCallRequest {
  agent_id: string;
  metadata?: Record<string, string>;
}

export interface CreatePhoneCallRequest {
  agent_id: string;
  to_number: string;  // Changed from to_phone to to_number to match SDK
  from_number?: string;
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
  language?: string;
}

interface WebCallResponseCustom {
  id: string;
  register_url: string;
  call_id?: string;
  access_token?: string;
}

// Sleep function for retry mechanism
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class RetellAPI {
  private client: Retell;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;
  private proxyUrl: string;

  constructor(config: RetellConfig) {
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries || RETELL_API_MAX_RETRIES;
    this.retryDelay = config.retryDelay || RETELL_API_RETRY_DELAY;
    this.proxyUrl = config.proxyUrl || RETELL_API_PROXY_URL;
    
    // Determine if we need to use a proxy for the baseURL
    const baseURL = this.proxyUrl 
      ? `${this.proxyUrl}${encodeURIComponent(config.baseUrl || RETELL_API_BASE_URL)}`
      : (config.baseUrl || RETELL_API_BASE_URL);
    
    console.log("Initializing Retell SDK client with:", {
      baseURL: baseURL,
      apiKey: this.apiKey.substring(0, 5) + '...',
      timeout: config.timeout || RETELL_API_TIMEOUT
    });
    
    // Initialize the Retell SDK client with explicit configuration
    this.client = new Retell({
      apiKey: this.apiKey,
      baseURL: baseURL, // SDK uses baseURL (not baseUrl)
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
      console.log("Fetching agents from Retell API");
      const response = await this.client.agent.list({});
      
      // Convert SDK response to expected format - agents is the expected field
      if (!response || !Array.isArray(response)) {
        console.log("Unexpected response format from list agents:", response);
        return { data: [] };
      }
      
      const agents: RetellAgent[] = response.map((agent: any) => {
        // Create a safe response_engine object that handles all possible types
        let responseEngine: RetellResponseEngine;
        
        if (agent.response_engine?.type === "retell-llm") {
          responseEngine = {
            type: "retell-llm",
            llm_id: agent.response_engine?.llm_id
          } as RetellResponseEngineRetellLLM;
        } else if (agent.response_engine?.type === "custom-llm") {
          responseEngine = {
            type: "custom-llm",
            webhook_url: agent.response_engine?.webhook_url
          } as RetellResponseEngineCustomLM;
        } else {
          responseEngine = {
            type: "conversation-flow"
          } as RetellResponseEngineConversationFlow;
        }
        
        return {
          id: agent.agent_id || "",
          voice_id: agent.voice_id || "",
          llm_id: agent.response_engine?.type === "retell-llm" ? agent.response_engine?.llm_id : undefined,
          name: agent.agent_name || "",
          created_at: agent.last_modification_timestamp?.toString() || "",
          agent_name: agent.agent_name || "",
          response_engine: responseEngine,
          voice_model: agent.voice_model || "",
          language: agent.language || "en-US"
        };
      });
      
      return { data: agents };
    }, "listAgents");
  }

  async getAgent(agentId: string) {
    return this.callWithRetry(async () => {
      const agent = await this.client.agent.retrieve(agentId);
      
      // Create a safe response_engine object based on the type
      let responseEngine: RetellResponseEngine;
      
      if (agent.response_engine?.type === "retell-llm") {
        responseEngine = {
          type: "retell-llm",
          llm_id: agent.response_engine?.llm_id
        } as RetellResponseEngineRetellLLM;
      } else if (agent.response_engine?.type === "custom-llm") {
        responseEngine = {
          type: "custom-llm",
          webhook_url: agent.response_engine?.webhook_url
        } as RetellResponseEngineCustomLM;
      } else {
        responseEngine = {
          type: "conversation-flow"
        } as RetellResponseEngineConversationFlow;
      }
      
      // Convert the SDK response to our expected format
      const result: RetellAgent = {
        id: agent.agent_id || "",
        voice_id: agent.voice_id || "",
        llm_id: agent.response_engine?.type === "retell-llm" ? agent.response_engine?.llm_id : undefined,
        name: agent.agent_name || "",
        created_at: agent.last_modification_timestamp?.toString() || "",
        agent_name: agent.agent_name || "",
        response_engine: responseEngine,
        voice_model: agent.voice_model || "",
        language: agent.language || "en-US"
      };
      
      return result;
    }, `getAgent(${agentId})`);
  }

  async createAgent(data: CreateAgentRequest) {
    return this.callWithRetry(async () => {
      // Prepare the request to match the API's expected format according to docs
      const requestData: any = {
        agent_name: data.name,
        voice_id: data.voice_id,
        response_engine: {
          type: "retell-llm",
          llm_id: data.llm_id
        },
        language: data.language || "en-US",
        begin_message: data.initial_message,
        metadata: data.metadata || {},
        custom_data: data.custom_data || {}
      };
      
      console.log("Creating agent with data:", requestData);
      const response = await this.client.agent.create(requestData);
      
      // Create a safe response_engine object based on the type
      let responseEngine: RetellResponseEngine;
      
      if (response.response_engine?.type === "retell-llm") {
        responseEngine = {
          type: "retell-llm",
          llm_id: response.response_engine?.llm_id
        } as RetellResponseEngineRetellLLM;
      } else if (response.response_engine?.type === "custom-llm") {
        responseEngine = {
          type: "custom-llm",
          webhook_url: response.response_engine?.webhook_url
        } as RetellResponseEngineCustomLM;
      } else {
        responseEngine = {
          type: "conversation-flow"
        } as RetellResponseEngineConversationFlow;
      }
      
      // Convert the SDK response to our expected format
      const agent: RetellAgent = {
        id: response.agent_id || "",
        voice_id: response.voice_id || "",
        llm_id: response.response_engine?.type === "retell-llm" ? response.response_engine?.llm_id : undefined,
        name: response.agent_name || "",
        created_at: response.last_modification_timestamp?.toString() || "",
        agent_name: response.agent_name || "",
        response_engine: responseEngine,
        voice_model: response.voice_model || "",
        language: response.language || "en-US"
      };
      
      return agent;
    }, "createAgent");
  }

  // Voices
  async listVoices() {
    return this.callWithRetry(async () => {
      console.log("Fetching voices from Retell API");
      const response = await this.client.voice.list();
      
      // Convert SDK response to expected format
      if (!response || !Array.isArray(response)) {
        console.log("Unexpected response format from list voices:", response);
        return { data: [] };
      }
      
      const voices: RetellVoice[] = response.map((voice: any) => ({
        id: voice.voice_id || "",
        name: voice.voice_name || "",
        created_at: "",  // Not provided in the API response
        provider: voice.provider || "",
        accent: voice.accent || "",
        gender: voice.gender || "",
        age: voice.age || "",
        preview_audio_url: voice.preview_audio_url || "",
        voice_name: voice.voice_name || ""
      }));
      
      return { data: voices };
    }, "listVoices");
  }

  async getVoice(voiceId: string) {
    return this.callWithRetry(async () => {
      const voice = await this.client.voice.retrieve(voiceId);
      
      // Convert to RetellVoice format
      const result: RetellVoice = {
        id: voice.voice_id || "",
        name: voice.voice_name || "",
        created_at: "",  // Not provided in the API response
        provider: voice.provider || "",
        accent: voice.accent || "",
        gender: voice.gender || "",
        age: voice.age || "",
        preview_audio_url: voice.preview_audio_url || "",
        voice_name: voice.voice_name || ""
      };
      
      return result;
    }, `getVoice(${voiceId})`);
  }

  // LLMs
  async listLLMs() {
    return this.callWithRetry(async () => {
      console.log("Fetching LLMs from Retell API");
      const response = await this.client.llm.list();
      
      // Convert SDK response to expected format
      if (!response || !Array.isArray(response)) {
        console.log("Unexpected response format from list LLMs:", response);
        return { data: [] };
      }
      
      const llms: RetellLLM[] = response.map((llm: any) => ({
        id: llm.llm_id || "",
        type: "retell_llm",
        name: llm.model || "",
        created_at: llm.last_modification_timestamp?.toString() || "",
        model: llm.model || "",
        s2s_model: llm.s2s_model || "",
        model_temperature: llm.model_temperature || 0,
        general_prompt: llm.general_prompt || ""
      }));
      
      return { data: llms };
    }, "listLLMs");
  }

  async getLLM(llmId: string) {
    return this.callWithRetry(async () => {
      const llm = await this.client.llm.retrieve(llmId);
      
      // Convert to RetellLLM format
      const result: RetellLLM = {
        id: llm.llm_id || "",
        type: "retell_llm",
        name: llm.model || "",
        created_at: llm.last_modification_timestamp?.toString() || "",
        model: llm.model || "",
        s2s_model: llm.s2s_model || "",
        model_temperature: llm.model_temperature || 0,
        general_prompt: llm.general_prompt || ""
      };
      
      return result;
    }, `getLLM(${llmId})`);
  }

  // Web Calls
  async createWebCall(data: CreateWebCallRequest) {
    return this.callWithRetry(async () => {
      // Following API docs
      const callParams = {
        agent_id: data.agent_id,
        metadata: data.metadata || {}
      };
      
      console.log("Creating web call with params:", callParams);
      const response = await this.client.call.createWebCall(callParams);
      
      // Format the response to match our expected interface
      // Using any type to safely access properties that might not be in the SDK type
      const webCallResponse: WebCallResponseCustom = {
        id: response.call_id || "",
        register_url: (response as any).register_url || "",  // Safely access potentially missing property
        call_id: response.call_id || "",
        access_token: (response as any).access_token || ""   // Safely access potentially missing property
      };
      
      return webCallResponse;
    }, "createWebCall");
  }

  // Phone Calls
  async createPhoneCall(data: CreatePhoneCallRequest) {
    return this.callWithRetry(async () => {
      // Following API docs for phone call creation
      const callParams: any = {
        agent_id: data.agent_id,
        to_number: data.to_number,  // Use to_number to match SDK parameter
        from_number: data.from_number,
        metadata: data.metadata || {}
      };
      
      console.log("Creating phone call with params:", callParams);
      const response = await this.client.call.createPhoneCall(callParams);
      
      // Return the response directly
      return response;
    }, "createPhoneCall");
  }

  // Calls
  async listCalls() {
    return this.callWithRetry(async () => {
      console.log("Fetching calls from Retell API");
      // Empty object is needed per the API docs
      const response = await this.client.call.list({});
      
      // Convert SDK response to expected format
      if (!response || !Array.isArray(response)) {
        console.log("Unexpected response format from list calls:", response);
        return { data: [] };
      }
      
      const calls: RetellCall[] = response.map((call: any) => ({
        id: call.call_id || "",
        agent_id: call.agent_id || "",
        status: call.call_status || "",
        created_at: call.start_timestamp?.toString() || "",
        ended_at: call.end_timestamp?.toString() || null,
        duration: call.end_timestamp && call.start_timestamp 
          ? Math.floor((call.end_timestamp - call.start_timestamp) / 1000)
          : null,
        call_type: call.call_type || "",
        call_id: call.call_id || "",
        call_status: call.call_status || "",
        access_token: (call as any).access_token || "",  // Safely access
        start_timestamp: call.start_timestamp || null,
        end_timestamp: call.end_timestamp || null,
        transcript: call.transcript || "",
        recording_url: call.recording_url || "",
        disconnection_reason: call.disconnection_reason || "",
        call_analysis: call.call_analysis || {}
      }));
      
      return { data: calls };
    }, "listCalls");
  }

  async getCall(callId: string) {
    return this.callWithRetry(async () => {
      // Following API docs
      const call = await this.client.call.retrieve(callId);
      
      // Convert to RetellCall format with extended properties
      const result: RetellCall = {
        id: call.call_id || "",
        agent_id: call.agent_id || "",
        status: call.call_status || "",
        created_at: call.start_timestamp?.toString() || "",
        ended_at: call.end_timestamp?.toString() || null,
        duration: call.end_timestamp && call.start_timestamp 
          ? Math.floor((call.end_timestamp - call.start_timestamp) / 1000)
          : null,
        call_type: call.call_type || "",
        call_id: call.call_id || "",
        call_status: call.call_status || "",
        access_token: (call as any).access_token || "",  // Safely access
        start_timestamp: call.start_timestamp || null,
        end_timestamp: call.end_timestamp || null,
        transcript: call.transcript || "",
        recording_url: call.recording_url || "",
        disconnection_reason: call.disconnection_reason || "",
        call_analysis: call.call_analysis || {}
      };
      
      return result;
    }, `getCall(${callId})`);
  }

  // Phone Numbers
  async listPhoneNumbers() {
    return this.callWithRetry(async () => {
      const response = await this.client.phoneNumber.list();
      
      // Convert SDK response to expected format
      if (!response || !Array.isArray(response)) {
        return { data: [] };
      }
      
      const phoneNumbers: PhoneNumber[] = response.map((phone: any) => ({
        phone_number: phone.phone_number || "",
        created_at: (phone as any).created_at || ""    // Safely access
      }));
      
      return { data: phoneNumbers };
    }, "listPhoneNumbers");
  }

  async getPhoneNumber(phoneNumberId: string) {
    return this.callWithRetry(async () => {
      const response = await this.client.phoneNumber.retrieve(phoneNumberId);
      
      // Convert to PhoneNumber format
      const result: PhoneNumber = {
        phone_number: response.phone_number || "",
        created_at: (response as any).created_at || ""    // Safely access
      };
      
      return result;
    }, `getPhoneNumber(${phoneNumberId})`);
  }

  // Helper method to format errors in a consistent way
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
  const proxyUrl = config.proxyUrl || RETELL_API_PROXY_URL;
  const baseUrl = config.baseUrl || RETELL_API_BASE_URL;
  
  // Optional: Log whether proxy is being used
  if (proxyUrl) {
    console.log(`Using CORS proxy: ${proxyUrl}`);
  }
  
  console.log("Creating Retell API client with:", {
    baseUrl: baseUrl,
    timeout: config.timeout || RETELL_API_TIMEOUT,
    maxRetries: config.maxRetries || RETELL_API_MAX_RETRIES,
    proxyEnabled: !!proxyUrl
  });
  
  return new RetellAPI({
    apiKey: config.apiKey,
    baseUrl: baseUrl,
    timeout: config.timeout || RETELL_API_TIMEOUT,
    maxRetries: config.maxRetries || RETELL_API_MAX_RETRIES,
    retryDelay: config.retryDelay || RETELL_API_RETRY_DELAY,
    proxyUrl: proxyUrl
  });
};
