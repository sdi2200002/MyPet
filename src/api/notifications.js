const BASE = "/api";

function makeId() {
  return `n_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
  return res.json();
}

// ✅ Φέρνει notifications για user (τελευταία πρώτα)
export async function listNotifications({ userId, limit = 5 }) {
  const qs = new URLSearchParams({
    userId: String(userId),
    _sort: "createdAt",
    _order: "desc",
    _limit: String(limit),
  });
  return fetchJSON(`${BASE}/notifications?${qs.toString()}`);
}

// ✅ Δημιουργία notification
export async function createNotification(payload) {
  const body = {
    id: payload.id || makeId(),
    userId: String(payload.userId),
    createdAt: payload.createdAt || new Date().toISOString(),
    readAt: null,
    type: payload.type || "info",
    title: payload.title || "",
    message: payload.message || "",
    refType: payload.refType || "",
    refId: payload.refId || "",
  };

  return fetchJSON(`${BASE}/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ✅ Mark read (1 notification)
export async function markNotificationRead(id) {
  return fetchJSON(`${BASE}/notifications/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ readAt: new Date().toISOString() }),
  });
}

// ✅ Mark all read (όλα του user)
export async function markAllRead(userId) {
  const items = await fetchJSON(`${BASE}/notifications?userId=${encodeURIComponent(String(userId))}`);
  await Promise.all(
    (items || [])
      .filter((n) => !n.readAt)
      .map((n) =>
        fetchJSON(`${BASE}/notifications/${encodeURIComponent(String(n.id))}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readAt: new Date().toISOString() }),
        })
      )
  );
  return true;
}
