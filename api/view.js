export default async function handler(request, response) {
  const rawUrl = request.query?.url;
  const url = Array.isArray(rawUrl) ? rawUrl[0] : rawUrl;

  if (!url) {
    return response.status(400).send("Missing file URL.");
  }

  let blobUrl;
  try {
    blobUrl = new URL(url);
  } catch {
    return response.status(400).send("Invalid file URL.");
  }

  if (!blobUrl.hostname.endsWith(".blob.vercel-storage.com")) {
    return response.status(400).send("Only Vercel Blob URLs are allowed.");
  }

  const fileResponse = await fetch(blobUrl);
  if (!fileResponse.ok) {
    return response.status(404).send("HTML file was not found.");
  }

  const html = await fileResponse.text();

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("Content-Disposition", "inline");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Content-Security-Policy", "sandbox allow-scripts allow-forms allow-popups allow-modals");
  response.status(200).send(html);
}
