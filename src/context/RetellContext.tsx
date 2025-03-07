import React, { createContext, useContext, useState, useEffect } from "react";
import { createRetellAPI, RetellAgent, RetellVoice, RetellLLM, RetellCall, CreateAgentRequest } from "../services/retellApi";
import { RETELL_API_KEY } from "../config/retell";
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

  const retellApi = createRetellAPI({ apiKey: RETELL_API_KEY });

  const handleApiError = (err: any, operation: string) => {
    console.error(`Error during ${operation}:`, err);
    const message = err.message || `Failed to ${operation}`;
    setError(message);
    
    toast({
      title: "API Error",
      description: message,
      variant: "destructive"
    });
    
    sonnerToast.error("API Error", message);
  };

  const refreshAgents = async () => {
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
  };

  const refreshVoices = async () => {
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
  };

  const refreshLLMs = async () => {
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
  };

  const refreshCalls = async () => {
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
  };

  const createAgent = async (data: CreateAgentRequest) => {
    setIsLoading(true);
    try {
      const agent = await retellApi.createAgent(data);
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
  };

  const createWebCall = async (agentId: string) => {
    setIsLoading(true);
    try {
      const result = await retellApi.createWebCall({ agent_id: agentId });
      await refreshCalls();
      toast({
        title: "Success",
        description: "Web call created successfully",
      });
      return result;
    } catch (err: any) {
      handleApiError(err, "create web call");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getCall = async (callId: string) => {
    setIsLoading(true);
    try {
      const call = await retellApi.getCall(callId);
      return call as RetellCall;
    } catch (err: any) {
      handleApiError(err, "get call");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      
      const fetchPromises = [
        (async () => {
          try {
            await refreshAgents();
          } catch (err) {
            console.error("Error fetching agents:", err);
          }
        })(),
        
        (async () => {
          try {
            await refreshVoices();
          } catch (err) {
            console.error("Error fetching voices:", err);
          }
        })(),
        
        (async () => {
          try {
            await refreshLLMs();
          } catch (err) {
            console.error("Error fetching LLMs:", err);
          }
        })(),
        
        (async () => {
          try {
            await refreshCalls();
          } catch (err) {
            console.error("Error fetching calls:", err);
          }
        })()
      ];
      
      try {
        await Promise.allSettled(fetchPromises);
      } catch (err) {
        console.error("Error during initial data fetch:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

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
