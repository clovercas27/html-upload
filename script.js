import { upload } from "@vercel/blob/client";

const form = document.querySelector("#upload-form");
const fileInput = document.querySelector("#html-file");
const fileName = document.querySelector("#file-name");
const message = document.querySelector("#message");
const uploadButton = document.querySelector("#upload-button");
const result = document.querySelector("#result");
const resultUrl = document.querySelector("#result-url");
const openLink = document.querySelector("#open-link");
const copyButton = document.querySelector("#copy-button");
const MAX_FILE_SIZE = 50 * 1024 * 1024;

fileInput.addEventListener("change", () => {
  fileName.textContent = fileInput.files[0]?.name || "Only .html and .htm files are accepted.";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = fileInput.files[0];
  if (!file) {
    showMessage("Choose an HTML file first.", "error");
    return;
  }

  const extension = file.name.split(".").pop().toLowerCase();
  if (!["html", "htm"].includes(extension)) {
    showMessage("Please upload a .html or .htm file.", "error");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showMessage("File is too large. Maximum size is 50 MB.", "error");
    return;
  }

  uploadButton.disabled = true;
  result.hidden = true;
  showMessage("Uploading...");

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const blob = await upload(`html/${Date.now()}-${safeName}`, file, {
      access: "public",
      handleUploadUrl: "/api/upload"
    });

    const viewUrl = `${window.location.origin}/api/view?url=${encodeURIComponent(blob.url)}`;

    resultUrl.value = viewUrl;
    openLink.href = viewUrl;
    openLink.textContent = "Open uploaded HTML";
    result.hidden = false;
    showMessage("Uploaded successfully.", "success");
  } catch (error) {
    showMessage(error.message, "error");
  } finally {
    uploadButton.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(resultUrl.value);
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy";
  }, 1400);
});

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}
