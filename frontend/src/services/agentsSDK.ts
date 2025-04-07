import { OpenAIAgent as OriginalOpenAIAgent, AgentOptions, CompletionResult, CreateChatCompletionOptions } from 'openai-agents';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI API key from environment variable
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

/**
 * Browser-compatible wrapper for OpenAI Agents SDK
 * This implementation provides a compatible interface while working in browser environments
 */
export class OpenAIAgent {
  private openai: OpenAI;
  private options: AgentOptions;
  private chatHistory: Record<string, ChatCompletionMessageParam[]> = {};

  constructor(options: AgentOptions, config: { apiKey: string }) {
    this.options = options;
    this.openai = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    });
  }

  async createChatCompletion(input: string, completionOptions?: CreateChatCompletionOptions): Promise<CompletionResult> {
    try {
      console.log('Creating chat completion with input:', input);
      console.log('Using API key:', this.openai.apiKey ? 'API key is set' : 'API key is not set');
      
      const response = await this.openai.chat.completions.create({
        model: this.options.model as string,
        messages: [
          { role: 'system', content: this.options.system_instruction as string },
          { role: 'user', content: input }
        ],
        temperature: this.options.temperature || 0.7,
        top_p: this.options.top_p || 0.9
      });

      const content = response.choices[0]?.message.content || "No response generated";
      console.log('Received response:', content);
      
      return { 
        choices: [content],
        total_usage: { 
          completion_tokens: response.usage?.completion_tokens || 0, 
          prompt_tokens: response.usage?.prompt_tokens || 0, 
          total_tokens: response.usage?.total_tokens || 0 
        },
        completion_messages: [
          { role: 'assistant', content }
        ],
        completions: []
      };
    } catch (error) {
      console.error('Error creating chat completion:', error);
      return { 
        choices: ["Error: Unable to generate response"],
        total_usage: { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 },
        completion_messages: [],
        completions: []
      };
    }
  }

  async getChatHistory(userId: string): Promise<ChatCompletionMessageParam[]> {
    return this.chatHistory[userId] || [];
  }

  async deleteChatHistory(userId: string): Promise<boolean> {
    if (this.chatHistory[userId]) {
      delete this.chatHistory[userId];
      return true;
    }
    return false;
  }
}

/**
 * Create an agent with the specified instructions and tools
 * 
 * @param instructions - Instructions for the agent
 * @param tools - Array of tools for the agent to use
 * @returns The created agent
 */
export const createAgent = (instructions: string, tools: any[] = []): OpenAIAgent => {
  const agentOptions: AgentOptions = {
    model: "gpt-3.5-turbo", // Using a standard OpenAI model
    system_instruction: instructions,
    temperature: 0.7,
    top_p: 0.9,
  };

  return new OpenAIAgent(agentOptions, {
    apiKey: OPENAI_API_KEY,
  });
};

/**
 * Run an agent with the specified input
 * 
 * @param agent - The agent to run
 * @param input - The input to provide to the agent
 * @returns The result of running the agent
 */
export const runAgent = async (agent: OpenAIAgent, input: string): Promise<string> => {
  try {
    console.log('Running agent with input:', input);
    const result: CompletionResult = await agent.createChatCompletion(input);
    console.log('Agent run result:', result.choices[0]);
    return result.choices[0] || "No response generated";
  } catch (error) {
    console.error('Error running agent:', error);
    throw error;
  }
};

/**
 * Stream agent responses
 * 
 * @param agent - The agent to run
 * @param input - The input to provide to the agent
 * @param onUpdate - Callback function for streaming updates
 */
export const streamAgent = async (agent: OpenAIAgent, input: string, onUpdate: (content: string) => void): Promise<string> => {
  try {
    const result: CompletionResult = await agent.createChatCompletion(input);
    const response = result.choices[0] || "No response generated";
    onUpdate(response);
    return response;
  } catch (error) {
    console.error('Error streaming agent:', error);
    throw error;
  }
};

/**
 * Get chat history for a user
 * 
 * @param agent - The agent to get history from
 * @param userId - The user ID to get history for
 * @returns The chat history
 */
export const getChatHistory = async (agent: OpenAIAgent, userId: string): Promise<ChatCompletionMessageParam[]> => {
  try {
    return await agent.getChatHistory(userId);
  } catch (error) {
    console.error('Error getting chat history:', error);
    return [];
  }
};

/**
 * Delete chat history for a user
 * 
 * @param agent - The agent to delete history from
 * @param userId - The user ID to delete history for
 * @returns Whether the deletion was successful
 */
export const deleteChatHistory = async (agent: OpenAIAgent, userId: string): Promise<boolean> => {
  try {
    return await agent.deleteChatHistory(userId);
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return false;
  }
};

// Create a named export object for better compatibility
const agentsSDK = {
  createAgent,
  runAgent,
  streamAgent,
  getChatHistory,
  deleteChatHistory
};

export default agentsSDK;
