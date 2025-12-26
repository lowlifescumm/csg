/**
 * Jest unit tests for Meditation API routes
 * 
 * Run with: npm test -- meditations.test.js
 */

import { GET, POST } from "@/app/api/meditations/route";
import { POST as POST_START } from "@/app/api/meditations/[id]/start/route";
import { POST as POST_COMPLETE } from "@/app/api/meditations/[id]/complete/route";
import { GET as GET_USER_MEDITATIONS } from "@/app/api/user/meditations/route";
import { pool } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { authOptions } from "@/lib/auth-config";

// Mock dependencies
jest.mock("@/lib/db");
jest.mock("@/lib/auth");
jest.mock("@/lib/auth-config", () => ({
  authOptions: {},
}));

describe("Meditation API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/meditations", () => {
    it("should return list of meditations", async () => {
      const mockMeditations = [
        {
          id: 1,
          title: "Morning Clarity",
          description: "Start your day",
          duration_seconds: 180,
          narrator: "Sarah Moon",
          premium: false,
          narration_audio_url: "https://example.com/audio.mp3",
          tags: ["morning"],
        },
      ];

      pool.query = jest.fn().mockResolvedValue({ rows: mockMeditations });

      const request = new Request("http://localhost/api/meditations");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.meditations).toHaveLength(1);
      expect(data.meditations[0].title).toBe("Morning Clarity");
    });

    it("should filter by premium status", async () => {
      pool.query = jest.fn().mockResolvedValue({ rows: [] });

      const request = new Request("http://localhost/api/meditations?premium=true");
      await GET(request);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("premium = $1"),
        [true]
      );
    });
  });

  describe("POST /api/meditations/[id]/start", () => {
    it("should create a meditation session", async () => {
      getAuthenticatedUser.mockResolvedValue({ userId: 1 });
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, premium: false }],
        })
        .mockResolvedValueOnce({ rows: [] });

      const request = new Request("http://localhost/api/meditations/1/start", {
        method: "POST",
      });
      const response = await POST_START(request, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessionId).toMatch(/^med_/);
      expect(data.startedAt).toBeDefined();
    });

    it("should reject premium meditation for non-premium users", async () => {
      getAuthenticatedUser.mockResolvedValue({ userId: 1 });
      pool.query
        .mockResolvedValueOnce({
          rows: [{ id: 1, premium: true }],
        })
        .mockResolvedValueOnce({
          rows: [{ role: "user", stripe_subscription_id: null }],
        });

      const request = new Request("http://localhost/api/meditations/1/start", {
        method: "POST",
      });
      const response = await POST_START(request, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.premium).toBe(true);
    });
  });

  describe("POST /api/meditations/[id]/complete", () => {
    it("should complete session and award XP", async () => {
      getAuthenticatedUser.mockResolvedValue({ userId: 1 });
      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              session_id: "med_abc123",
              user_id: 1,
              meditation_id: 1,
              duration_seconds: 180,
              completed_at: null,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // Update session
        .mockResolvedValueOnce({
          rows: [{ total_xp: 10, current_level: 1 }],
        }) // Award XP
        .mockResolvedValueOnce({ rows: [] }) // Check task
        .mockResolvedValueOnce({ rows: [] }) // Insert task
        .mockResolvedValueOnce({ rows: [] }); // Update XP for task

      const request = new Request("http://localhost/api/meditations/1/complete", {
        method: "POST",
        body: JSON.stringify({ sessionId: "med_abc123" }),
      });
      const response = await POST_COMPLETE(request, { params: { id: "1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.xpAwarded).toBe(10); // Short meditation = 10 XP
      expect(data.totalXP).toBe(10);
    });

    it("should award correct XP for different durations", async () => {
      getAuthenticatedUser.mockResolvedValue({ userId: 1 });
      
      // Test medium duration (300s = 20 XP)
      pool.query
        .mockResolvedValueOnce({
          rows: [
            {
              session_id: "med_abc123",
              user_id: 1,
              meditation_id: 1,
              duration_seconds: 300,
              completed_at: null,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{ total_xp: 20, current_level: 1 }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const request = new Request("http://localhost/api/meditations/1/complete", {
        method: "POST",
        body: JSON.stringify({ sessionId: "med_abc123" }),
      });
      const response = await POST_COMPLETE(request, { params: { id: "1" } });
      const data = await response.json();

      expect(data.xpAwarded).toBe(20);
    });
  });

  describe("GET /api/user/meditations", () => {
    it("should return user meditation sessions", async () => {
      getAuthenticatedUser.mockResolvedValue({ userId: 1 });
      pool.query
        .mockResolvedValueOnce({
          rows: [{ count: "5" }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              session_id: "med_abc123",
              meditation_id: 1,
              started_at: new Date(),
              completed_at: new Date(),
              duration_seconds: 180,
              xp_awarded: 10,
              meditation_title: "Morning Clarity",
              meditation_duration: 180,
            },
          ],
        });

      const request = new Request("http://localhost/api/user/meditations");
      const response = await GET_USER_MEDITATIONS(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessions).toHaveLength(1);
      expect(data.total).toBe(5);
    });
  });
});


