async function requireAuth() {
  const res = await fetch("/auth/me");

  if (!res.ok) {
    window.location.href = "/login.html";
    return null;
  }

  return (await res.json()).data.user;
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const accent =
    type === "success" ? "border-l-sage" : "border-l-clay";

  const toast = document.createElement("div");
  toast.className = `pointer-events-auto flex items-center gap-3 rounded-xl border border-edge border-l-4 ${accent} bg-surface px-4 py-3 text-sm font-medium text-ink shadow-xl`;
  toast.setAttribute("role", "alert");
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("opacity-0", "transition", "duration-300");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setLoading(btn, isLoading) {
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "Please wait...";
    btn.disabled = true;
  } else {
    btn.textContent = btn.dataset.originalText;
    btn.disabled = false;
  }
}

function clearErrors() {
  document.querySelectorAll("[id$='Error']").forEach((el) => {
    el.classList.add("hidden");
    el.textContent = "";
  });
}

function showFieldErrors(errors) {
  for (const [field, info] of Object.entries(errors)) {
    const el = document.getElementById(`${field}Error`);
    if (!el) continue;

    el.textContent = info.errors?.[0] ?? "invalid value";
    el.classList.remove("hidden");
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export {
  requireAuth,
  showToast,
  setLoading,
  clearErrors,
  showFieldErrors,
  escapeHtml,
  formatRelativeTime,
  initials,
};
