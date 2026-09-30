import { del, list } from "@vercel/blob";

export default async function handler(request, response) {
  if (request.method === "GET") {
    return listFiles(response);
  }

  if (request.method === "DELETE") {
    return deleteFile(request, response);
  }

  response.setHeader("Allow", "GET, DELETE");
  return response.status(405).json({ error: "Method not allowed." });
}

async function listFiles(response) {
  try {
    const result = await list({
      prefix: "html/",
      limit: 100,
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const files = result.blobs
      .filter((file) => file.pathname.endsWith(".html") || file.pathname.endsWith(".htm"))
      .map((file) => ({
        pathname: file.pathname,
        url: file.url,
        size: file.size,
        uploadedAt: file.uploadedAt
      }))
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return response.status(200).json({ files });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Could not load files." });
  }
}

async function deleteFile(request, response) {
  try {
    const body = await getRequestBody(request);
    const url = body?.url;

    if (!url) {
      return response.status(400).json({ error: "Missing file URL." });
    }

    const blobUrl = new URL(url);
    if (!blobUrl.hostname.endsWith(".blob.vercel-storage.com")) {
      return response.status(400).json({ error: "Only Vercel Blob URLs can be deleted." });
    }

    await del(url, {
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return response.status(200).json({ ok: true });
  } catch (error) {
    return response.status(500).json({ error: error.message || "Could not delete file." });
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
  return rawBody ? JSON.parse(rawBody) : {};
}
