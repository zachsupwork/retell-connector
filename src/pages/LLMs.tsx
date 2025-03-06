
import React from "react";
import { useRetell } from "@/context/RetellContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const LLMs = () => {
  const { llms, isLoading, refreshLLMs } = useRetell();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Available Language Models</h1>
        <Button variant="outline" size="sm" onClick={refreshLLMs} disabled={isLoading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LLM Library</CardTitle>
        </CardHeader>
        <CardContent>
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
                No language models were found in your Retell account.
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
