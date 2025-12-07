'use client';

import { useState } from 'react';
import { suggestNextNode } from '@/ai/flows/suggest-next-node';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AISuggester() {
  const [suggestion, setSuggestion] = useState<{ suggestedNode: string; reasoning: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggestion = async () => {
    setIsLoading(true);
    setSuggestion(null);

    // In a real app, this would be dynamic
    const workflowContext = JSON.stringify({
      nodes: ['Start', 'Webhook'],
      connections: [{ from: 'Start', to: 'Webhook' }],
    });
    const dataPreview = JSON.stringify({ user: { id: 1, name: 'John Doe', email: 'john@example.com' } });

    try {
      const result = await suggestNextNode({ workflowContext, dataPreview });
      setSuggestion(result);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not fetch a suggestion at this time.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover onOpenChange={(open) => !open && setSuggestion(null)}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleSuggestion}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bot className="mr-2 h-4 w-4" />
          )}
          AI Suggestion
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        {isLoading && (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )}
        {suggestion && (
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none flex items-center">
                <Sparkles className="h-4 w-4 mr-2 text-accent" />
                Suggested Next Node
              </h4>
              <p className="text-lg font-semibold text-primary">{suggestion.suggestedNode}</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Reasoning</h4>
              <p className="text-sm text-muted-foreground">
                {suggestion.reasoning}
              </p>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
