import { OpenAIAgent, AgentOptions, CompletionResult, CreateChatCompletionOptions } from 'openai-agents';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Create a real implementation of the OpenAI Agents SDK
// This replaces the mock implementation with the actual SDK

// Initialize OpenAI API key from environment variable
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

/**
 * Create an agent with the specified instructions and tools
 * 
 * @param instructions - Instructions for the agent
 * @param tools - Array of tools for the agent to use
 * @returns The created agent
 */
export const createAgent = (instructions: string, tools: any[] = []): OpenAIAgent => {
  const agentOptions: AgentOptions = {
    model: "o3-mini",
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
    const result: CompletionResult = await agent.createChatCompletion(input);
    return result.choices[0] || "No response generated";
  } catch (error) {
    console.error('Error running agent:', error);
    throw error;
  }
};

/**
 * Stream agent responses (simulated since the SDK doesn't directly support streaming)
 * 
 * @param agent - The agent to run
 * @param input - The input to provide to the agent
 * @param onUpdate - Callback function for streaming updates
 */
export const streamAgent = async (agent: OpenAIAgent, input: string, onUpdate: (content: string) => void): Promise<string> => {
  try {
    // Since the SDK doesn't directly support streaming in the same way as our mock,
    // we'll simulate it by breaking up the response
    const result: CompletionResult = await agent.createChatCompletion(input);
    const response = result.choices[0] || "No response generated";
    
    // Simulate streaming by breaking the response into chunks
    const chunks = response.split(' ');
    let currentText = '';
    
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay to simulate streaming
      currentText += chunk + ' ';
      onUpdate(currentText);
    }
    
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

export default {
  createAgent,
  runAgent,
  streamAgent,
  getChatHistory,
  deleteChatHistory
};
