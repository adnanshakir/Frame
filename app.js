/* Canvas (where everything lives) */
const canvas = document.getElementById("canvas");

/* Dock buttons (creation & actions) */
const btnSelect = document.getElementById("tool-select");
const btnRect = document.getElementById("add-rect");
const btnCircle = document.getElementById("add-circle");
const btnText = document.getElementById("add-text");
const btnDuplicate = document.getElementById("duplicate");
const btnDelete = document.getElementById("delete");
const btnExportJson = document.getElementById("export-json");
const btnExportHtml = document.getElementById("export-html");


/* Layers panel */
const layersList = document.getElementById("layers-list");

/* Properties panel inputs */

const propWidth = document.getElementById("prop-width");
const propHeight = document.getElementById("prop-height");
const propCorner = document.getElementById("prop-corner");
const propBg = document.getElementById("prop-bg");
const propBgLabel = document.getElementById("prop-label");
const propRotate = document.getElementById("prop-rotate");

/* Text-only property (shown only when a text element is selected) */

const propTextWrap = document.getElementById("prop-text-wrap");
const propText = document.getElementById("prop-text");

/* Global editor state */

let elements = [];
let selectedId = null;
let activeTool = "select";
let idCounter = 0;

// Info / Shortcuts toggle
const SHORTCUTS_SEEN_KEY = "shortcuts_seen";

const infoBtn = document.getElementById("info-btn");
const shortcuts = document.getElementById("shortcuts");
const overlay = document.getElementById("overlay");

// stop pulse if already seen
if (localStorage.getItem(SHORTCUTS_SEEN_KEY)) {
  infoBtn.classList.remove("pulse");
}

infoBtn.addEventListener("click", () => {
  shortcuts.classList.toggle("hidden");
  overlay.classList.toggle("hidden");

  // mark as seen on first open
  if (!localStorage.getItem(SHORTCUTS_SEEN_KEY)) {
    localStorage.setItem(SHORTCUTS_SEEN_KEY, "true");
    infoBtn.classList.remove("pulse");
  }
});

overlay.addEventListener("click", closeShortcuts);

function closeShortcuts() {
  shortcuts.classList.add("hidden");
  overlay.classList.add("hidden");
}


/* Helpers*/

function generateId() {
  return `el_${idCounter++}`;
}

function getSelectedElement() {
  return elements.find((el) => el.id === selectedId) || null;
}

/*  UI helpers */

function updateDockState(selected) {
  document
    .querySelectorAll("#duplicate, #delete")
    .forEach((btn) => btn.classList.toggle("disabled", !selected));
}

// Element Creation

btnRect.addEventListener("click", () => {
  const newElement = {
    id: generateId(),
    type: "rect",
    x: 200,
    y: 50,
    width: 120,
    height: 80,
    background: "#3e5050",
    rotation: 0,
  };

  elements.push(newElement);
  renderElements();
  renderLayers();
});

btnCircle.addEventListener("click", () => {
  const newElement = {
    id: generateId(),
    type: "circle",
    x: 60,
    y: 50,
    width: 100,
    height: 100,
    background: "#80ec22",
    rotation: 0,
    borderRadius: "50%",
  };

  elements.push(newElement);
  renderElements();
  renderLayers();
});

btnText.addEventListener("click", () => {
  const newElement = {
    id: generateId(),
    type: "text",
    x: 70,
    y: 70,
    width: 140,
    height: 40,
    background: "transparent",
    text: "Text",
    rotation: 0,
    color: "black",
  };

  elements.push(newElement);
  renderElements();
  renderLayers();
});

/* Canvas settings */

propBg.addEventListener("input", (e) => {
  const el = getSelectedElement();

  if (!el) {
    canvas.style.backgroundColor = e.target.value;
    return;
  }

  if (el.type === "text") {
    el.color = e.target.value; // text color
  } else {
    el.background = e.target.value; // shape background
  }

  renderElements();
});

//  Render elements to canvas

