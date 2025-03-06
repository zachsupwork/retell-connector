
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRetell } from "@/context/RetellContext";
import { Users, Mic, Brain, PhoneCall, RefreshCcw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, loading = false }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-7 w-1/2" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { agents, voices, llms, calls, isLoading, refreshAgents, refreshVoices, refreshLLMs, refreshCalls } = useRetell();
  const [activeCalls, setActiveCalls] = useState(0);

  useEffect(() => {
    // Calculate active calls
    const active = calls.filter(call => call.status === "in_progress").length;
    setActiveCalls(active);
  }, [calls]);

  const handleRefresh = async () => {
    await Promise.all([refreshAgents(), refreshVoices(), refreshLLMs(), refreshCalls()]);
  };

  // Last 7 days call data (sample data for demo)
  const callData = [
    { name: "Day 1", calls: 5 },
    { name: "Day 2", calls: 8 },
    { name: "Day 3", calls: 12 },
    { name: "Day 4", calls: 7 },
    { name: "Day 5", calls: 10 },
    { name: "Day 6", calls: 15 },
    { name: "Day 7", calls: 18 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Agents"
          value={agents.length}
          description="Active voice agents"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <StatCard
          title="Available Voices"
          value={voices.length}
          description="Voices for agents"
          icon={<Mic className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <StatCard
          title="Available LLMs"
          value={llms.length}
          description="Language models"
          icon={<Brain className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
        <StatCard
          title="Active Calls"
          value={activeCalls}
          description="Currently in progress"
          icon={<PhoneCall className="h-4 w-4 text-muted-foreground" />}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Call statistics for the past week</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={callData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="calls" fill="#9b87f5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button asChild className="w-full">
                  <Link to="/agents/new">Create New Agent</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/calls/new">Start New Call</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/agents">View All Agents</Link>
                </Button>
                <Button asChild variant="secondary" className="w-full">
                  <Link to="/calls">View Call History</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
