'use client';

import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { NodesSidebar } from '@/components/layout/nodes-sidebar';
import { WorkflowCanvas } from '@/components/workflow/canvas';
import type { Node, Connection } from '@/types/workflow';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';

const initialNodes: Node[] = [
  {
    id: 'start-1',
    type: 'trigger',
    name: 'Start',
    position: { x: 50, y: 200 },
  },
  {
    id: 'webhook-1',
    type: 'webhook',
    name: 'Listen for Webhook',
    position: { x: 350, y: 150 },
  },
  {
    id: 'set-1',
    type: 'set',
    name: 'Set Name',
    position: { x: 650, y: 250 },
  },
];

const initialConnections: Connection[] = [
  { from: { nodeId: 'start-1', handle: 'output' }, to: { nodeId: 'webhook-1', handle: 'input' } },
  { from: { nodeId: 'webhook-1', handle: 'output' }, to: { nodeId: 'set-1', handle: 'input' } },
];


export default function Home() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);

  const addNode = useCallback((nodeType: string, name: string, type: 'trigger' | 'action' | 'logic') => {
    const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type,
        name,
        position: { x: Math.random() * 600 + 100, y: Math.random() * 300 + 50 },
    };
    setNodes((prevNodes) => [...prevNodes, newNode]);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((prevNodes) => prevNodes.filter(node => node.id !== nodeId));
    setConnections((prevConnections) => 
      prevConnections.filter(conn => conn.from.nodeId !== nodeId && conn.to.nodeId !== nodeId)
    );
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const nodeId = active.id as string;

    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } }
          : node
      )
    );
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <NodesSidebar onNodeSelect={addNode} />
          <main className="flex-1 h-full flex flex-col relative">
            <WorkflowCanvas nodes={nodes} connections={connections} deleteNode={deleteNode} />
          </main>
        </div>
      </div>
    </DndContext>
  );
}
