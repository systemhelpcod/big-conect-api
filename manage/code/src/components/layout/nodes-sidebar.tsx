'use client'

import { useState } from 'react';
import { NODES } from '@/lib/nodes';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';

type NodesSidebarProps = {
  onNodeSelect: (id: string, name: string, type: 'trigger' | 'action' | 'logic') => void;
};

export function NodesSidebar({ onNodeSelect }: NodesSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = NODES.filter(node =>
    node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderNodeList = (type: 'trigger' | 'action' | 'logic') => {
    const nodes = filteredNodes.filter(node => node.type === type);
    if (nodes.length === 0) {
      return <div className="p-4 text-center text-sm text-muted-foreground">No nodes found.</div>
    }
    return (
      <div className="grid grid-cols-1 gap-2 p-2">
        {nodes.map(node => (
          <button
            key={node.id}
            onClick={() => onNodeSelect(node.id, node.name, node.type)}
            className="flex items-center gap-3 p-2 rounded-md text-left transition-colors hover:bg-muted cursor-grab active:cursor-grabbing"
            title={`Add "${node.name}" node`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background border">
                <node.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            <div>
                <p className="font-semibold text-sm">{node.name}</p>
                <p className="text-xs text-muted-foreground">{node.description}</p>
            </div>
          </button>
        ))}
      </div>
    )
  };

  return (
    <aside className="w-80 border-r bg-card flex flex-col shrink-0">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search nodes..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <Tabs defaultValue="action" className="flex-1 flex flex-col">
        <TabsList className="m-2">
          <TabsTrigger value="trigger" className="flex-1">Triggers</TabsTrigger>
          <TabsTrigger value="action" className="flex-1">Actions</TabsTrigger>
          <TabsTrigger value="logic" className="flex-1">Logic</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
            <TabsContent value="trigger">{renderNodeList('trigger')}</TabsContent>
            <TabsContent value="action">{renderNodeList('action')}</TabsContent>
            <TabsContent value="logic">{renderNodeList('logic')}</TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
