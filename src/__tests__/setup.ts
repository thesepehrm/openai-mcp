import { beforeEach, afterEach } from "vitest";
import { closeDb } from "@/lib/db";

// Use in-memory SQLite for all tests
process.env.DB_PATH = ":memory:";
process.env.APP_URL = "http://localhost:3000";
process.env.JWT_SECRET = Buffer.alloc(32, 0x01).toString("base64");
process.env.MASTER_ENC_KEY = Buffer.alloc(32, 0x42).toString("base64");
process.env.SESSION_SECRET = "test-session-secret-that-is-long-enough";

beforeEach(() => {
  // Reset DB singleton → next getDb() call gets a fresh :memory: database
  closeDb();
});

afterEach(() => {
  closeDb();
});
