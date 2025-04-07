import agentsSDK from './agentsSDK';
import { OpenAIAgent } from 'openai-agents';

/**
 * Test function to verify the OpenAI Agents SDK integration
 */
export const testAgentSDKIntegration = async () => {
  try {
    console.log('Testing OpenAI Agents SDK integration...');
    
    // Create a simple agent
    const agent = agentsSDK.createAgent(
      "You are a helpful assistant that provides concise answers."
    );
    
    console.log('Agent created successfully');
    
    // Test running the agent
    const result = await agentsSDK.runAgent(agent, "What is the current date?");
    
    console.log('Agent run successful with result:', result);
    
    return {
      success: true,
      message: 'OpenAI Agents SDK integration verified successfully',
      result
    };
  } catch (error) {
    console.error('Error testing OpenAI Agents SDK integration:', error);
    return {
      success: false,
      message: 'OpenAI Agents SDK integration verification failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

export default {
  testAgentSDKIntegration
};
