import axios, { AxiosInstance } from 'axios';
import { OpenAIAgent } from 'openai-agents';
import * as agentsSDK from './agentsSDK';

// Create an axios instance with default configuration
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || window.location.origin,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication if needed
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle API errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Create a type that includes both axios methods and our custom agents functionality
interface ExtendedAPI extends AxiosInstance {
  agents: {
    create: (instructions: string, tools?: any[]) => Promise<{ success: boolean; agent: OpenAIAgent }>;
    run: (agent: OpenAIAgent, input: string) => Promise<{ success: boolean; result: string }>;
    stream: (agent: OpenAIAgent, input: string, onUpdate: (content: string) => void) => Promise<string>;
    getHistory: (agent: OpenAIAgent, userId: string) => Promise<{ success: boolean; history: any[] }>;
    deleteHistory: (agent: OpenAIAgent, userId: string) => Promise<{ success: boolean }>;
  };
}

// Extend the API with Agents SDK functionality
const api: ExtendedAPI = Object.assign(axiosInstance, {
  agents: {
    // Create a new agent
    create: async (instructions: string, tools: any[] = []) => {
      try {
        const agent = agentsSDK.createAgent(instructions, tools);
        return { success: true, agent };
      } catch (error) {
        console.error('Error creating agent:', error);
        throw error;
      }
    },
    
    // Run an agent with input
    run: async (agent: OpenAIAgent, input: string) => {
      try {
        const result = await agentsSDK.runAgent(agent, input);
        return { success: true, result };
      } catch (error) {
        console.error('Error running agent:', error);
        throw error;
      }
    },
    
    // Stream agent responses
    stream: async (agent: OpenAIAgent, input: string, onUpdate: (content: string) => void) => {
      try {
        return await agentsSDK.streamAgent(agent, input, onUpdate);
      } catch (error) {
        console.error('Error streaming agent:', error);
        throw error;
      }
    },
    
    // Get chat history
    getHistory: async (agent: OpenAIAgent, userId: string) => {
      try {
        const history = await agentsSDK.getChatHistory(agent, userId);
        return { success: true, history };
      } catch (error) {
        console.error('Error getting chat history:', error);
        throw error;
      }
    },
    
    // Delete chat history
    deleteHistory: async (agent: OpenAIAgent, userId: string) => {
      try {
        const success = await agentsSDK.deleteChatHistory(agent, userId);
        return { success };
      } catch (error) {
        console.error('Error deleting chat history:', error);
        throw error;
      }
    }
  }
});

export default api;
