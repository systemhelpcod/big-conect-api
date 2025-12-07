import type { LucideIcon } from 'lucide-react';
import React from 'react';
import { 
    Webhook, 
    Code2, 
    Zap, 
    Timer, 
    Settings2, 
    ListTodo,
    Play,
    GitBranch,
} from 'lucide-react';
import { MySQLIcon, PostgreSQLIcon, MongoDBIcon, WhatsAppIcon, SQLiteIcon } from '@/components/icons/custom-icons';

export type NodeTypeInfo = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  type: 'trigger' | 'action' | 'logic';
};

export const NODES: NodeTypeInfo[] = [
  // Triggers
  { 
    id: 'start', 
    name: 'Start', 
    description: 'The starting point of your workflow.', 
    icon: Play, 
    type: 'trigger' 
  },
  { 
    id: 'webhook', 
    name: 'Webhook', 
    description: 'Trigger via a custom URL.', 
    icon: Webhook, 
    type: 'trigger' 
  },
  { 
    id: 'cron', 
    name: 'Schedule', 
    description: 'Run workflow on a schedule.', 
    icon: Timer, 
    type: 'trigger' 
  },
  
  // Actions
  { 
    id: 'httpRequest', 
    name: 'HTTP Request', 
    description: 'Call any API or endpoint.', 
    icon: Zap, 
    type: 'action' 
  },
  { 
    id: 'whatsapp', 
    name: 'WhatsApp', 
    description: 'Send WhatsApp messages.', 
    icon: WhatsAppIcon, 
    type: 'action' 
  },
  { 
    id: 'mysql', 
    name: 'MySQL', 
    description: 'Query a MySQL database.', 
    icon: MySQLIcon, 
    type: 'action' 
  },
  { 
    id: 'postgres', 
    name: 'PostgreSQL', 
    description: 'Query a PostgreSQL database.', 
    icon: PostgreSQLIcon, 
    type: 'action' 
  },
  { 
    id: 'mongodb', 
    name: 'MongoDB',
    description: 'Query a MongoDB database.', 
    icon: MongoDBIcon, 
    type: 'action' 
  },
  { 
    id: 'sqlite', 
    name: 'SQLite',
    description: 'Query a SQLite database.', 
    icon: SQLiteIcon, 
    type: 'action' 
  },
  { 
    id: 'queue', 
    name: 'Task Queue', 
    description: 'Add a job to a queue.', 
    icon: ListTodo, 
    type: 'action' 
  },

  // Logic
  { 
    id: 'function', 
    name: 'Function', 
    description: 'Run custom JavaScript code.', 
    icon: Code2, 
    type: 'logic' 
  },
  { 
    id: 'set', 
    name: 'Set', 
    description: 'Manipulate and set data.', 
    icon: Settings2, 
    type: 'logic' 
  },
  { 
    id: 'if', 
    name: 'If', 
    description: 'Branch your workflow.', 
    icon: GitBranch, 
    type: 'logic' 
  },
  { 
    id: 'delay', 
    name: 'Delay', 
    description: 'Wait for a period of time.', 
    icon: Timer, 
    type: 'logic' 
  },
];