function renderElements() {
  // Clear canvas before re-render
  canvas.innerHTML = "";

  elements.forEach((el) => {
    const div = document.createElement("div");

    div.classList.add("element");
    div.dataset.id = el.id;

    // Position & size
    div.style.left = el.x + "px";
    div.style.top = el.y + "px";
    div.style.width = el.width + "px";
    div.style.height = el.height + "px";

    // Appearance
    div.style.color = el.color;
    div.style.background = el.background;
    div.style.transform = `rotate(${el.rotation}deg)`;

    // Shape
    if (el.type === "circle") {
      div.style.borderRadius = "100%";
    }

    // Text
    if (el.type === "text") {
      div.textContent = el.text;
      div.style.background = "transparent";
      div.style.display = "flex";
      div.style.alignItems = "center";
      div.style.justifyContent = "center";
    }

    // Selection state
    if (el.id === selectedId) {
      div.classList.add("selected");
      syncProperties();
    }

    // Rotation handle
    div.style.transform = `rotate(${el.rotation}deg)`;

    // Resize handler

    if (el.id === selectedId) {
      div.classList.add("selected");

      const handles = ["tl", "tr", "bl", "br"];

      handles.forEach((pos) => {
        const handle = document.createElement("div");
        handle.classList.add("handle", pos);
        div.appendChild(handle);
      });
    }
    syncProperties();
    saveLayout();
    canvas.appendChild(div);
  });
}

// Selection handling

canvas.addEventListener("click", (e) => {
  if (e.target.classList.contains("element")) {
    selectedId = e.target.dataset.id;

    renderElements();
    updateDockState(selectedId);
  } else {
    selectedId = null;

    renderElements();
    updateDockState(selectedId);
  }
});

// Draging & resizing

let isResizing = false;
let isDragging = false;
let resizeCorner = null;

let resizeStart = {
  mouseX: 0,
  mouseY: 0,
  elX: 0,
  elY: 0,
  width: 0,
  height: 0,
  corner: null,
};

