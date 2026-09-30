import { handleUpload } from "@vercel/blob/client";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(request, response) {
  if (request.method === "GET") {
    return response.status(200).json({
      ok: true,
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      hasBlobStoreId: Boolean(process.env.BLOB_STORE_ID),
      hasWebhookKey: Boolean(process.env.BLOB_WEBHOOK_PUBLIC_KEY),
      nodeEnv: process.env.NODE_ENV || null
    });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = await getRequestBody(request);
    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        const extension = pathname.split(".").pop().toLowerCase();

        if (!["html", "htm"].includes(extension)) {
          throw new Error("Only .html and .htm files are allowed.");
        }

        return {
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({})
        };
      },
      onUploadCompleted: async () => {}
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    if (error.message?.includes("BLOB_READ_WRITE_TOKEN") || error.message?.includes("blob credentials")) {
      return response.status(500).json({
        error: "Vercel Blob is not configured. Check that BLOB_READ_WRITE_TOKEN is connected to this project."
      });
    }

    console.error("Blob upload route failed:", error);
    return response.status(400).json({ error: error.message || "Upload failed. Please try again." });
  }
}

async function getRequestBody(request) {
  if (request.body && typeof request.body === "object" && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  if (typeof request.body === "string") {
    return JSON.parse(request.body);
  }

  if (Buffer.isBuffer(request.body)) {
    return JSON.parse(request.body.toString("utf8"));
  }

  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    throw new Error("Upload token request body was empty.");
  }

  return JSON.parse(rawBody);
}
