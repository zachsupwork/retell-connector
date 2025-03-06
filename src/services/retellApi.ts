
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
}

class RetellAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: RetellConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.retellai.com/v1';
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Retell API Error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  // Agents
  async listAgents() {
    return this.fetchWithAuth('/agents') as Promise<{ data: RetellAgent[] }>;
  }

  async getAgent(agentId: string) {
    return this.fetchWithAuth(`/agents/${agentId}`) as Promise<RetellAgent>;
  }

  async createAgent(data: CreateAgentRequest) {
    return this.fetchWithAuth('/agents', {
      method: 'POST',
      body: JSON.stringify(data)
    }) as Promise<RetellAgent>;
  }

  // Voices
  async listVoices() {
    return this.fetchWithAuth('/voices') as Promise<{ data: RetellVoice[] }>;
  }

  async getVoice(voiceId: string) {
    return this.fetchWithAuth(`/voices/${voiceId}`) as Promise<RetellVoice>;
  }

  // LLMs
  async listLLMs() {
    return this.fetchWithAuth('/llms') as Promise<{ data: RetellLLM[] }>;
  }

  async getLLM(llmId: string) {
    return this.fetchWithAuth(`/llms/${llmId}`) as Promise<RetellLLM>;
  }

  // Web Calls
  async createWebCall(data: CreateCallRequest) {
    return this.fetchWithAuth('/calls', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        type: 'web'
      })
    }) as Promise<{ id: string, register_url: string }>;
  }

  // Phone Calls
  async createPhoneCall(data: CreateCallRequest & { to_phone: string }) {
    return this.fetchWithAuth('/calls', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        type: 'phone'
      })
    }) as Promise<{ id: string }>;
  }

  // Calls
  async listCalls() {
    return this.fetchWithAuth('/calls') as Promise<{ data: RetellCall[] }>;
  }

  async getCall(callId: string) {
    return this.fetchWithAuth(`/calls/${callId}`) as Promise<RetellCall>;
  }

  // Phone Numbers
  async listPhoneNumbers() {
    return this.fetchWithAuth('/phone-numbers') as Promise<{ data: PhoneNumber[] }>;
  }

  async getPhoneNumber(phoneNumberId: string) {
    return this.fetchWithAuth(`/phone-numbers/${phoneNumberId}`) as Promise<PhoneNumber>;
  }
}

export const createRetellAPI = (config: RetellConfig) => {
  return new RetellAPI(config);
};
