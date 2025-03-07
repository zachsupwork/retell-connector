
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createRetellAPI, RetellAgent, RetellVoice, RetellLLM, RetellCall, CreateAgentRequest, CreateWebCallRequest } from "../services/retellApi";
import { RETELL_API_KEY, RETELL_API_BASE_URL, RETELL_API_TIMEOUT, RETELL_API_MAX_RETRIES, RETELL_API_PROXY_URL } from "../config/retell";
import { useToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

interface RetellContextType {
  agents: RetellAgent[];
  voices: RetellVoice[];
  llms: RetellLLM[];
  calls: RetellCall[];
  isLoading: boolean;
  error: string | null;
  refreshAgents: () => Promise<void>;
  refreshVoices: () => Promise<void>;
  refreshLLMs: () => Promise<void>;
  refreshCalls: () => Promise<void>;
  createAgent: (data: CreateAgentRequest) => Promise<RetellAgent>;
  createWebCall: (agentId: string) => Promise<{ id: string, register_url: string }>;
  getCall: (callId: string) => Promise<RetellCall>;
}

const RetellContext = createContext<RetellContextType | undefined>(undefined);

export const RetellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [agents, setAgents] = useState<RetellAgent[]>([]);
  const [voices, setVoices] = useState<RetellVoice[]>([]);
  const [llms, setLLMs] = useState<RetellLLM[]>([]);
  const [calls, setCalls] = useState<RetellCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const retellApi = createRetellAPI({ 
    apiKey: RETELL_API_KEY,
    baseUrl: RETELL_API_BASE_URL,
    timeout: RETELL_API_TIMEOUT,
    maxRetries: RETELL_API_MAX_RETRIES,
    proxyUrl: RETELL_API_PROXY_URL
  });

  const handleApiError = useCallback((err: any, operation: string) => {
    console.error(`Error during ${operation}:`, err);
    const message = err.message || `Failed to ${operation}`;
    setError(message);
    
    toast({
      title: "API Error",
      description: message,
      variant: "destructive"
    });
    
    sonnerToast.error("API Error", message);
  }, [toast]);

  const refreshAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await retellApi.listAgents();
      setAgents(response.data || []);
      setError(null);
    } catch (err: any) {
      handleApiError(err, "fetch agents");
      setAgents([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  const refreshVoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await retellApi.listVoices();
      setVoices(response.data || []);
      setError(null);
    } catch (err: any) {
      handleApiError(err, "fetch voices");
      setVoices([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  const refreshLLMs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await retellApi.listLLMs();
      setLLMs(response.data || []);
      setError(null);
    } catch (err: any) {
      handleApiError(err, "fetch LLMs");
      setLLMs([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  const refreshCalls = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await retellApi.listCalls();
      setCalls(response.data || []);
      setError(null);
    } catch (err: any) {
      handleApiError(err, "fetch calls");
      setCalls([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  const createAgent = useCallback(async (data: CreateAgentRequest) => {
    setIsLoading(true);
    try {
      const agentData: CreateAgentRequest = {
        ...data,
        response_engine: { type: "retell_llm" }
      };
      
      const agent = await retellApi.createAgent(agentData);
      await refreshAgents();
      
      toast({
        title: "Success",
        description: `Agent "${agent.name}" created successfully`,
      });
      
      return agent;
    } catch (err: any) {
      handleApiError(err, "create agent");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, refreshAgents, toast]);

  const createWebCall = useCallback(async (agentId: string) => {
    setIsLoading(true);
    try {
      const callData: CreateWebCallRequest = { 
        agent_id: agentId 
      };
      
      const result = await retellApi.createWebCall(callData);
      await refreshCalls();
      
      toast({
        title: "Success",
        description: "Web call created successfully",
      });
      
      return {
        id: result.id,
        register_url: result.register_url
      };
    } catch (err: any) {
      handleApiError(err, "create web call");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError, refreshCalls, toast]);

  const getCall = useCallback(async (callId: string) => {
    setIsLoading(true);
    try {
      const call = await retellApi.getCall(callId);
      return call;
    } catch (err: any) {
      handleApiError(err, "get call");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      
      // Add small delay to ensure everything is initialized
      setTimeout(async () => {
        try {
          // Fetch data in parallel to speed things up
          await Promise.allSettled([
            refreshAgents(),
            refreshVoices(),
            refreshLLMs(),
            refreshCalls()
          ]);
        } catch (err) {
          console.error("Error during initial data fetch:", err);
        } finally {
          setIsLoading(false);
        }
      }, 500);
    };

    fetchInitialData();
  }, [refreshAgents, refreshVoices, refreshLLMs, refreshCalls]);

  const value: RetellContextType = {
    agents,
    voices,
    llms,
    calls,
    isLoading,
    error,
    refreshAgents,
    refreshVoices,
    refreshLLMs,
    refreshCalls,
    createAgent,
    createWebCall,
    getCall
  };

  return <RetellContext.Provider value={value}>{children}</RetellContext.Provider>;
};

export const useRetell = () => {
  const context = useContext(RetellContext);
  if (context === undefined) {
    throw new Error("useRetell must be used within a RetellProvider");
  }
  return context;
};
