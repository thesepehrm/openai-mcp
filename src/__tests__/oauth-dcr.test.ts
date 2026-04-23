import { describe, it, expect } from "vitest";
import { registerClient, getClient } from "@/lib/oauth/dcr";

describe("DCR", () => {
  it("registers a client and retrieves it", () => {
    const reg = registerClient({
      redirect_uris: ["http://localhost:8080/callback"],
      client_name: "Test Client",
    });
    expect(reg.client_id).toBeTruthy();
    expect(reg.redirect_uris).toEqual(["http://localhost:8080/callback"]);

    const found = getClient(reg.client_id);
    expect(found).not.toBeNull();
    expect(found!.client_name).toBe("Test Client");
    expect(found!.redirect_uris).toEqual(["http://localhost:8080/callback"]);
  });

  it("returns null for unknown client_id", () => {
    expect(getClient("does-not-exist")).toBeNull();
  });

  it("stores multiple redirect_uris correctly", () => {
    const reg = registerClient({
      redirect_uris: ["http://localhost:8080/cb", "http://localhost:9090/cb"],
    });
    const found = getClient(reg.client_id);
    expect(found!.redirect_uris).toHaveLength(2);
  });

  it("defaults token_endpoint_auth_method to none", () => {
    const reg = registerClient({ redirect_uris: ["http://localhost/cb"] });
    expect(reg.token_endpoint_auth_method).toBe("none");
  });
});
