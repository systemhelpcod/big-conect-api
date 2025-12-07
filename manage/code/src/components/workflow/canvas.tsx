'use client';

import { useRef, useState } from 'react';
import type { Node as NodeType, Connection } from '@/types/workflow';
import { WorkflowNode } from '@/components/workflow/node';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WorkflowCanvasProps = {
  nodes: NodeType[];
  connections: Connection[];
  deleteNode: (nodeId: string) => void;
};

const NODE_WIDTH = 240;
const NODE_HEIGHT = 72;

export function WorkflowCanvas({ nodes, connections, deleteNode }: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const getNodePosition = (nodeId: string) => nodes.find(n => n.id === nodeId)?.position;

  return (
    <div ref={canvasRef} className="flex-1 relative overflow-hidden bg-background" style={{
      backgroundImage: 'radial-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px)',
      backgroundSize: `${20 * scale}px ${20 * scale}px`,
    }}>
      <div 
        className="absolute transition-transform duration-100" 
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <svg
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ width: '1000vw', height: '1000vh' }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--accent))" />
            </marker>
          </defs>
          {connections.map((conn, index) => {
            const fromPos = getNodePosition(conn.from.nodeId);
            const toPos = getNodePosition(conn.to.nodeId);

            if (!fromPos || !toPos) return null;

            const startX = fromPos.x + NODE_WIDTH;
            const startY = fromPos.y + NODE_HEIGHT / 2;
            const endX = toPos.x;
            const endY = toPos.y + NODE_HEIGHT / 2;
            const cpx1 = startX + Math.abs(endX - startX) * 0.5;
            const cpy1 = startY;
            const cpx2 = endX - Math.abs(endX - startX) * 0.5;
            const cpy2 = endY;
            
            return (
              <path
                key={index}
                d={`M ${startX} ${startY} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${endX} ${endY}`}
                stroke="hsl(var(--accent))"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrow)"
              />
            );
          })}
        </svg>

        {nodes.map(node => (
          <WorkflowNode key={node.id} data={node} onDelete={deleteNode} />
        ))}
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2">
         <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(0.2, s - 0.1))}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="p-2 text-sm bg-card/80 rounded-md tabular-nums">{(scale * 100).toFixed(0)}%</span>
        <Button variant="outline" size="icon" onClick={() => setScale(s => Math.min(2, s + 0.1))}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
