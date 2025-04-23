import dotenv from "dotenv";
import { createConvAIAgent } from "../services/elevenlabs-convai";

dotenv.config();

async function testConvAIAgent() {
  console.log("🤖 Testing ConvAI Agent Creation...\n");

  const config = {
    voice_id: "21m00Tcm4TlvDq8ikWAM", // Example voice ID
    model_id: "eleven_multilingual_v2",
    temperature: 0.7,
    max_tokens: 150,
    system_prompt: "You are a helpful AI assistant.",
  };

  const name = "Test Assistant";
  const description = "A test ConvAI agent for demonstration purposes";

  try {
    const agent = await createConvAIAgent(config, name, description);

    console.log("\n✅ ConvAI Agent Created:");
    console.log("- Agent ID:", agent.agent_id);
    console.log("- Name:", agent.name);
    console.log("- Description:", agent.description);
    console.log("- Status:", agent.status);
    console.log("\nConfiguration:");
    console.log(JSON.stringify(agent.conversation_config, null, 2));
  } catch (error) {
    console.error("❌ Error in ConvAI agent creation test:", error);
  }
}

testConvAIAgent().catch(console.error);
