import { getEnv } from "../env";

export function getProtectedResourceMetadata() {
  const { APP_URL } = getEnv();
  return {
    resource: `${APP_URL}/mcp`,
    authorization_servers: [APP_URL],
  };
}

export function getAuthorizationServerMetadata() {
  const { APP_URL } = getEnv();
  return {
    issuer: APP_URL,
    authorization_endpoint: `${APP_URL}/oauth/authorize`,
    token_endpoint: `${APP_URL}/oauth/token`,
    registration_endpoint: `${APP_URL}/oauth/register`,
    revocation_endpoint: `${APP_URL}/oauth/revoke`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: ["openai:images"],
  };
}
