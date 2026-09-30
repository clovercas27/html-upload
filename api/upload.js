import { handleUpload } from "@vercel/blob/client";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed." });
  }

  try {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }

    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
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
          allowedContentTypes: ["text/html"],
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

    return response.status(400).json({ error: error.message || "Upload failed. Please try again." });
  }
}
