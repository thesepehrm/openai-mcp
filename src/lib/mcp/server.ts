import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  generateImageInputSchema,
  generateImage,
} from "./tools/generate-image";
import { editImageInputSchema, editImage } from "./tools/edit-image";

export function createMcpServer(userId: string) {
  const server = new McpServer({
    name: "gpt-image-2",
    version: "1.0.0",
  });

  server.registerTool(
    "generate_image",
    {
      description:
        "Generate images using OpenAI gpt-image-2. Returns base64-encoded images.",
      inputSchema: generateImageInputSchema,
    },
    async (input) => {
      try {
        return await generateImage(userId, input);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[generate] error user=${userId}`, err);
        if (msg.includes("No API key")) {
          return {
            content: [{ type: "text", text: `Error: ${msg}` }],
            isError: true,
          };
        }
        if (
          msg.toLowerCase().includes("invalid_api_key") ||
          msg.includes("Incorrect API key")
        ) {
          return {
            content: [
              {
                type: "text",
                text: "Error: invalid_api_key — your OpenAI API key is invalid or expired. Visit the dashboard to update it.",
              },
            ],
            isError: true,
          };
        }
        return {
          content: [{ type: "text", text: `Error: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "edit_image",
    {
      description:
        "Edit an existing image using OpenAI gpt-image-2. Provide a base64-encoded image and a prompt describing changes. Optionally include a base64 PNG mask (transparent = area to edit).",
      inputSchema: editImageInputSchema,
    },
    async (input) => {
      try {
        return await editImage(userId, input);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[edit] error user=${userId}`, err);
        if (msg.includes("No API key")) {
          return {
            content: [{ type: "text", text: `Error: ${msg}` }],
            isError: true,
          };
        }
        if (
          msg.toLowerCase().includes("invalid_api_key") ||
          msg.includes("Incorrect API key")
        ) {
          return {
            content: [
              {
                type: "text",
                text: "Error: invalid_api_key — your OpenAI API key is invalid or expired. Visit the dashboard to update it.",
              },
            ],
            isError: true,
          };
        }
        return {
          content: [{ type: "text", text: `Error: ${msg}` }],
          isError: true,
        };
      }
    },
  );

  return server;
}
