import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface MessageOptions {
  to: string;
  body: string;
  mediaUrl?: string[];
}

export class TwilioService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(config: TwilioConfig) {
    this.client = twilio(config.accountSid, config.authToken);
    this.fromNumber = config.phoneNumber;
  }

  async sendMessage(
    options: MessageOptions
  ): Promise<twilio.twiml.MessagingInstance> {
    try {
      const message = await this.client.messages.create({
        body: options.body,
        from: this.fromNumber,
        to: options.to,
        mediaUrl: options.mediaUrl,
      });

      console.log("✅ Message sent successfully:", message.sid);
      return message;
    } catch (error) {
      console.error("❌ Error sending message:", error);
      throw error;
    }
  }

  async sendVoiceCall(
    to: string,
    twiml: string
  ): Promise<twilio.twiml.VoiceCallInstance> {
    try {
      const call = await this.client.calls.create({
        to,
        from: this.fromNumber,
        twiml: `<Response><Say>${twiml}</Say></Response>`,
      });

      console.log("✅ Voice call initiated:", call.sid);
      return call;
    } catch (error) {
      console.error("❌ Error making voice call:", error);
      throw error;
    }
  }

  async getMessageHistory(
    limit: number = 20
  ): Promise<twilio.twiml.MessageInstance[]> {
    try {
      const messages = await this.client.messages.list({ limit });
      return messages;
    } catch (error) {
      console.error("❌ Error fetching message history:", error);
      throw error;
    }
  }
}

// Example usage:
export function createTwilioService(): TwilioService {
  const config: TwilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  };

  return new TwilioService(config);
}
