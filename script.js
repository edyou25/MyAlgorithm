const BUILD_VERSION = window.__BUILD_VERSION__ || "dev";
const DATA_PATH = `data/skills.json?v=${encodeURIComponent(BUILD_VERSION)}`;

document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("algorithm-list");
  if (!list) {
    return;
  }

  try {
    const data = await loadData();
    renderList(list, data);
  } catch (error) {
    list.textContent = `Failed to load algorithm list: ${error}`;
  }
});

async function loadData() {
  const response = await fetch(DATA_PATH, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

function renderList(container, data) {
  document.title = data.title || "My Algorithm";

  const title = document.getElementById("site-title");
  if (title && data.title) {
    title.textContent = data.title;
  }

  const subtitle = document.getElementById("site-subtitle");
  if (subtitle && data.subtitle) {
    subtitle.textContent = data.subtitle;
  }

  const sections = data.groups.map((group) => {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    const items = document.createElement("ul");

    heading.textContent = group.name;
    items.append(...group.items.map(createItem));
    section.append(heading, items);

    return section;
  });

  container.replaceChildren(...sections);
}

function createItem(item) {
  const row = document.createElement("li");
  const link = document.createElement("a");

  link.href = resolveFlowchartHref(item.slug);
  link.textContent = item.name;

  row.append(link);
  return row;
}

function resolveFlowchartHref(slug) {
  if (window.location.protocol === "file:" && !window.location.pathname.includes("/site/")) {
    return `site/algorithms/${slug}/`;
  }

  return `algorithms/${slug}/`;
}
