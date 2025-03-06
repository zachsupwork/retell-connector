
import React from "react";
import { useRetell } from "@/context/RetellContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCcw, Play, Pause } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Voices = () => {
  const { voices, isLoading, refreshVoices } = useRetell();
  const [playingVoice, setPlayingVoice] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlaySample = (voiceId: string) => {
    // This is a placeholder. In a real application, you would have sample audio URLs
    // or use the Retell API to generate a sample if available
    if (playingVoice === voiceId) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingVoice(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // Simulate playing a voice sample
      setPlayingVoice(voiceId);
      setTimeout(() => {
        setPlayingVoice(null);
      }, 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Available Voices</h1>
        <Button variant="outline" size="sm" onClick={refreshVoices} disabled={isLoading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice Library</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : voices.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium">No voices available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No voices were found in your Retell account.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Voice ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {voices.map((voice) => (
                    <TableRow key={voice.id}>
                      <TableCell className="font-medium">{voice.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {voice.id}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(voice.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePlaySample(voice.id)}
                        >
                          {playingVoice === voice.id ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Stop Sample
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Play Sample
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <audio ref={audioRef} style={{ display: 'none' }} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Voices;
