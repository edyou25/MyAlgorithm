const STAGE_WIDTH = 360;
const STAGE_HEIGHT = 270;
const CLOSED_AREA = { x: 74, y: 146, width: 212, height: 56 };
const OPEN_AREA = { x: 68, y: 118, width: 224, height: 88 };
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const state = {
  data: null,
  openChest: null,
  views: [],
  modalSkill: null,
};

const tooltip = document.getElementById("tooltip");
const modal = document.getElementById("skill-modal");
const modalCategory = document.getElementById("modal-category");
const modalTitle = document.getElementById("modal-title");
const modalDetail = document.getElementById("modal-detail");
const modalProficiency = document.getElementById("modal-proficiency");
const modalKeywords = document.getElementById("modal-keywords");
const modalProjects = document.getElementById("modal-projects");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const data = await loadSkillData();
    state.data = data;
    renderPage(data);
    attachGlobalEvents();
  } catch (error) {
    renderFatalState(error);
  }
});

// Load the primary JSON file when possible. A small inline fallback keeps file:// previews working.
async function loadSkillData() {
  const jsonUrl = new URL("data/skills.json", window.location.href).href;

  const importOptions = [{ with: { type: "json" } }, { assert: { type: "json" } }];
  for (const options of importOptions) {
    try {
      const module = await import(jsonUrl, options);
      if (module?.default) {
        return module.default;
      }
    } catch (error) {
      // Ignore and continue to the next loading strategy.
    }
  }

  try {
    const response = await fetch("data/skills.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    const fallback = document.getElementById("skills-data-fallback");
    if (fallback?.textContent.trim()) {
      return JSON.parse(fallback.textContent);
    }
    throw error;
  }
}

function renderPage(data) {
  document.title = data.title;
  document.getElementById("site-title").textContent = data.title;
  document.getElementById("site-subtitle").textContent = data.subtitle;

  renderSummary(data);
  renderChests(data.categories);
}

function renderSummary(data) {
  const skillCount = data.categories.reduce((total, category) => total + category.skills.length, 0);
  const stats = [
    { label: "Treasure Chests", value: data.categories.length },
    { label: "Skill Coins", value: skillCount },
    { label: "Focus", value: "Autonomy + Robotics" },
  ];

  const container = d3.select("#summary-stats");
  container
    .selectAll("div.hero__stat")
    .data(stats)
    .join("div")
    .attr("class", "hero__stat")
    .html((item) => `<strong>${item.value}</strong> ${item.label}`);
}

function renderChests(categories) {
  const grid = d3.select("#chest-grid");

  const cards = grid
    .selectAll("article.chest-card")
    .data(categories, (category) => category.name)
    .join("article")
    .attr("class", "chest-card")
    .attr("style", (category, index) => `--accent: ${category.accent}; --delay: ${index * 110}ms;`)
    .attr("aria-label", (category) => `${category.name} skill chest`);

  const header = cards
    .append("div")
    .attr("class", "chest-card__header");

  const copy = header
    .append("div")
    .attr("class", "chest-card__copy");

  copy.append("h2").text((category) => category.name);
  copy.append("p").text((category) => category.description);

  header
    .append("div")
    .attr("class", "chest-card__badge")
    .text((category) => `${category.skills.length} coins`);

  const stages = cards
    .append("div")
    .attr("class", "chest-stage")
    .attr("role", "button")
    .attr("tabindex", "0")
    .attr("aria-expanded", "false")
    .attr("aria-label", (category) => `Open ${category.name} treasure chest`);

  cards
    .append("div")
    .attr("class", "chest-stage__hint")
    .html('<span>Tap or click to inspect the chest.</span><strong>Click a coin for details</strong>');

  stages.each(function renderEachChest(category, index) {
    const view = createChestView(this, category, index);
    state.views.push(view);
  });
}

// Build one SVG treasure chest and bind coin interactions.
function createChestView(container, category, index) {
  const slug = slugify(category.name);
  const seeded = `${category.name}-${index}`;
  const layout = buildCoinLayout(category.skills, seeded);

  const svg = d3
    .select(container)
    .append("svg")
    .attr("class", "chest-svg")
    .attr("viewBox", `0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`)
    .attr("aria-hidden", "true");

  const defs = svg.append("defs");
  defineGradients(defs, slug, category.accent);
  defs
    .append("clipPath")
    .attr("id", `clip-${slug}`)
    .append("rect")
    .attr("x", 62)
    .attr("y", 106)
    .attr("width", 236)
    .attr("height", 108)
    .attr("rx", 20);

  svg.append("ellipse").attr("class", "chest-shadow").attr("cx", 180).attr("cy", 239).attr("rx", 122).attr("ry", 22).attr("fill", "rgba(2, 5, 10, 0.46)");
  svg.append("ellipse")
    .attr("class", "chest-halo")
    .attr("cx", 180)
    .attr("cy", 126)
    .attr("rx", 112)
    .attr("ry", 72)
    .attr("fill", `url(#glow-${slug})`);

  const sparkleGroup = svg.append("g");
  d3.range(5).forEach((sparkleIndex) => {
    const rng = mulberry32(hashString(`${seeded}-sparkle-${sparkleIndex}`));
    sparkleGroup
      .append("circle")
      .attr("class", "chest-sparkle")
      .attr("cx", 90 + rng() * 180)
      .attr("cy", 66 + rng() * 42)
      .attr("r", 1.4 + rng() * 2.2)
      .attr("fill", "rgba(255, 236, 179, 0.8)");
  });

  svg.append("rect").attr("x", 58).attr("y", 108).attr("width", 244).attr("height", 96).attr("rx", 22).attr("fill", `url(#inner-${slug})`);

  const coinLayer = svg.append("g").attr("clip-path", `url(#clip-${slug})`);
  const coins = coinLayer
    .selectAll("g.coin")
    .data(layout)
    .join("g")
    .attr("class", "coin")
    .attr("transform", (coin) => translateCoin(coin.closed))
    .attr("role", "button")
    .attr("tabindex", "0")
    .attr("aria-label", (coin) => `${coin.skill.name} in ${category.name}. Open details.`);

  const coinShell = coins.append("g").attr("class", "coin-shell");

  coinShell
    .append("circle")
    .attr("r", (coin) => coin.r + 5)
    .attr("fill", "rgba(83, 45, 29, 0.24)");
    coinShell
    .append("circle")
    .attr("r", (coin) => coin.r)
    .attr("fill", `url(#gold-${slug})`)
    .attr("stroke", "#b77708")
    .attr("stroke-width", 2);

  coinShell
    .append("circle")
    .attr("r", (coin) => Math.max(coin.r - 6, 12))
    .attr("fill", "none")
    .attr("stroke", "rgba(255, 244, 201, 0.62)")
    .attr("stroke-width", 1.8);

  coinShell
    .append("path")
    .attr("d", (coin) => `M ${-coin.r * 0.45} ${-coin.r * 0.25} C ${-coin.r * 0.15} ${-coin.r * 0.6}, ${coin.r * 0.2} ${-coin.r * 0.56}, ${coin.r * 0.46} ${-coin.r * 0.16}`)
    .attr("fill", "none")
    .attr("stroke", "rgba(255, 253, 235, 0.72)")
    .attr("stroke-width", 2)
    .attr("stroke-linecap", "round");

  coinShell
    .append("text")
    .attr("class", "coin-label")
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", (coin) => labelFontSize(coin.skill.name, coin.r))
    .text((coin) => coin.skill.name);

  svg.append("rect").attr("x", 48).attr("y", 110).attr("width", 264).attr("height", 118).attr("rx", 28).attr("fill", `url(#wood-${slug})`).attr("stroke", "#4b2718").attr("stroke-width", 2.4);
  svg.append("rect").attr("x", 62).attr("y", 126).attr("width", 236).attr("height", 18).attr("rx", 9).attr("fill", "rgba(255, 233, 183, 0.08)");
  svg.append("rect").attr("x", 78).attr("y", 110).attr("width", 18).attr("height", 118).attr("rx", 7).attr("fill", `url(#band-${slug})`);
  svg.append("rect").attr("x", 171).attr("y", 110).attr("width", 18).attr("height", 118).attr("rx", 7).attr("fill", `url(#band-${slug})`);
  svg.append("rect").attr("x", 264).attr("y", 110).attr("width", 18).attr("height", 118).attr("rx", 7).attr("fill", `url(#band-${slug})`);
  svg.append("rect").attr("x", 144).attr("y", 138).attr("width", 72).attr("height", 14).attr("rx", 7).attr("fill", "rgba(41, 22, 13, 0.36)");
  svg.append("rect").attr("x", 150).attr("y", 148).attr("width", 60).attr("height", 32).attr("rx", 10).attr("fill", `url(#band-${slug})`).attr("stroke", "#8f6922").attr("stroke-width", 1.3);
  svg.append("circle").attr("cx", 180).attr("cy", 164).attr("r", 5).attr("fill", "#705111");

  const lid = svg.append("g").attr("transform", lidTransform(false));
  lid.append("path")
    .attr("d", "M 58 104 C 72 58, 288 58, 302 104 L 302 126 Q 302 136 292 136 L 68 136 Q 58 136 58 126 Z")
    .attr("fill", `url(#wood-${slug})`)
    .attr("stroke", "#4b2718")
    .attr("stroke-width", 2.4);
  lid.append("path")
    .attr("d", "M 72 104 C 86 72, 274 72, 288 104")
    .attr("fill", "none")
    .attr("stroke", "rgba(255, 221, 164, 0.22)")
    .attr("stroke-width", 4)
    .attr("stroke-linecap", "round");
  lid.append("rect").attr("x", 82).attr("y", 92).attr("width", 16).attr("height", 44).attr("rx", 6).attr("fill", `url(#band-${slug})`);
  lid.append("rect").attr("x", 172).attr("y", 86).attr("width", 16).attr("height", 50).attr("rx", 6).attr("fill", `url(#band-${slug})`);
  lid.append("rect").attr("x", 262).attr("y", 92).attr("width", 16).attr("height", 44).attr("rx", 6).attr("fill", `url(#band-${slug})`);

  const card = container.closest(".chest-card");
  const stageSelection = d3.select(container);

  coins
    .on("pointerenter", function handleEnter(event, coin) {
      d3.select(this).classed("is-hovered", true);
      showTooltip(event, coin.skill);
    })
    .on("pointermove", handleTooltipMove)
    .on("pointerleave", function handleLeave() {
      d3.select(this).classed("is-hovered", false);
      hideTooltip();
    })
    .on("focus", function handleFocus(event, coin) {
      d3.select(this).classed("is-hovered", true);
      showTooltipFromElement(this, coin.skill);
    })
    .on("blur", function handleBlur() {
      d3.select(this).classed("is-hovered", false);
      hideTooltip();
    })
    .on("click", function handleCoinClick(event, coin) {
      event.stopPropagation();
      openChest(category.name);
      openSkillModal(category, coin.skill);
    })
    .on("keydown", function handleCoinKeydown(event, coin) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        openChest(category.name);
        openSkillModal(category, coin.skill);
      }
    });

  stageSelection
    .on("click", () => toggleChest(category.name))
    .on("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleChest(category.name);
      }
    });

  return {
    categoryName: category.name,
    card,
    stageSelection,
    coins,
    lid,
    update(isOpen) {
      card.classList.toggle("is-open", isOpen);
      stageSelection.attr("aria-expanded", isOpen ? "true" : "false");

      if (REDUCED_MOTION) {
        lid.attr("transform", lidTransform(isOpen));
        coins.attr("transform", (coin) => translateCoin(isOpen ? coin.open : coin.closed));
        return;
      }

      lid.transition().duration(420).ease(d3.easeCubicOut).attr("transform", lidTransform(isOpen));
      coins
        .transition()
        .duration(460)
        .ease(d3.easeCubicOut)
        .attr("transform", (coin) => translateCoin(isOpen ? coin.open : coin.closed));
    },
  };
}

