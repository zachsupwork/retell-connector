
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useRetell } from "@/context/RetellContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw, Plus, Phone, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Calls = () => {
  const { calls, agents, isLoading, refreshCalls, error } = useRetell();
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState(0);
  const { toast } = useToast();

  const isRateLimitError = error?.includes("429") || error?.includes("Too many requests");

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : "Unknown Agent";
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "-";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return <Badge className="bg-green-500">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRefresh = async () => {
    if (refreshing) return;
    
    // Rate limiting protection - don't allow refreshing more than once every 5 seconds
    const now = Date.now();
    if (now - lastRefreshAttempt < 5000) {
      toast({
        title: "Please wait",
        description: "To avoid rate limiting, please wait a moment before refreshing again",
        variant: "default"
      });
      return;
    }
    
    setRefreshing(true);
    setLastRefreshAttempt(now);
    
    try {
      await refreshCalls();
      if (!isRateLimitError) {
        toast({
          title: "Success",
          description: "Call list refreshed successfully",
        });
      }
    } catch (err) {
      console.error("Error refreshing calls:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial fetch with rate limiting protection
  useEffect(() => {
    if (calls.length === 0 && !isLoading && !error) {
      const now = Date.now();
      if (now - lastRefreshAttempt > 5000) {
        setLastRefreshAttempt(now);
        refreshCalls().catch(err => {
          console.error("Error in initial call fetch:", err);
        });
      }
    }
  }, [calls.length, isLoading, error, refreshCalls, lastRefreshAttempt]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isLoading || refreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button asChild size="sm">
            <Link to="/calls/new">
              <Plus className="h-4 w-4 mr-2" />
              New Call
            </Link>
          </Button>
        </div>
      </div>

      {isRateLimitError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Rate Limit Exceeded</AlertTitle>
          <AlertDescription>
            Retell API Error: 429 Too many requests, please try again later.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>
            View and manage your recent voice calls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !isRateLimitError && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <span className="ml-3 text-muted-foreground">Loading calls...</span>
            </div>
          ) : calls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-8 w-8 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No calls found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {isRateLimitError 
                  ? "Unable to load calls due to rate limiting. Please try again later."
                  : "Start your first call to see your call history here."}
              </p>
              <Button asChild className="mt-4">
                <Link to="/calls/new">Start a New Call</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id} className="group">
                      <TableCell>{new Date(call.created_at).toLocaleString()}</TableCell>
                      <TableCell>{getAgentName(call.agent_id)}</TableCell>
                      <TableCell>
                        {call.status === "in_progress" ? (
                          <span className="call-status-active flex items-center">
                            {getStatusBadge(call.status)}
                          </span>
                        ) : (
                          getStatusBadge(call.status)
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDuration(call.duration)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link to={`/calls/${call.id}`}>View Details</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Calls;
