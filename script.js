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

  slots.replaceChildren(...group.items.map((item) => createItemSlot(group, item)));

  stage.append(slots);
  card.append(header, stage);
  return card;
}

function createItemSlot(group, item) {
  const link = document.createElement("a");
  link.className = `item-slot item-slot--${item.rarity}`;
  link.href = resolveFlowchartHref(item.slug);
  link.dataset.slug = item.slug;
  link.title = item.name;
  link.setAttribute("aria-label", `Open ${item.name} flowchart page`);

  const badge = document.createElement("span");
  badge.className = "item-slot__badge";
  badge.textContent = item.name;

  const iconFrame = document.createElement("div");
  iconFrame.className = "item-slot__icon-frame";

  const icon = document.createElement("img");
  icon.className = "item-slot__icon";
  icon.src = `assets/pixel/icons/${item.icon}`;
  icon.alt = "";
  icon.setAttribute("aria-hidden", "true");
  queueIconNormalization(icon);

  iconFrame.append(icon);

  const srText = document.createElement("span");
  srText.className = "item-slot__sr";
  srText.textContent = item.name;

  link.append(badge, iconFrame, srText);

  const activate = () => {
    updateInspector(item, group);
    markSelectedItem(item.slug);
  };

  link.addEventListener("pointerenter", activate);
  link.addEventListener("focus", activate);
  link.addEventListener("click", activate);

  return link;
}

function queueIconNormalization(icon) {
  if (icon.complete) {
    normalizeIcon(icon);
    return;
  }

  icon.addEventListener("load", () => normalizeIcon(icon), { once: true });
}

function normalizeIcon(icon) {
  if (icon.dataset.normalized === "true" || icon.naturalWidth === 0 || icon.naturalHeight === 0) {
    return;
  }

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = icon.naturalWidth;
  sourceCanvas.height = icon.naturalHeight;

  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) {
    return;
  }

  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(icon, 0, 0);

  const pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height).data;
  const bounds = findVisibleBounds(pixels, sourceCanvas.width, sourceCanvas.height);
  if (!bounds) {
    return;
  }

  const outputSize = 64;
  const padding = 10;
  const contentWidth = bounds.maxX - bounds.minX + 1;
  const contentHeight = bounds.maxY - bounds.minY + 1;
  const scale = (outputSize - padding * 2) / Math.max(contentWidth, contentHeight);
  const drawWidth = Math.round(contentWidth * scale);
  const drawHeight = Math.round(contentHeight * scale);
  const drawX = Math.floor((outputSize - drawWidth) / 2);
  const drawY = Math.floor((outputSize - drawHeight) / 2);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputSize;
  outputCanvas.height = outputSize;

  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) {
    return;
  }

  outputContext.imageSmoothingEnabled = false;
  outputContext.drawImage(
    sourceCanvas,
    bounds.minX,
    bounds.minY,
    contentWidth,
    contentHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  );

  icon.dataset.normalized = "true";
  icon.src = outputCanvas.toDataURL("image/png");
}

function findVisibleBounds(pixels, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3];
      if (alpha <= 8) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return { minX, minY, maxX, maxY };
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
