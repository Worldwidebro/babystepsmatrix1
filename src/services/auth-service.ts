import { supabase } from "../config/database";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";

interface User {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  metadata?: Record<string, any>;
}

interface AuthResponse {
  user?: User;
  token?: string;
  error?: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  private readonly SALT_ROUNDS = 10;
  private readonly googleClient: OAuth2Client;

  constructor() {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async register(
    email: string,
    password: string,
    role: string,
    tenantId: string
  ): Promise<AuthResponse> {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Create user in Supabase
      const { data: user, error } = await supabase
        .from(`tenant_${tenantId}.users`)
        .insert([
          {
            id: uuidv4(),
            email,
            encrypted_password: hashedPassword,
            role,
            tenant_id: tenantId,
          },
        ])
        .single();

      if (error) throw error;

      // Generate JWT
      const token = this.generateToken(user);

      // Log the registration
      await this.logAudit(user.id, tenantId, "user_registration", {
        email,
        role,
      });

      return { user, token };
    } catch (error) {
      console.error("Registration error:", error);
      return { error: "Registration failed" };
    }
  }

  async login(
    email: string,
    password: string,
    tenantId: string
  ): Promise<AuthResponse> {
    try {
      // Get user from Supabase
      const { data: user, error } = await supabase
        .from(`tenant_${tenantId}.users`)
        .select("*")
        .eq("email", email)
        .single();

      if (error || !user) {
        return { error: "Invalid credentials" };
      }

      // Verify password
      const validPassword = await bcrypt.compare(
        password,
        user.encrypted_password
      );

      if (!validPassword) {
        return { error: "Invalid credentials" };
      }

      // Generate JWT
      const token = this.generateToken(user);

      // Log the login
      await this.logAudit(user.id, tenantId, "user_login", {
        email,
      });

      return { user, token };
    } catch (error) {
      console.error("Login error:", error);
      return { error: "Login failed" };
    }
  }

  async googleLogin(idToken: string, tenantId: string): Promise<AuthResponse> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return { error: "Invalid Google token" };
      }

      // Check if user exists
      let { data: user, error } = await supabase
        .from(`tenant_${tenantId}.users`)
        .select("*")
        .eq("email", payload.email)
        .single();

      // If user doesn't exist, create one
      if (!user) {
        const { data: newUser, error: createError } = await supabase
          .from(`tenant_${tenantId}.users`)
          .insert([
            {
              id: uuidv4(),
              email: payload.email,
              role: "user",
              tenant_id: tenantId,
              metadata: {
                google_id: payload.sub,
                name: payload.name,
                picture: payload.picture,
              },
            },
          ])
          .single();

        if (createError) throw createError;
        user = newUser;
      }

      // Generate JWT
      const token = this.generateToken(user);

      // Log the OAuth login
      await this.logAudit(user.id, tenantId, "google_login", {
        email: payload.email,
      });

      return { user, token };
    } catch (error) {
      console.error("Google login error:", error);
      return { error: "Google login failed" };
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as User;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
      this.JWT_SECRET,
      { expiresIn: "24h" }
    );
  }

  private async logAudit(
    userId: string,
    tenantId: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await supabase.from(`tenant_${tenantId}.audit_logs`).insert([
        {
          user_id: userId,
          action,
          details,
          ip_address: "", // Add IP address in production
        },
      ]);
    } catch (error) {
      console.error("Audit log error:", error);
    }
  }

  // Role-Based Access Control (RBAC)
  async hasPermission(
    userId: string,
    tenantId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const { data: user, error } = await supabase
        .from(`tenant_${tenantId}.users`)
        .select("role")
        .eq("id", userId)
        .single();

      if (error || !user) return false;

      // Define role permissions
      const rolePermissions: Record<string, string[]> = {
        admin: ["all"],
        manager: ["read", "write", "update"],
        user: ["read"],
      };

      return (
        rolePermissions[user.role]?.includes("all") ||
        rolePermissions[user.role]?.includes(permission) ||
        false
      );
    } catch (error) {
      console.error("Permission check error:", error);
      return false;
    }
  }
}
