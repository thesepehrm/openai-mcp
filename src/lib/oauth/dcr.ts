import { v4 as uuidv4 } from "uuid";
import { getDb } from "../db";

export interface ClientRegistration {
  redirect_uris: string[];
  client_name?: string;
  token_endpoint_auth_method?: string;
}

export function registerClient(reg: ClientRegistration) {
  const db = getDb();
  const clientId = uuidv4();
  const authMethod = reg.token_endpoint_auth_method ?? "none";

  db.prepare(
    `INSERT INTO oauth_clients (client_id, redirect_uris, token_endpoint_auth_method, client_name, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    clientId,
    JSON.stringify(reg.redirect_uris),
    authMethod,
    reg.client_name ?? null,
    Date.now(),
  );

  return {
    client_id: clientId,
    redirect_uris: reg.redirect_uris,
    token_endpoint_auth_method: authMethod,
    client_name: reg.client_name,
  };
}

export function getClient(clientId: string) {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM oauth_clients WHERE client_id = ?`)
    .get(clientId) as
    | {
        client_id: string;
        redirect_uris: string;
        token_endpoint_auth_method: string;
        client_name: string | null;
      }
    | undefined;
  if (!row) return null;
  return {
    ...row,
    redirect_uris: JSON.parse(row.redirect_uris) as string[],
  };
}
