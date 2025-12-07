'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate a description of a workflow.
 *
 * It takes a JSON representation of a workflow as input and returns a human-readable description.
 * - generateWorkflowDescription: The main function to generate the description.
 * - WorkflowDescriptionInput: The input type for the workflow description.
 * - WorkflowDescriptionOutput: The output type for the workflow description.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WorkflowDescriptionInputSchema = z.object({
  workflowJson: z
    .string()
    .describe('A JSON representation of the workflow to be described.'),
});

export type WorkflowDescriptionInput = z.infer<typeof WorkflowDescriptionInputSchema>;

const WorkflowDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A human-readable description of the workflow.'),
});

export type WorkflowDescriptionOutput = z.infer<typeof WorkflowDescriptionOutputSchema>;

export async function generateWorkflowDescription(
  input: WorkflowDescriptionInput
): Promise<WorkflowDescriptionOutput> {
  return generateWorkflowDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWorkflowDescriptionPrompt',
  input: {schema: WorkflowDescriptionInputSchema},
  output: {schema: WorkflowDescriptionOutputSchema},
  prompt: `You are an AI expert in understanding and documenting complex workflows.
  Given the following JSON representation of a workflow, generate a concise and human-readable description of what the workflow does.
  The description should be easy to understand for someone who is not familiar with the workflow.
  Do not include any technical details, focus on the high-level functionality.

  Workflow JSON:
  {{workflowJson}}`,
});

const generateWorkflowDescriptionFlow = ai.defineFlow(
  {
    name: 'generateWorkflowDescriptionFlow',
    inputSchema: WorkflowDescriptionInputSchema,
    outputSchema: WorkflowDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