function defineGradients(defs, slug, accent) {
  const wood = defs.append("linearGradient").attr("id", `wood-${slug}`).attr("x1", "0%").attr("x2", "0%").attr("y1", "0%").attr("y2", "100%");
  wood.append("stop").attr("offset", "0%").attr("stop-color", "#a56a3c");
  wood.append("stop").attr("offset", "46%").attr("stop-color", "#754228");
  wood.append("stop").attr("offset", "100%").attr("stop-color", "#4f2a1c");

  const band = defs.append("linearGradient").attr("id", `band-${slug}`).attr("x1", "0%").attr("x2", "0%").attr("y1", "0%").attr("y2", "100%");
  band.append("stop").attr("offset", "0%").attr("stop-color", "#f6dd89");
  band.append("stop").attr("offset", "100%").attr("stop-color", "#bf8a18");

  const gold = defs.append("radialGradient").attr("id", `gold-${slug}`).attr("cx", "35%").attr("cy", "30%");
  gold.append("stop").attr("offset", "0%").attr("stop-color", "#fff3bf");
  gold.append("stop").attr("offset", "48%").attr("stop-color", "#f0c75f");
  gold.append("stop").attr("offset", "100%").attr("stop-color", "#cf8f11");

  const inner = defs.append("linearGradient").attr("id", `inner-${slug}`).attr("x1", "0%").attr("x2", "0%").attr("y1", "0%").attr("y2", "100%");
  inner.append("stop").attr("offset", "0%").attr("stop-color", "rgba(16, 10, 6, 0.84)");
  inner.append("stop").attr("offset", "100%").attr("stop-color", "rgba(36, 22, 13, 0.92)");

  const glow = defs.append("radialGradient").attr("id", `glow-${slug}`);
  glow.append("stop").attr("offset", "0%").attr("stop-color", colorWithAlpha(accent, 0.4));
  glow.append("stop").attr("offset", "100%").attr("stop-color", colorWithAlpha(accent, 0));
}

