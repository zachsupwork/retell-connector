
import { Retell } from 'retell-sdk';
import type {
  AgentResponse, 
  VoiceResponse, 
  LlmResponse, 
  CallResponse, 
  PhoneNumberResponse
} from 'retell-sdk';

interface RetellConfig {
  apiKey: string;
  baseUrl?: string;
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
  response_engine: string;
}

class RetellAPI {
  private client: Retell;
  private apiKey: string;

  constructor(config: RetellConfig) {
    this.apiKey = config.apiKey;
    // Initialize the Retell SDK client
    this.client = new Retell({
      apiKey: this.apiKey,
      // If baseUrl is provided, use it, otherwise let the SDK use its default
      ...(config.baseUrl && { baseURL: config.baseUrl }),
    });
  }

  // Agents
  async listAgents() {
    try {
      const response = await this.client.agent.list();
      // Convert SDK response to expected format
      return { 
        data: response.agents || [] 
      };
    } catch (error) {
      console.error("Error listing agents:", error);
      throw this.formatError(error);
    }
  }

  async getAgent(agentId: string) {
    try {
      const response = await this.client.agent.retrieve(agentId);
      // Convert the SDK response to our expected format
      const agent: RetellAgent = {
        id: response.id,
        voice_id: response.voice_id,
        llm_id: response.llm_id,
        name: response.name || "",
        created_at: response.created_at,
      };
      return agent;
    } catch (error) {
      console.error(`Error retrieving agent ${agentId}:`, error);
      throw this.formatError(error);
    }
  }

  async createAgent(data: CreateAgentRequest) {
    try {
      // Set a default response_engine if not provided
      const agentData = {
        ...data,
        response_engine: data.response_engine || "generate",
      };
      
      const response = await this.client.agent.create(agentData);
      
      // Convert the SDK response to our expected format
      const agent: RetellAgent = {
        id: response.id,
        voice_id: response.voice_id,
        llm_id: response.llm_id,
        name: response.name || "",
        created_at: response.created_at,
      };
      
      return agent;
    } catch (error) {
      console.error("Error creating agent:", error);
      throw this.formatError(error);
    }
  }

  // Voices
  async listVoices() {
    try {
      const response = await this.client.voice.list();
      // Convert SDK response to expected format
      return { 
        data: response.voices || [] 
      };
    } catch (error) {
      console.error("Error listing voices:", error);
      throw this.formatError(error);
    }
  }

  async getVoice(voiceId: string) {
    try {
      const response = await this.client.voice.retrieve(voiceId);
      return response;
    } catch (error) {
      console.error(`Error retrieving voice ${voiceId}:`, error);
      throw this.formatError(error);
    }
  }

  // LLMs
  async listLLMs() {
    try {
      const response = await this.client.llm.list();
      // Convert SDK response to expected format
      return { 
        data: response.llms || [] 
      };
    } catch (error) {
      console.error("Error listing LLMs:", error);
      throw this.formatError(error);
    }
  }

  async getLLM(llmId: string) {
    try {
      const response = await this.client.llm.retrieve(llmId);
      return response;
    } catch (error) {
      console.error(`Error retrieving LLM ${llmId}:`, error);
      throw this.formatError(error);
    }
  }

  // Web Calls
  async createWebCall(data: CreateCallRequest) {
    try {
      const response = await this.client.call.createWebCall({
        agent_id: data.agent_id,
        metadata: data.metadata
      });
      return response;
    } catch (error) {
      console.error("Error creating web call:", error);
      throw this.formatError(error);
    }
  }

  // Phone Calls
  async createPhoneCall(data: CreateCallRequest & { to_phone: string }) {
    try {
      const response = await this.client.call.createPhoneCall({
        agent_id: data.agent_id,
        to_phone: data.to_phone,
        metadata: data.metadata
      });
      return response;
    } catch (error) {
      console.error("Error creating phone call:", error);
      throw this.formatError(error);
    }
  }

  // Calls
  async listCalls() {
    try {
      const response = await this.client.call.list({});
      // Convert SDK response to expected format
      return { 
        data: response.calls || [] 
      };
    } catch (error) {
      console.error("Error listing calls:", error);
      throw this.formatError(error);
    }
  }

  async getCall(callId: string) {
    try {
      const response = await this.client.call.retrieve(callId);
      return response;
    } catch (error) {
      console.error(`Error retrieving call ${callId}:`, error);
      throw this.formatError(error);
    }
  }

  // Phone Numbers
  async listPhoneNumbers() {
    try {
      const response = await this.client.phoneNumber.list();
      // Convert SDK response to expected format
      return { 
        data: response.phone_numbers || [] 
      };
    } catch (error) {
      console.error("Error listing phone numbers:", error);
      throw this.formatError(error);
    }
  }

  async getPhoneNumber(phoneNumberId: string) {
    try {
      const response = await this.client.phoneNumber.retrieve(phoneNumberId);
      return response;
    } catch (error) {
      console.error(`Error retrieving phone number ${phoneNumberId}:`, error);
      throw this.formatError(error);
    }
  }

  // Helper method to format errors in a consistent way
  private formatError(error: any): Error {
    if (error.response?.data) {
      return new Error(`Retell API Error: ${error.response.status} ${JSON.stringify(error.response.data)}`);
    } else if (error.message) {
      return new Error(`Retell API Error: ${error.message}`);
    } else {
      return new Error(`Retell API Error: Unknown error occurred`);
    }
  }
}

export const createRetellAPI = (config: RetellConfig) => {
  return new RetellAPI(config);
};
