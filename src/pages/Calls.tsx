
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useRetell } from "@/context/RetellContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw, Plus, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Calls = () => {
  const { calls, agents, isLoading, refreshCalls } = useRetell();
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent ? agent.name : "Unknown Agent";
  };

  const formatDuration = (seconds: number) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshCalls} disabled={isLoading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button asChild size="sm">
            <Link to="/calls/new">
              <Plus className="h-4 w-4 mr-2" />
              New Call
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Calls</CardTitle>
          <CardDescription>
            View and manage your recent voice calls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="h-8 w-8 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No calls found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start your first call to see your call history here.
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
                        {call.duration !== null ? formatDuration(call.duration) : "-"}
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