function buildCoinLayout(skills, seed) {
  const densityScale = Math.max(0.78, 1 - Math.max(0, skills.length - 5) * 0.05);
  const closedNodes = simulateNodes(skills, `${seed}-closed`, CLOSED_AREA, densityScale, 0.04, 0.12);
  const openNodes = simulateNodes(skills, `${seed}-open`, OPEN_AREA, densityScale, 0.07, 0.08);

  return skills.map((skill, index) => ({
    skill,
    r: closedNodes[index].r,
    closed: { x: closedNodes[index].x, y: closedNodes[index].y },
    open: { x: openNodes[index].x, y: openNodes[index].y },
  }));
}

function simulateNodes(skills, seed, area, densityScale, xStrength, yStrength) {
  const rng = mulberry32(hashString(seed));

  const nodes = skills.map((skill) => {
    const baseRadius = clamp(25 + skill.name.length * 0.85, 24, 38) * densityScale;
    return {
      x: area.x + area.width * (0.15 + rng() * 0.7),
      y: area.y + area.height * (0.14 + rng() * 0.72),
      r: baseRadius,
    };
  });

  const sim = d3
    .forceSimulation(nodes)
    .force("x", d3.forceX(area.x + area.width / 2).strength(xStrength))
    .force("y", d3.forceY(area.y + area.height * 0.5).strength(yStrength))
    .force("collide", d3.forceCollide().radius((node) => node.r + 5).iterations(2).strength(1))
    .stop();

  for (let i = 0; i < 180; i += 1) {
    sim.tick();
    nodes.forEach((node) => constrainNode(node, area));
  }

  return nodes;
}