let dragStart = {
  mouseX: 0,
  mouseY: 0,
  elX: 0,
  elY: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

canvas.addEventListener("mousedown", (e) => {
  // RESIZE START
  if (e.target.classList.contains("handle")) {
    isResizing = true;
    isDragging = false;

    if (e.target.classList.contains("tl")) resizeCorner = "tl";
    else if (e.target.classList.contains("tr")) resizeCorner = "tr";
    else if (e.target.classList.contains("bl")) resizeCorner = "bl";
    else if (e.target.classList.contains("br")) resizeCorner = "br";

    const el = getSelectedElement();

    resizeStart.mouseX = e.clientX;
    resizeStart.mouseY = e.clientY;
    resizeStart.elX = el.x;
    resizeStart.elY = el.y;
    resizeStart.width = el.width;
    resizeStart.height = el.height;

    e.stopPropagation();
    return;
  }

  // DRAG START
  if (
    e.target.classList.contains("element") &&
    e.target.dataset.id === selectedId
  ) {
    isDragging = true;
    isResizing = false;

    const el = getSelectedElement();

    dragStart.mouseX = e.clientX;
    dragStart.mouseY = e.clientY;
    dragStart.elX = el.x;
    dragStart.elY = el.y;
  }
});

canvas.addEventListener("mousemove", (e) => {
  // RESIZE
  if (isResizing) {
    const el = getSelectedElement();

    const dx = e.clientX - resizeStart.mouseX;
    const dy = e.clientY - resizeStart.mouseY;

    let newX = resizeStart.elX;
    let newY = resizeStart.elY;
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;

    if (resizeCorner === "tl") {
      newWidth -= dx;
      newHeight -= dy;
      newX += dx;
      newY += dy;
    } else if (resizeCorner === "tr") {
      newWidth += dx;
      newHeight -= dy;
      newY += dy;
    } else if (resizeCorner === "bl") {
      newWidth -= dx;
      newHeight += dy;
      newX += dx;
    } else if (resizeCorner === "br") {
      newWidth += dx;
      newHeight += dy;
    }

    newWidth = Math.max(newWidth, 20);
    newHeight = Math.max(newHeight, 20);

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;

    newX = clamp(newX, 0, canvasW - newWidth);
    newY = clamp(newY, 0, canvasH - newHeight);

    el.x = newX;
    el.y = newY;
    el.width = newWidth;
    el.height = newHeight;

    renderElements();
    return;
  }

  // DRAG
  if (isDragging) {
    const dx = e.clientX - dragStart.mouseX;
    const dy = e.clientY - dragStart.mouseY;

    const el = getSelectedElement();

    let newX = dragStart.elX + dx;
    let newY = dragStart.elY + dy;

    const canvasW = canvas.clientWidth;
    const canvasH = canvas.clientHeight;

    el.x = clamp(newX, 0, canvasW - el.width);
    el.y = clamp(newY, 0, canvasH - el.height);

    renderElements();
  }
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  isResizing = false;
  resizeCorner = null;
});

function duplicateSelected() {
  const el = getSelectedElement();
  if (!el) return;

  const OFFSET = 20;
  const canvasW = canvas.clientWidth;
  const canvasH = canvas.clientHeight;

  const copy = {
    ...el,
    id: generateId(),
    x: Math.min(el.x + OFFSET, canvasW - el.width),
    y: Math.min(el.y + OFFSET, canvasH - el.height),
  };

  elements.push(copy);
  selectedId = copy.id;
  renderElements();
  renderLayers();
  updateDockState(selectedId);
  syncProperties();
}

function deleteSelected() {
  if (!selectedId) return;

  elements = elements.filter((el) => el.id !== selectedId);
  selectedId = null;
  renderElements();
  updateDockState(selectedId);
  renderLayers();
  syncProperties();
}

// Keyboard shortcuts

btnDuplicate.addEventListener("click", duplicateSelected);
btnDelete.addEventListener("click", deleteSelected);

window.addEventListener("keydown", (e) => {
  const isLayersFocused = document.activeElement.closest(".layers");

  if (!selectedId) return;

  // prevent page scroll for arrows
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
  }

  // LAYERS CONTEXT
  if (isLayersFocused) {
    if (e.key === "ArrowUp") moveLayerUp();
    if (e.key === "ArrowDown") moveLayerDown();
    return;
  }

  // CANVAS CONTEXT
  const MOVE_STEP = 10;

  if (e.key === "Delete") {
    deleteSelected();
  } else if (e.key === "Escape") {
    selectedId = null;
    updateDockState(selectedId);
    renderElements();
    renderLayers();
    syncProperties();
  } else if (e.key.toLowerCase() === "d" && e.shiftKey && e.altKey) {
    duplicateSelected();
  } else if (e.key === "ArrowUp") {
    const el = getSelectedElement();
    el.y = Math.max(0, el.y - MOVE_STEP);
    renderElements();
  } else if (e.key === "ArrowDown") {
    const el = getSelectedElement();
    el.y = Math.min(canvas.clientHeight - el.height, el.y + MOVE_STEP);
    renderElements();
  } else if (e.key === "ArrowLeft") {
    const el = getSelectedElement();
    el.x = Math.max(0, el.x - MOVE_STEP);
    renderElements();
  } else if (e.key === "ArrowRight") {
    const el = getSelectedElement();
    el.x = Math.min(canvas.clientWidth - el.width, el.x + MOVE_STEP);
    renderElements();
  }
});

// Layers panel and its Properties

function renderLayers() {
  layersList.innerHTML = "";

  [...elements].reverse().forEach((el) => {
    const li = document.createElement("li");
    li.textContent = `${el.type.charAt(0).toUpperCase() + el.type.slice(1)}`;
    li.classList.add("layer-item");
    li.dataset.id = el.id;
    li.classList.toggle("active", el.id === selectedId);

    layersList.appendChild(li);
  });
}

layersList.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  selectedId = li.dataset.id;
  renderElements();
  updateDockState(selectedId);
  renderLayers();
  syncProperties();
});

