import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export class ResendService {
  private resend: Resend;
  private defaultFrom: string;

  constructor(apiKey: string, defaultFrom: string) {
    this.resend = new Resend(apiKey);
    this.defaultFrom = defaultFrom;
  }

  async sendEmail(options: EmailOptions): Promise<{ id: string }> {
    try {
      const response = await this.resend.emails.send({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        attachments: options.attachments,
      });

      console.log("✅ Email sent successfully:", response.id);
      return { id: response.id };
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw error;
    }
  }

  async sendVerificationEmail(
    to: string,
    token: string
  ): Promise<{ id: string }> {
    const verificationLink = `${process.env.APP_URL}/verify-email?token=${token}`;

    return this.sendEmail({
      to,
      subject: "Verify your email address",
      html: `
        <h1>Welcome!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    token: string
  ): Promise<{ id: string }> {
    const resetLink = `${process.env.APP_URL}/reset-password?token=${token}`;

    return this.sendEmail({
      to,
      subject: "Reset your password",
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }
}

// Example usage:
export function createResendService(): ResendService {
  return new ResendService(
    process.env.RESEND_API_KEY || "re_HBDTwfie_3Xfyg1pNs1DC6W1fLFrwDtSA",
    process.env.DEFAULT_FROM_EMAIL || "onboarding@resend.dev"
  );
}
