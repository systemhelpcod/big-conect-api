'use client';

import { useDraggable } from '@dnd-kit/core';
import type { Node } from '@/types/workflow';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { NODES } from '@/lib/nodes';
import { GripVertical, Settings, Trash2 } from 'lucide-react';
import { WebhookDialog } from '@/components/workflow/webhook-dialog';
import { Button } from '@/components/ui/button';

type WorkflowNodeProps = {
  data: Node;
  onDelete: (nodeId: string) => void;
};

export function WorkflowNode({ data, onDelete }: WorkflowNodeProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: data.id,
  });

  const nodeInfo = NODES.find(n => n.id === data.type || (data.type === 'trigger' && n.id ==='start'));
  const Icon = nodeInfo?.icon;
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;


  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(data.id);
  }

  return (
    <div
      ref={setNodeRef}
      style={{ position: 'absolute', top: data.position.y, left: data.position.x, ...style }}
      className="w-[240px] group"
    >
      <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-5 h-5 rounded-full bg-background border-2 border-accent transition-all group-hover:scale-110" aria-label="Input handle" />
      <Card className="shadow-lg hover:shadow-primary/20 transition-shadow">
        <CardHeader className="flex flex-row items-center gap-3 p-3">
          <div {...listeners} {...attributes} className="flex h-10 w-10 items-center justify-center rounded-md bg-muted border shrink-0 cursor-grab touch-none">
            {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
          </div>
          <CardTitle className="text-sm font-semibold truncate flex-1">{data.name}</CardTitle>
          
          {data.type !== 'webhook' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}

          {data.type === 'webhook' && <WebhookDialog />}

          <div className="p-1">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>
      <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-5 h-5 rounded-full bg-accent border-2 border-background transition-all group-hover:scale-110" aria-label="Output handle" />
    </div>
  );
}
