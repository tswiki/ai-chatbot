

import 'server-only';

import { interactiveSessionTool } from '../augmented_query';

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue,
} from 'ai/rsc';

import { openai } from '@ai-sdk/openai';

import { BotMessage, SystemMessage } from '@/components/stocks';
import { z } from 'zod';

import { nanoid } from '@/lib/utils';

import { saveChat } from '@/app/actions';
import { SpinnerMessage, UserMessage } from '@/components/stocks/message';
import { Chat, Message } from '@/lib/types';
import { auth } from '@/auth';

function isChat(obj: any): obj is Chat {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'createdAt' in obj &&
    'userId' in obj &&
    'path' in obj &&
    'messages' in obj &&
    Array.isArray(obj.messages)
  );
}

// Extend the type of createAI to include tools
interface CreateAIOptions {
  actions: {
    submitUserMessage: (content: string) => Promise<{ id: string; display: React.ReactNode }>;
  };
  initialAIState: AIState;
  initialUIState: UIState;
  onGetUIState: () => Promise<UIState | undefined>;
  onSetAIState: ({ state }: { state: AIState }) => Promise<void>;
  tools?: Record<string, any>; // Add the optional tools property
}

async function submitUserMessage(content: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  // Update the AI state with the user's message
  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content,
      },
    ],
  });

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode;
  
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const result = await streamUI({
        model: openai('gpt-4o'), // Adjust the model if needed
        initial: <SpinnerMessage />,
        system: `
        You are "Creators' Library," a creator economy data instrumentation assistant. Your goal is to provide quick, actionable solutions tailored to the user's needs, ensuring a seamless interaction.

        **Primary Goal:**  
        - Quickly display key insights from the backend's initial response.
        - Use tools to gather additional context and data if required, especially using the 'interactiveSessionTool' for complex queries.
        - Provide a final, fully contextualized answer based on the initial data and tool-generated insights.

        **Handling Responses:**  
        - **Initial Thoughts:** Begin by sharing an initial summary or thought process based on the input query to set the context.
        - **Tool Response:** Use 'interactiveSessionTool' for real-time data. Incorporate the response into your final answer to ensure accuracy and relevance.
        - **Final Response:** After receiving data from the tool, synthesize a comprehensive response formatted as per the user's query. 

        **Handling Asynchronous Data:**  
        - When receiving partial data, display it immediately to the user.
        - Show a "Processing..." indicator or a loading animation for sections still being processed by the backend.
        - Continuously poll or use WebSockets to stream data as the backend completes further processing.

        **User Guidance:**  
        - Break down complex concepts into small, understandable chunks.
        - Notify the user if additional information is required for a more detailed response.
        - For long-running tasks (e.g., detailed script creation), keep the user updated on progress and estimated completion time.

        **Response Format:**  
        - Start with **Initial Thoughts** for context.
        - Follow up with **Tool Response** to integrate real-time data from the backend.
        - Conclude with a **Final Response** that answers the user's query in detail and in the format they requested.

        Use the following tool to enhance your responses:
        - 'interactiveSessionTool': Provides real-time data from the backend via HTTP request. Ensure its usage for accurate and contextualized information.
        `,
        messages: [
          ...aiState.get().messages,
          {
            role: 'system',
            content: `
              You have access to the tool 'interactiveSessionTool' to fetch information to ensure the accuracy and relevance of the generated information. 
              Use it to generate responses based on real-time data from the backend.
            `,
          },
        ],
        text: ({ content, done, delta }) => {
          if (!textStream) {
            textStream = createStreamableValue('');
            textNode = <BotMessage content={textStream.value} />;
          }

          if (done) {
            textStream.done();
            aiState.update({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content,
                },
              ],
            });
          } else {
            textStream.update(delta);
          }

          return textNode;
        },
        tools: {
          interactiveSessionTool: {
            description: 'Interact with the HTTP endpoint for complex data queries to ensure that the information generated and returned is accurate.',
            parameters: z.object({
              session_id: z.string().describe('The session ID for the HTTP request.'),
              query: z.string().describe('The user query to send to the HTTP endpoint.'),
            }),
            generate: async ({ session_id, query }: { session_id: string; query: string }) => {
              try {
                const result = await interactiveSessionTool(session_id, query); // Use the interactiveSessionTool here
                
                if (typeof result === 'string') {
                  // It's an error message
                  aiState.update({
                    ...aiState.get(),
                    messages: [
                      ...aiState.get().messages,
                      {
                        id: nanoid(),
                        role: 'assistant',
                        content: result,
                      },
                    ],
                  });
                  return result;
                } else if ('response' in result) {
                  // Update AI state with tool response
                  aiState.update({
                    ...aiState.get(),
                    messages: [
                      ...aiState.get().messages,
                      {
                        id: nanoid(),
                        role: 'assistant',
                        content: `Tool Response: ${result.response}`,
                      },
                    ],
                  });
                  return `Tool Response: ${result.response}`;
                }
              } catch (error) {
                console.error('HTTP request interaction failed:', error);
                return 'Error: Could not process the HTTP request.';
              }
            },
          },
        },
      });

      return {
        id: nanoid(),
        display: result.value,
      };
    } catch (error: any) {
      console.error(`Attempt ${retries + 1} failed:`, error);
      retries++;
      if (retries === maxRetries) {
        console.error('Max retries reached. Returning error message.');
        let errorMessage = 'An error occurred. Please try again later.';
        if (error.message && error.message.includes('Pipeline is empty')) {
          errorMessage = 'The AI system is currently unavailable. Please try again in a few minutes.';
        } else if (error.name === 'NetworkError' || !navigator.onLine) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        return {
          id: nanoid(),
          display: <SystemMessage>{errorMessage}</SystemMessage>,
        };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
    }
  }
}

export type AIState = {
  chatId: string;
  messages: Message[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialAIState: { chatId: nanoid(), messages: [] },
  initialUIState: [],
  onGetUIState: async () => {
    'use server';

    const session = await auth();

    if (session && session.user) {
      const aiState = getAIState() as Chat;

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState);
        return uiState;
      }
    } else {
      return;
    }
  },
  onSetAIState: async ({ state }) => {
    'use server';

    const session = await auth();

    if (session && session.user) {
      const { chatId, messages } = state;

      const createdAt = new Date();
      const userId = session.user.id as string;
      const path = `/chat/${chatId}`;

      const firstMessageContent = messages[0].content as string;
      const title = firstMessageContent.substring(0, 100);

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path,
      };

      await saveChat(chat);
    } else {
      return;
    }
  },
} as CreateAIOptions);

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter((message) => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' && typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null,
    }));
};
