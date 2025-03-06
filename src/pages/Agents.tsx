
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useRetell } from "@/context/RetellContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, Plus, Phone, Mic, Brain } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

const Agents = () => {
  const { agents, voices, llms, isLoading, refreshAgents, createWebCall } = useRetell();
  const [callingAgentId, setCallingAgentId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStartCall = async (agentId: string) => {
    try {
      setCallingAgentId(agentId);
      const callData = await createWebCall(agentId);
      
      // Open new window with register URL
      window.open(callData.register_url, "_blank");
      
      toast({
        title: "Call Initiated",
        description: "Web call window has been opened. Please allow microphone access.",
      });
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Call Failed",
        description: "Failed to start call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCallingAgentId(null);
    }
  };

  const getVoiceName = (voiceId: string) => {
    const voice = voices.find(v => v.id === voiceId);
    return voice ? voice.name : "Unknown Voice";
  };

  const getLLMName = (llmId: string) => {
    const llm = llms.find(l => l.id === llmId);
    return llm ? llm.name : "Unknown LLM";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Voice Agents</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshAgents} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link to="/agents/new">
              <Plus className="h-4 w-4 mr-2" />
              New Agent
            </Link>
          </Button>
        </div>
      </div>

      {isLoading && agents.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Agents Found</CardTitle>
            <CardDescription>
              You don't have any voice agents yet. Create your first agent to get started.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link to="/agents/new">Create New Agent</Link>
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <Card key={agent.id}>
              <CardHeader>
                <CardTitle>{agent.name}</CardTitle>
                <CardDescription>
                  Created: {new Date(agent.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-retell-secondary" />
                    <span>Voice: {getVoiceName(agent.voice_id)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-retell-secondary" />
                    <span>LLM: {getLLMName(agent.llm_id)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="default"
                  onClick={() => handleStartCall(agent.id)}
                  disabled={callingAgentId === agent.id}
                >
                  {callingAgentId === agent.id ? (
                    "Connecting..."
                  ) : (
                    <>
                      <Phone className="h-4 w-4 mr-2" />
                      Start Web Call
                    </>
                  )}
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/agents/${agent.id}`}>Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Agents;
