
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRetell } from "@/context/RetellContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Phone, Mic, Brain } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const NewCall = () => {
  const { agents, isLoading, createWebCall } = useRetell();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartCall = async () => {
    if (!selectedAgentId) {
      toast({
        title: "Agent Required",
        description: "Please select an agent to start a call with.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const callData = await createWebCall(selectedAgentId);
      
      // Open new window with register URL
      window.open(callData.register_url, "_blank");
      
      toast({
        title: "Call Initiated",
        description: "Web call window has been opened. Please allow microphone access.",
      });
      
      // Navigate to call history
      navigate("/calls");
    } catch (error) {
      console.error("Error starting call:", error);
      toast({
        title: "Call Failed",
        description: "Failed to start call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Start New Call</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Web Call</CardTitle>
          <CardDescription>
            Start a new web call with one of your voice agents. Ensure your microphone is connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent">Select Agent</Label>
            <Select
              value={selectedAgentId}
              onValueChange={setSelectedAgentId}
              disabled={isLoading || agents.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {agents.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No agents available. Please create an agent first.
              </p>
            )}
          </div>
          
          {selectedAgentId && (
            <div className="bg-muted p-4 rounded-md mt-6">
              <div className="text-sm font-medium">Call Information</div>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-retell-secondary" />
                  <span>Web call will open in a new browser window</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-retell-secondary" />
                  <span>Microphone access will be required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-retell-secondary" />
                  <span>Agent will respond to your voice inputs</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/calls")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleStartCall}
            disabled={isSubmitting || isLoading || !selectedAgentId}
          >
            {isSubmitting ? "Connecting..." : "Start Call"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewCall;
