import { config } from 'dotenv';
config();

import '@/ai/flows/generate-workflow-description.ts';
import '@/ai/flows/suggest-next-node.ts';
import '@/ai/flows/webhook-flow.ts';
