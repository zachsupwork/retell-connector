
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRetell } from "@/context/RetellContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const NewAgent = () => {
  const { voices, llms, isLoading, createAgent } = useRetell();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    voice_id: "",
    llm_id: "",
    initial_message: "Hello, how can I help you today?",
    metadata: {},
    response_engine: { type: "retell_llm" }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for your agent.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.voice_id) {
      toast({
        title: "Missing Information",
        description: "Please select a voice for your agent.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.llm_id) {
      toast({
        title: "Missing Information",
        description: "Please select a language model for your agent.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newAgent = await createAgent(formData);
      toast({
        title: "Agent Created",
        description: `${newAgent.name} has been created successfully.`
      });
      navigate("/agents");
    } catch (error) {
      console.error("Error creating agent:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Create New Agent</h1>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Agent Details</CardTitle>
            <CardDescription>
              Create a new voice agent by providing the required information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="E.g., Customer Support Assistant"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="voice_id">Voice</Label>
              <Select 
                value={formData.voice_id} 
                onValueChange={(value) => handleSelectChange("voice_id", value)}
                disabled={isLoading || voices.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>{voice.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {voices.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No voices available. Please check your Retell account.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="llm_id">Language Model</Label>
              <Select 
                value={formData.llm_id} 
                onValueChange={(value) => handleSelectChange("llm_id", value)}
                disabled={isLoading || llms.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a language model" />
                </SelectTrigger>
                <SelectContent>
                  {llms.map(llm => (
                    <SelectItem key={llm.id} value={llm.id}>{llm.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {llms.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No language models available. Please check your Retell account.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="initial_message">Initial Message</Label>
              <Textarea
                id="initial_message"
                name="initial_message"
                placeholder="Hello, how can I help you today?"
                value={formData.initial_message}
                onChange={handleChange}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This message will be spoken by the agent when a call begins.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline"
              onClick={() => navigate("/agents")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting ? "Creating..." : "Create Agent"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default NewAgent;
