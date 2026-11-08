import { escapeHtml, initials } from "./auth.js";

async function renderNavbar() {
  const container = document.getElementById("navbar");
  if (!container) return;

  let user = null;

  try {
    const res = await fetch("/auth/me");
    if (res.ok) {
      const data = await res.json();
      user = data.data.user;
    }
  } catch {
    user = null;
  }

  const right = user
    ? `
      <div class="flex items-center gap-3">
        <div class="hidden items-center gap-2.5 rounded-full border border-edge bg-surface px-3 py-1.5 sm:flex">
          <span class="grid h-7 w-7 place-items-center rounded-full bg-sage-soft text-[11px] font-semibold text-sage">${initials(user.username)}</span>
          <span class="text-sm font-medium text-ink">${escapeHtml(user.username)}</span>
        </div>
        <button id="logoutBtn" class="rounded-full border border-edge px-4 py-1.5 text-sm font-medium text-muted transition hover:border-clay hover:text-clay">
          Logout
        </button>
      </div>`
    : `
      <div class="flex items-center gap-2">
        <a href="/login.html" class="rounded-full px-4 py-1.5 text-sm font-medium text-muted transition hover:text-clay">Login</a>
        <a href="/register.html" class="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-paper transition hover:bg-clay">Sign up</a>
      </div>`;

  container.innerHTML = `
    <header class="sticky top-0 z-40 border-b border-edge bg-paper/85 backdrop-blur">
      <div class="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <a href="/home.html" class="group flex items-baseline gap-1.5">
          <span class="font-display text-2xl font-semibold text-ink transition group-hover:text-clay">Inkwell</span>
          <span class="h-1.5 w-1.5 rounded-full bg-clay"></span>
        </a>
        ${right}
      </div>
    </header>`;

  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await fetch("/auth/logout", { method: "POST" });
    window.location.href = "/login.html";
  });
}

renderNavbar();
