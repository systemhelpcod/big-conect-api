'use server';

/**
 * @fileOverview This file defines Genkit flows for handling webhook data.
 *
 * - storeWebhookData: Stores incoming webhook data to a file.
 * - getWebhookData: Retrieves webhook data from the file.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const WebhookDataSchema = z.any().describe('The data received from the webhook.');
export type WebhookData = z.infer<typeof WebhookDataSchema>;

// Use a temporary file to store the webhook data to ensure persistence between requests.
const dataFilePath = path.join(os.tmpdir(), 'webhook-data.json');

export async function storeWebhookData(data: WebhookData): Promise<void> {
  return storeWebhookDataFlow(data);
}

export async function getWebhookData(): Promise<WebhookData | null> {
  return getWebhookDataFlow();
}

const storeWebhookDataFlow = ai.defineFlow(
  {
    name: 'storeWebhookDataFlow',
    inputSchema: WebhookDataSchema,
    outputSchema: z.void(),
  },
  async (data) => {
    console.log('Storing webhook data to file:', dataFilePath);
    await fs.writeJson(dataFilePath, data);
  }
);

const getWebhookDataFlow = ai.defineFlow(
  {
    name: 'getWebhookDataFlow',
    inputSchema: z.void(),
    outputSchema: WebhookDataSchema.nullable(),
  },
  async () => {
    try {
      if (await fs.pathExists(dataFilePath)) {
        console.log('Reading webhook data from file:', dataFilePath);
        const data = await fs.readJson(dataFilePath);
        
        // Remove the file after reading to ensure data is only processed once.
        await fs.remove(dataFilePath);
        
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error handling webhook data file:', error);
      // Ensure file is removed even if there's an error reading it.
      if (await fs.pathExists(dataFilePath)) {
        await fs.remove(dataFilePath);
      }
      return null;
    }
  }
);