function constrainNode(node, area) {
  node.x = clamp(node.x, area.x + node.r, area.x + area.width - node.r);
  node.y = clamp(node.y, area.y + node.r, area.y + area.height - node.r);
}

function toggleChest(categoryName) {
  state.openChest = state.openChest === categoryName ? null : categoryName;
  updateChestStates();
}

function openChest(categoryName) {
  state.openChest = categoryName;
  updateChestStates();
}

function updateChestStates() {
  state.views.forEach((view) => view.update(view.categoryName === state.openChest));
}

function showTooltip(event, skill) {
  tooltip.innerHTML = `<strong>${skill.name}</strong><span>${skill.detail}</span>`;
  tooltip.hidden = false;
  positionTooltip(event.clientX, event.clientY);
}

function showTooltipFromElement(element, skill) {
  const rect = element.getBoundingClientRect();
  tooltip.innerHTML = `<strong>${skill.name}</strong><span>${skill.detail}</span>`;
  tooltip.hidden = false;
  positionTooltip(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function handleTooltipMove(event) {
  positionTooltip(event.clientX, event.clientY);
}

function positionTooltip(clientX, clientY) {
  const gap = 14;
  const bounds = tooltip.getBoundingClientRect();
  const x = clamp(clientX + gap, 12, window.innerWidth - bounds.width - 12);
  const y = clamp(clientY + gap, 12, window.innerHeight - bounds.height - 12);
  tooltip.style.transform = `translate(${x}px, ${y}px)`;
}

function hideTooltip() {
  tooltip.hidden = true;
}

function openSkillModal(category, skill) {
  state.modalSkill = skill;
  modalCategory.textContent = category.name;
  modalTitle.textContent = skill.name;
  modalDetail.textContent = skill.detail;
  modalProficiency.textContent = skill.proficiency || "No proficiency note provided.";

  modalKeywords.innerHTML = "";
  (skill.keywords || []).forEach((keyword) => {
    const token = document.createElement("span");
    token.className = "token";
    token.textContent = keyword;
    modalKeywords.appendChild(token);
  });

  modalProjects.innerHTML = "";
  (skill.projects || []).forEach((project) => {
    const item = document.createElement("li");
    item.textContent = project;
    modalProjects.appendChild(item);
  });

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeSkillModal() {
  state.modalSkill = null;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function attachGlobalEvents() {
  document.addEventListener("click", (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") {
      closeSkillModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideTooltip();
      if (!modal.hidden) {
        closeSkillModal();
      }
    }
  });

  window.addEventListener("resize", hideTooltip);
  window.addEventListener("scroll", hideTooltip, { passive: true });
}

function renderFatalState(error) {
  const grid = document.getElementById("chest-grid");
  grid.innerHTML = "";

  const panel = document.createElement("section");
  panel.className = "intro-card";
  panel.innerHTML = `
    <p>Skill data could not be loaded.</p>
    <p class="hero__subtitle">Open the browser console for details. ${escapeHtml(String(error))}</p>
  `;
  grid.replaceWith(panel);
}

function translateCoin(position) {
  return `translate(${position.x}, ${position.y})`;
}

function lidTransform(isOpen) {
  return isOpen ? "translate(0,-10) rotate(-22 180 126)" : "translate(0,0) rotate(0 180 126)";
}

function labelFontSize(label, radius) {
  if (label.length <= 4) {
    return Math.min(18, radius * 0.75);
  }

  if (label.length <= 7) {
    return Math.min(14.5, radius * 0.56);
  }

  return Math.min(12.5, radius * 0.46);
}

function slugify(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function colorWithAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = clean.length === 3 ? clean.split("").map((char) => char + char).join("") : clean;
  const number = Number.parseInt(value, 16);
  const r = (number >> 16) & 255;
  const g = (number >> 8) & 255;
  const b = number & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hashString(input) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return function next() {
    value += 0x6d2b79f5;
    let temp = value;
    temp = Math.imul(temp ^ (temp >>> 15), temp | 1);
    temp ^= temp + Math.imul(temp ^ (temp >>> 7), temp | 61);
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
