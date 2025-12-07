'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting the next node in a workflow.
 *
 * The flow takes the current workflow context and data as input and returns a suggestion
 * for the next node to add, leveraging a large language model (LLM).
 *
 * @interface SuggestNextNodeInput - Defines the input schema for the suggestNextNode flow.
 * @interface SuggestNextNodeOutput - Defines the output schema for the suggestNextNode flow.
 * @function suggestNextNode - The main function to trigger the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestNextNodeInputSchema = z.object({
  workflowContext: z
    .string()
    .describe('The current context of the workflow, including existing nodes and their connections.'),
  dataPreview: z
    .string()
    .describe('A preview of the data flowing through the workflow at the current stage.'),
});

export type SuggestNextNodeInput = z.infer<typeof SuggestNextNodeInputSchema>;

const SuggestNextNodeOutputSchema = z.object({
  suggestedNode: z.string().describe('The name or type of the suggested next node.'),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the node suggestion, explaining why it is relevant.'),
});

export type SuggestNextNodeOutput = z.infer<typeof SuggestNextNodeOutputSchema>;

/**
 * Suggests the next node in a workflow based on the current context and data.
 * @param input - The input containing workflow context and data preview.
 * @returns A promise resolving to the suggested node and reasoning.
 */
export async function suggestNextNode(input: SuggestNextNodeInput): Promise<SuggestNextNodeOutput> {
  return suggestNextNodeFlow(input);
}

const suggestNextNodePrompt = ai.definePrompt({
  name: 'suggestNextNodePrompt',
  input: {schema: SuggestNextNodeInputSchema},
  output: {schema: SuggestNextNodeOutputSchema},
  prompt: `Given the current workflow context:

  {{workflowContext}}

  And a preview of the data flowing through the workflow:

  {{dataPreview}}

  Suggest the most relevant next node to add to the workflow. Explain your reasoning for the suggestion.
  The suggested node should seamlessly continue the workflow's logic based on provided data and context.
  Consider factors such as data transformation, external API integration, or conditional branching. Be specific about the name of the next node.
  `,
});

const suggestNextNodeFlow = ai.defineFlow(
  {
    name: 'suggestNextNodeFlow',
    inputSchema: SuggestNextNodeInputSchema,
    outputSchema: SuggestNextNodeOutputSchema,
  },
  async input => {
    const {output} = await suggestNextNodePrompt(input);
    return output!;
  }
);