function moveLayerUp() {
  if (!selectedId) return;

  const i = elements.findIndex((el) => el.id === selectedId);
  if (i < elements.length - 1) {
    [elements[i], elements[i + 1]] = [elements[i + 1], elements[i]];
  }

  renderElements();
  renderLayers();
}

function moveLayerDown() {
  if (!selectedId) return;

  const i = elements.findIndex((el) => el.id === selectedId);
  if (i > 0) {
    [elements[i], elements[i - 1]] = [elements[i - 1], elements[i]];
  }

  renderElements();
  renderLayers();
}

function syncProperties() {
  const el = getSelectedElement();

  // NO SELECTION
  if (!el) {
    propWidth.value = "";
    propHeight.value = "";
    propBg.value = "#000000";
    propText.value = "";
    propText.disabled = true;

    propRotate.value = 0;
    propRotate.disabled = true;

    propWidth.disabled = true;
    propHeight.disabled = true;
    return;
  }

  // ✅ SELECTION EXISTS (THIS WAS MISSING)
  propWidth.disabled = false;
  propHeight.disabled = false;
  propRotate.disabled = false;

  propWidth.value = el.width;
  propHeight.value = el.height;
  propBg.value = el.background || "#000000";
  propRotate.value = el.rotation || 0;

  if (el.type === "text") {
    propText.value = el.text;
    propText.disabled = false;
  } else {
    propText.value = "";
    propText.disabled = true;
  }
}

propWidth.addEventListener("input", (e) => {
  const el = getSelectedElement();
  if (!el) return;

  const MIN_SIZE = 20;
  const maxW = canvas.clientWidth - el.x;

  el.width = clamp(Number(e.target.value), MIN_SIZE, maxW);
  renderElements();
});

propHeight.addEventListener("input", (e) => {
  const el = getSelectedElement();
  if (!el) return;

  const MIN_SIZE = 20;
  const maxH = canvas.clientHeight - el.y;

  el.height = clamp(Number(e.target.value), MIN_SIZE, maxH);
  renderElements();
});

propText.addEventListener("input", (e) => {
  const el = getSelectedElement();
  if (!el || el.type !== "text") return;
  el.text = e.target.value;
  renderElements();
});

propRotate.addEventListener("input", (e) => {
  const el = getSelectedElement();
  if (!el) return;

  el.rotation = Number(e.target.value) || 0;
  renderElements();
});

function saveLayout() {
  localStorage.setItem("frame_layout", JSON.stringify(elements));
}

function loadLayout() {
  const data = localStorage.getItem("frame_layout");
  if (!data) return;

  elements = JSON.parse(data);
  selectedId = null;
  renderElements();
  renderLayers();
  syncProperties();
}

function exportJSON() {
  const data = JSON.stringify(elements, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "frame-layout.json";
  a.click();

  URL.revokeObjectURL(url);
}

btnExportJson.addEventListener("click", exportJSON);

function exportHTML() {
  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Frame Export</title>
<style>
  body { margin: 0; background: #f0f0f0; }
  .canvas {
    position: relative;
    width: 800px;
    height: 600px;
    margin: 40px auto;
    background: #fff;
  }
</style>
</head>
<body>
<div class="canvas">
`;

  elements.forEach((el) => {
    let styles = `
      position:absolute;
      left:${el.x}px;
      top:${el.y}px;
      width:${el.width}px;
      height:${el.height}px;
      transform:rotate(${el.rotation}deg);
    `;

    if (el.type === "text") {
      styles += `
        background:transparent;
        color:${el.color || "#000"};
        white-space:pre-wrap;
      `;
      html += `<div style="${styles}">${el.text}</div>`;
    } else {
      styles += `
        background:${el.background};
        ${el.type === "circle" ? "border-radius:50%;" : ""}
      `;
      html += `<div style="${styles}"></div>`;
    }
  });

  html += `
</div>
</body>
</html>
`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "frame-export.html";
  a.click();

  URL.revokeObjectURL(url);
}

btnExportHtml.addEventListener("click", exportHTML);

// init
loadLayout();
