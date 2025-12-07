export type Node = {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
};

export type Connection = {
  from: { nodeId: string; handle: 'output' };
  to: { nodeId: string; handle: 'input' };
};
