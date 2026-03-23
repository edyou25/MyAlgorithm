const DATA_PATH = "data/skills.json";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadInventoryData();
    renderInventoryPage(data);
  } catch (error) {
    renderError(error);
  }
});

async function loadInventoryData() {
  const response = await fetch(DATA_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${DATA_PATH} (${response.status})`);
  }
  return response.json();
}

function renderInventoryPage(data) {
  document.title = data.title;
  document.getElementById("site-title").textContent = data.title;
  document.getElementById("site-subtitle").textContent = data.subtitle;

  const items = data.groups.flatMap((group) => group.items.map((item) => ({ ...item, group })));
  renderStats(data.groups, items);
  renderBags(data.groups);

  if (items.length > 0) {
    updateInspector(items[0], data.groups[0]);
    markSelectedItem(items[0].slug);
  }
}

function renderStats(groups, items) {
  const stats = [
    { label: "Packs", value: groups.length },
    { label: "Flowcharts", value: items.length },
    { label: "Primary Build", value: "MkDocs" },
    { label: "Home Style", value: "Pixel Inventory" },
  ];

  const container = document.getElementById("inventory-stats");
  container.replaceChildren(...stats.map(createStatChip));
}

function createStatChip(stat) {
  const chip = document.createElement("div");
  chip.className = "stat-chip";

  const title = document.createElement("strong");
  title.textContent = stat.label;

  const value = document.createElement("span");
  value.textContent = String(stat.value);

  chip.append(title, value);
  return chip;
}

function renderBags(groups) {
  const bagGrid = document.getElementById("bag-grid");
  const cards = groups.map((group) => createBagCard(group));
  bagGrid.replaceChildren(...cards);
}

function createBagCard(group) {
  const card = document.createElement("article");
  card.className = "bag-card";
  card.style.setProperty("--accent", group.accent);

  const header = document.createElement("div");
  header.className = "bag-card__header";

  const headerCopy = document.createElement("div");

  const title = document.createElement("h3");
  title.className = "bag-card__title";
  title.textContent = group.name;

  const description = document.createElement("p");
  description.className = "bag-card__description";
  description.textContent = group.description;

  headerCopy.append(title, description);

  const count = document.createElement("div");
  count.className = "bag-card__count";
  const capacity = Number(group.capacity) || group.items.length;
  count.textContent = `${group.items.length} / ${capacity} slots`;

  header.append(headerCopy, count);

  const stage = document.createElement("div");
  stage.className = "bag-stage";

  const art = document.createElement("img");
  art.className = "bag-stage__art";
  art.src = "assets/pixel/backpack-panel.png";
  art.alt = "";
  art.setAttribute("aria-hidden", "true");

  const slots = document.createElement("div");
  slots.className = "bag-stage__slots";

  const filledSlots = group.items.map((item) => createItemSlot(group, item));
  const emptySlots = Array.from({ length: Math.max(0, capacity - group.items.length) }, createEmptySlot);
  slots.replaceChildren(...filledSlots, ...emptySlots);

  stage.append(art, slots);
  card.append(header, stage);
  return card;
}

function createItemSlot(group, item) {
  const link = document.createElement("a");
  link.className = `item-slot item-slot--${item.rarity}`;
  link.href = resolveFlowchartHref(item.slug);
  link.setAttribute("aria-label", `Open ${item.name} flowchart page`);

  const icon = document.createElement("img");
  icon.className = "item-slot__icon";
  icon.src = `assets/pixel/icons/${item.icon}`;
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");

  const srText = document.createElement("span");
  srText.className = "item-slot__sr";
  srText.textContent = item.name;

  link.append(icon, srText);

  const activate = () => {
    updateInspector(item, group);
    markSelectedItem(item.slug);
  };

  link.addEventListener("pointerenter", activate);
  link.addEventListener("focus", activate);

  return link;
}

function createEmptySlot() {
  const slot = document.createElement("div");
  slot.className = "item-slot--empty";
  slot.setAttribute("aria-hidden", "true");
  return slot;
}

function updateInspector(item, group) {
  const icon = document.getElementById("inspect-icon");
  icon.src = `assets/pixel/icons/${item.icon}`;
  icon.alt = `${item.name} icon`;

  document.getElementById("inspect-group").textContent = group.name;
  document.getElementById("inspect-title").textContent = item.name;
  document.getElementById("inspect-detail").textContent = item.detail;
  document.getElementById("inspect-route").textContent = `/algorithms/${item.slug}/`;
  document.getElementById("inspect-rarity").textContent = item.rarity;

  const link = document.getElementById("inspect-link");
  link.href = resolveFlowchartHref(item.slug);
  link.textContent = `Open ${item.name} Flowchart`;

  const tags = document.getElementById("inspect-tags");
  tags.replaceChildren(...(item.keywords || []).map(createTag));
}

function createTag(text) {
  const tag = document.createElement("span");
  tag.className = "inspect-tag";
  tag.textContent = text;
  return tag;
}

function markSelectedItem(slug) {
  document.querySelectorAll(".item-slot").forEach((slot) => {
    const isCurrent = slot.href.endsWith(`/algorithms/${slug}/`) || slot.href.endsWith(`/site/algorithms/${slug}/`);
    slot.classList.toggle("is-selected", isCurrent);
  });
}

function resolveFlowchartHref(slug) {
  if (window.location.protocol === "file:" && !window.location.pathname.includes("/site/")) {
    return `site/algorithms/${slug}/`;
  }

  return `algorithms/${slug}/`;
}

function renderError(error) {
  const board = document.querySelector(".inventory-layout");
  if (!board) {
    return;
  }

  const panel = document.createElement("div");
  panel.className = "inventory-error";
  panel.innerHTML = `
    <strong>Inventory data could not be loaded.</strong>
    <p>Run a local static server or build the full site bundle first. ${escapeHtml(String(error))}</p>
  `;

  board.replaceChildren(panel);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
