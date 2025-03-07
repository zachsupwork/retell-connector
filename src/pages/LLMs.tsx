
import React, { useEffect } from "react";
import { useRetell } from "@/context/RetellContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const LLMs = () => {
  const { llms, isLoading, error, refreshLLMs } = useRetell();

  // Ensure LLMs are loaded when component mounts
  useEffect(() => {
    if (llms.length === 0 && !isLoading && !error) {
      refreshLLMs().catch(err => {
        console.error("Error in initial LLM fetch:", err);
      });
    }
  }, [llms.length, isLoading, error, refreshLLMs]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Available Language Models</h1>
        <Button variant="outline" size="sm" onClick={refreshLLMs} disabled={isLoading}>
          <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LLM Library</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Error loading language models</p>
                <p className="mt-1">{error}</p>
              </div>
            </div>
          )}
          
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : llms.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No language models available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {error ? "There was an error fetching LLMs from the Retell API." : "No language models were found in your Retell account."}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>LLM ID</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {llms.map((llm) => (
                    <TableRow key={llm.id}>
                      <TableCell className="font-medium">{llm.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{llm.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {llm.id}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(llm.created_at).toLocaleDateString()}</TableCell>
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

export default LLMs;
