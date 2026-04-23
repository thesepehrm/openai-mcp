import { describe, it, expect } from "vitest";
import { createUser, verifyUser, getUserById } from "@/lib/auth";

describe("createUser", () => {
  it("creates a user and returns id + email", async () => {
    const user = await createUser("test@example.com", "password123");
    expect(user.id).toBeTruthy();
    expect(user.email).toBe("test@example.com");
  });

  it("normalises email to lowercase", async () => {
    const user = await createUser("Test@EXAMPLE.COM", "password123");
    expect(user.email).toBe("test@example.com");
  });

  it("throws on duplicate email", async () => {
    await createUser("dup@example.com", "password123");
    await expect(createUser("dup@example.com", "other")).rejects.toThrow();
  });
});

describe("verifyUser", () => {
  it("returns user on correct password", async () => {
    await createUser("login@example.com", "correctpass");
    const user = await verifyUser("login@example.com", "correctpass");
    expect(user).not.toBeNull();
    expect(user!.email).toBe("login@example.com");
  });

  it("returns null on wrong password", async () => {
    await createUser("login2@example.com", "correctpass");
    const user = await verifyUser("login2@example.com", "wrongpass");
    expect(user).toBeNull();
  });

  it("returns null for unknown email", async () => {
    expect(await verifyUser("nobody@example.com", "pass")).toBeNull();
  });

  it("is case-insensitive for email", async () => {
    await createUser("case@example.com", "pass1234");
    const user = await verifyUser("CASE@EXAMPLE.COM", "pass1234");
    expect(user).not.toBeNull();
  });
});

describe("getUserById", () => {
  it("returns user by id", async () => {
    const created = await createUser("byid@example.com", "pass1234");
    const found = getUserById(created.id);
    expect(found).not.toBeUndefined();
    expect(found!.email).toBe("byid@example.com");
  });

  it("returns undefined for unknown id", () => {
    expect(getUserById("nonexistent")).toBeUndefined();
  });
});
