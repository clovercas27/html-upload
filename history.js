const list = document.querySelector("#file-list");
const summary = document.querySelector("#summary");
const refreshButton = document.querySelector("#refresh-button");

refreshButton.addEventListener("click", loadUploads);
loadUploads();

async function loadUploads() {
  list.innerHTML = "";
  summary.textContent = "Loading uploads...";
  summary.className = "message";
  refreshButton.disabled = true;

  try {
    const response = await fetch("/api/files");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load uploads.");
    }

    if (!data.files.length) {
      summary.textContent = "No uploaded files yet.";
      return;
    }

    summary.textContent = `${data.files.length} uploaded file${data.files.length === 1 ? "" : "s"}.`;
    data.files.forEach((file) => {
      list.appendChild(createFileCard(file));
    });
  } catch (error) {
    summary.textContent = error.message;
    summary.className = "message error";
  } finally {
    refreshButton.disabled = false;
  }
}

function createFileCard(file) {
  const card = document.createElement("article");
  card.className = "file-card";

  const name = document.createElement("div");
  name.className = "file-name";
  name.textContent = file.pathname.replace(/^html\//, "");

  const meta = document.createElement("div");
  meta.className = "file-meta";
  meta.textContent = `${formatBytes(file.size)} · ${new Date(file.uploadedAt).toLocaleString()}`;

  const row = document.createElement("div");
  row.className = "file-row";

  const view = document.createElement("a");
  view.href = `/api/view?url=${encodeURIComponent(file.url)}`;
  view.target = "_blank";
  view.rel = "noopener noreferrer";
  view.textContent = "Open";

  const raw = document.createElement("a");
  raw.href = file.url;
  raw.target = "_blank";
  raw.rel = "noopener noreferrer";
  raw.textContent = "Raw";

  const deleteButton = document.createElement("button");
  deleteButton.className = "danger-button";
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteFile(file.url, card));

  row.append(view, raw, deleteButton);
  card.append(name, meta, row);

  return card;
}

async function deleteFile(url, card) {
  const confirmed = window.confirm("Delete this uploaded file?");
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch("/api/files", {
      method: "DELETE",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ url })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not delete file.");
    }

    card.remove();
    loadUploads();
  } catch (error) {
    summary.textContent = error.message;
    summary.className = "message error";
  }
}

function formatBytes(bytes) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}
