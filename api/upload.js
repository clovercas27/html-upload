import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const contentLength = Number(request.headers["content-length"] || 0);
    if (!contentLength) {
      return response.status(400).json({ error: "No file was uploaded." });
    }

    if (contentLength > MAX_FILE_SIZE) {
      return response.status(400).json({ error: "File is too large. Maximum size is 5 MB." });
    }

    const headerName = request.headers["x-file-name"];
    const originalName = headerName ? decodeURIComponent(headerName) : "uploaded.html";
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const extension = safeName.split(".").pop().toLowerCase();

    if (!["html", "htm"].includes(extension)) {
      return response.status(400).json({ error: "Only .html and .htm files are allowed." });
    }

    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }

    const fileBuffer = Buffer.concat(chunks);
    if (fileBuffer.length > MAX_FILE_SIZE) {
      return response.status(400).json({ error: "File is too large. Maximum size is 5 MB." });
    }

    const blob = await put(`html/${Date.now()}-${safeName}`, fileBuffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: "text/html; charset=utf-8"
    });

    return response.status(200).json({ url: blob.url });
  } catch (error) {
    if (error.message?.includes("BLOB_READ_WRITE_TOKEN")) {
      return response.status(500).json({
        error: "Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN in your Vercel project."
      });
    }

    return response.status(500).json({ error: "Upload failed. Please try again." });
  }
}
