'use client'

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Loader2, Settings, Check, Terminal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getWebhookData } from '@/ai/flows/webhook-flow';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function WebhookDialog() {
  const [isListening, setIsListening] = useState(false);
  const [data, setData] = useState<object | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLocal, setIsLocal] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const localCurlCommand = `curl -X POST http://localhost:9002/api/webhook -H "Content-Type: application/json" -d '{"key": "value"}'`;

  useEffect(() => {
    // Generate the full webhook URL based on the current window location.
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/api/webhook`;
      setWebhookUrl(url);
      setIsLocal(window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1'));
    }
  }, []);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsListening(false);
  };
  
  const handleListen = () => {
    setIsListening(true);
    setData(null);

    pollingIntervalRef.current = setInterval(async () => {
        try {
            const result = await getWebhookData();
            if (result && Object.keys(result).length > 0) {
                setData(result);
                stopPolling();
            }
        } catch (error) {
            console.error('Error polling for webhook data:', error);
            stopPolling();
        }
    }, 2000);
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard!" });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
          variant: "destructive",
          title: "Failed to copy",
          description: "Could not copy the text to your clipboard.",
      });
    });
  };

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => stopPolling();
  }, []);

  return (
    <Dialog onOpenChange={(isOpen) => !isOpen && stopPolling()}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Webhook Settings</DialogTitle>
          <DialogDescription>
            Configure your webhook trigger. Use the URL to send data to your workflow.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <h4 className="font-medium">Webhook URL</h4>
                <div className="flex items-center gap-2">
                    <Input id="webhook-url" value={webhookUrl} readOnly />
                    <Button variant="outline" size="icon" onClick={() => handleCopy(webhookUrl)} title="Copy URL">
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">Send a POST request to this URL to trigger your workflow.</p>
            </div>
            
            {isLocal && (
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Local Testing</AlertTitle>
                <AlertDescription className="mt-2">
                  <p>To test locally, run this curl command in your terminal. Your app is running on port 9002.</p>
                  <div className="mt-2 flex items-center gap-2 bg-muted p-2 rounded-md">
                    <code className="text-sm flex-1 overflow-x-auto">{localCurlCommand}</code>
                    <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleCopy(localCurlCommand)} title="Copy Command">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
                <h4 className="font-medium">Test Event</h4>
                <div className='flex gap-2'>
                    <Button onClick={handleListen} disabled={isListening}>
                        {isListening && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isListening ? "Listening..." : "Listen for Test Event"}
                    </Button>
                    {isListening && (
                        <Button onClick={stopPolling} variant="outline">Stop Listening</Button>
                    )}
                </div>
            </div>

            { (isListening || data) && 
            <div className="space-y-2">
                <h4 className="font-medium">Captured Data</h4>
                <ScrollArea className="h-64 w-full rounded-md border p-4 bg-muted/50">
                    {isListening && <div className="flex items-center justify-center h-full text-muted-foreground">Waiting for data...</div>}
                    {data && (
                        <pre className="text-sm text-foreground">
                            <code>{JSON.stringify(data, null, 2)}</code>
                        </pre>
                    )}
                </ScrollArea>
            </div>
            }

        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
