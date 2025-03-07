
import { Retell } from 'retell-sdk';
import { RETELL_API_KEY, RETELL_API_BASE_URL } from '../config/retell';

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
  response_engine: { type: string };
}

class RetellAPI {
  private client: Retell;
  private apiKey: string;

  constructor(config: RetellConfig) {
    this.apiKey = config.apiKey;
    // Initialize the Retell SDK client
    this.client = new Retell({
      apiKey: this.apiKey,
      baseURL: config.baseUrl || RETELL_API_BASE_URL, // Use the provided baseUrl or default
    });
  }

  // Agents
  async listAgents() {
    try {
      const response = await this.client.agent.list() as any;
      
      // Convert SDK response to expected format
      const agents: RetellAgent[] = (response.agents || []).map((agent: any) => ({
        id: agent.id || "",
        voice_id: agent.voice_id || "",
        llm_id: agent.llm_id || "",
        name: agent.name || "",
        created_at: agent.created_at || ""
      }));
      
      return { data: agents };
    } catch (error) {
      console.error("Error listing agents:", error);
      throw this.formatError(error);
    }
  }

  async getAgent(agentId: string) {
    try {
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
    } catch (error) {
      console.error(`Error retrieving agent ${agentId}:`, error);
      throw this.formatError(error);
    }
  }

  async createAgent(data: CreateAgentRequest) {
    try {
      // Prepare the request to match the SDK's expected format
      const requestData: any = {
        name: data.name,
        voice_id: data.voice_id,
        llm_id: data.llm_id,
        initial_talk: data.initial_message,
        metadata: data.metadata,
        custom_data: data.custom_data,
        response_engine: {
          type: "retell_llm"
        }
      };
      
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
    } catch (error) {
      console.error("Error creating agent:", error);
      throw this.formatError(error);
    }
  }

  // Voices
  async listVoices() {
    try {
      const response = await this.client.voice.list() as any;
      
      // Convert SDK response to expected format
      const voices: RetellVoice[] = (response.voices || []).map((voice: any) => ({
        id: voice.id || "",
        name: voice.name || "",
        created_at: voice.created_at || ""
      }));
      
      return { data: voices };
    } catch (error) {
      console.error("Error listing voices:", error);
      throw this.formatError(error);
    }
  }

  async getVoice(voiceId: string) {
    try {
      const response = await this.client.voice.retrieve(voiceId) as any;
      return response;
    } catch (error) {
      console.error(`Error retrieving voice ${voiceId}:`, error);
      throw this.formatError(error);
    }
  }

  // LLMs
  async listLLMs() {
    try {
      const response = await this.client.llm.list() as any;
      
      // Convert SDK response to expected format
      const llms: RetellLLM[] = (response.llms || []).map((llm: any) => ({
        id: llm.id || "",
        type: llm.type || "",
        name: llm.name || "",
        created_at: llm.created_at || ""
      }));
      
      return { data: llms };
    } catch (error) {
      console.error("Error listing LLMs:", error);
      throw this.formatError(error);
    }
  }

  async getLLM(llmId: string) {
    try {
      const response = await this.client.llm.retrieve(llmId) as any;
      return response;
    } catch (error) {
      console.error(`Error retrieving LLM ${llmId}:`, error);
      throw this.formatError(error);
    }
  }

  // Web Calls
  async createWebCall(data: CreateCallRequest) {
    try {
      const callParams: any = {
        agent_id: data.agent_id,
        metadata: data.metadata
      };
      
      const response = await this.client.call.createWebCall(callParams) as any;
      
      // Format the response to match our expected interface
      return {
        id: response.id || "",
        register_url: response.register_url || ""
      };
    } catch (error) {
      console.error("Error creating web call:", error);
      throw this.formatError(error);
    }
  }

  // Phone Calls
  async createPhoneCall(data: { agent_id: string; to_phone: string; metadata?: Record<string, string> }) {
    try {
      const response = await this.client.call.createPhoneCall({
        agent_id: data.agent_id,
        to_phone: data.to_phone,
        metadata: data.metadata
      } as any);
      return response;
    } catch (error) {
      console.error("Error creating phone call:", error);
      throw this.formatError(error);
    }
  }

  // Calls
  async listCalls() {
    try {
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
    } catch (error) {
      console.error("Error listing calls:", error);
      throw this.formatError(error);
    }
  }

  async getCall(callId: string) {
    try {
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
    } catch (error) {
      console.error(`Error retrieving call ${callId}:`, error);
      throw this.formatError(error);
    }
  }

  // Phone Numbers
  async listPhoneNumbers() {
    try {
      const response = await this.client.phoneNumber.list() as any;
      
      // Convert SDK response to expected format
      const phoneNumbers: PhoneNumber[] = (response.phone_numbers || []).map((phone: any) => ({
        id: phone.id || "",
        phone_number: phone.phone_number || "",
        created_at: phone.created_at || ""
      }));
      
      return { data: phoneNumbers };
    } catch (error) {
      console.error("Error listing phone numbers:", error);
      throw this.formatError(error);
    }
  }

  async getPhoneNumber(phoneNumberId: string) {
    try {
      const response = await this.client.phoneNumber.retrieve(phoneNumberId) as any;
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
