import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Save, Play, ChevronDown, Bot } from 'lucide-react';
import { AISuggester } from '@/components/workflow/ai-suggester';

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between px-4 lg:px-6 border-b bg-card/80 backdrop-blur-sm shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-headline font-bold text-foreground">BIG Conect</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-4">
            <span>My Workflow</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
                <ChevronDown className="h-4 w-4" />
            </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AISuggester />
        <Button variant="outline" size="sm"><Save className="mr-2 h-4 w-4" /> Save</Button>
        <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"><Play className="mr-2 h-4 w-4" /> Execute Workflow</Button>
      </div>
    </header>
  );
}
