const BUILD_VERSION = window.__BUILD_VERSION__ || "dev";
const DATA_PATH = `data/skills.json?v=${encodeURIComponent(BUILD_VERSION)}`;

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
  renderBags(data.groups);

  if (items.length > 0) {
    updateInspector(items[0], data.groups[0]);
    markSelectedItem(items[0].slug);
  }
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
  headerCopy.append(title);
  header.append(headerCopy);

  const stage = document.createElement("div");
  stage.className = "bag-stage";

  const slots = document.createElement("div");
  slots.className = "bag-stage__slots";
  slots.style.setProperty("--slot-columns", String(determineSlotColumns(group.items.length)));

  slots.replaceChildren(...group.items.map((item) => createItemSlot(group, item)));

  stage.append(slots);
  card.append(header, stage);
  return card;
}

function determineSlotColumns(itemCount) {
  if (itemCount >= 7) {
    return 4;
  }

  if (itemCount >= 4) {
    return 3;
  }

  return 2;
}

function createItemSlot(group, item) {
  const link = document.createElement("a");
  link.className = `item-slot item-slot--${item.rarity}`;
  link.href = resolveFlowchartHref(item.slug);
  link.dataset.slug = item.slug;
  link.title = item.name;
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
  link.addEventListener("click", activate);

  return link;
}

function updateInspector(item, group) {
  const icon = document.getElementById("inspect-icon");
  icon.src = `assets/pixel/icons/${item.icon}`;
  icon.alt = `${item.name} icon`;

  document.getElementById("inspect-group").textContent = group.name;
  document.getElementById("inspect-title").textContent = item.name;
  document.getElementById("inspect-detail").textContent = item.detail;

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
    const isCurrent = slot.dataset.slug === slug;
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
