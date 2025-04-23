import axios from "axios";

interface ConversationConfig {
  voice_id?: string;
  model_id?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  [key: string]: any;
}

interface CreateAgentOptions {
  conversation_config: ConversationConfig;
  name?: string;
  description?: string;
}

interface AgentResponse {
  agent_id: string;
  name: string;
  description: string;
  status: string;
  conversation_config: ConversationConfig;
}

export class ElevenLabsConvAI {
  private readonly baseUrl = "https://api.elevenlabs.io/v1/convai/agents";

  constructor(private apiKey: string) {}

  async createAgent(options: CreateAgentOptions): Promise<AgentResponse> {
    const { conversation_config, name, description } = options;

    try {
      const response = await axios.post(
        `${this.baseUrl}/create`,
        {
          conversation_config,
          name,
          description,
        },
        {
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "ElevenLabs ConvAI Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<AgentResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/${agentId}`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "ElevenLabs ConvAI Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  async listAgents(): Promise<AgentResponse[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "ElevenLabs ConvAI Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }

  async deleteAgent(agentId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/${agentId}`, {
        headers: {
          "xi-api-key": this.apiKey,
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          "ElevenLabs ConvAI Error:",
          error.response?.data || error.message
        );
      }
      throw error;
    }
  }
}

// Example usage:
export async function createConvAIAgent(
  config: ConversationConfig,
  name?: string,
  description?: string
): Promise<AgentResponse> {
  const convai = new ElevenLabsConvAI(process.env.ELEVENLABS_API_KEY || "");

  try {
    const agent = await convai.createAgent({
      conversation_config: config,
      name,
      description,
    });

    console.log("✅ ConvAI Agent created:", agent.agent_id);
    return agent;
  } catch (error) {
    console.error("❌ Error creating ConvAI agent:", error);
    throw error;
  }
}
