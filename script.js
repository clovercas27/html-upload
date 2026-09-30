const form = document.querySelector("#upload-form");
const fileInput = document.querySelector("#html-file");
const fileName = document.querySelector("#file-name");
const message = document.querySelector("#message");
const uploadButton = document.querySelector("#upload-button");
const result = document.querySelector("#result");
const resultUrl = document.querySelector("#result-url");
const openLink = document.querySelector("#open-link");
const copyButton = document.querySelector("#copy-button");

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

  uploadButton.disabled = true;
  result.hidden = true;
  showMessage("Uploading...");

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "content-type": file.type || "text/html",
        "x-file-name": encodeURIComponent(file.name)
      },
      body: file
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Upload failed.");
    }

    resultUrl.value = data.url;
    openLink.href = data.url;
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
