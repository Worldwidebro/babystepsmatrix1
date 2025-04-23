import { supabase } from "../config/supabase";
import { createUser, loginUser, validateToken } from "../services/auth-service";
import jwt from "jsonwebtoken";

// Mock Supabase client
jest.mock("../config/supabase", () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signIn: jest.fn(),
    },
  },
}));

describe("Authentication Service", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
      };

      // Mock successful user creation
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await createUser("test@example.com", "password123");

      expect(result).toEqual({
        success: true,
        user: mockUser,
      });
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should handle user creation errors", async () => {
      // Mock user creation error
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error("Email already exists"),
      });

      const result = await createUser("test@example.com", "password123");

      expect(result).toEqual({
        success: false,
        error: "Email already exists",
      });
    });
  });

  describe("loginUser", () => {
    it("should login user successfully", async () => {
      const mockSession = {
        access_token: "mock-token",
        user: {
          id: "123",
          email: "test@example.com",
        },
      };

      // Mock successful login
      (supabase.auth.signIn as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const result = await loginUser("test@example.com", "password123");

      expect(result).toEqual({
        success: true,
        session: mockSession,
      });
      expect(supabase.auth.signIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should handle login errors", async () => {
      // Mock login error
      (supabase.auth.signIn as jest.Mock).mockResolvedValue({
        data: null,
        error: new Error("Invalid credentials"),
      });

      const result = await loginUser("test@example.com", "wrong-password");

      expect(result).toEqual({
        success: false,
        error: "Invalid credentials",
      });
    });
  });

  describe("validateToken", () => {
    it("should validate a valid token", () => {
      const mockPayload = {
        sub: "123",
        email: "test@example.com",
      };

      const token = jwt.sign(
        mockPayload,
        process.env.JWT_SECRET || "test-secret",
      );
      const result = validateToken(token);

      expect(result).toEqual({
        valid: true,
        payload: expect.objectContaining(mockPayload),
      });
    });

    it("should reject an invalid token", () => {
      const result = validateToken("invalid-token");

      expect(result).toEqual({
        valid: false,
        error: expect.any(String),
      });
    });
  });
});
