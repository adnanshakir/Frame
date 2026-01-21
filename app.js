/* Canvas (where everything lives) */
const canvas = document.getElementById("canvas");

/* Dock buttons (creation & actions) */
const btnSelect = document.getElementById("tool-select");
const btnRect = document.getElementById("add-rect");
const btnCircle = document.getElementById("add-circle");
const btnText = document.getElementById("add-text");
const btnDuplicate = document.getElementById("duplicate");
const btnDelete = document.getElementById("delete");

/* Layers panel */
const layersList = document.getElementById("layers-list");

/* Properties panel inputs */

const propWidth = document.getElementById("prop-width");
const propHeight = document.getElementById("prop-height");
const propCorner = document.getElementById("prop-corner");
const propBg = document.getElementById("prop-bg");

/* Text-only property (shown only when a text element is selected) */

const propTextWrap = document.getElementById("prop-text-wrap");
const propText = document.getElementById("prop-text");

/* Global editor state */

let elements = [];
let selectedId = null;
let activeTool = "select";
let idCounter = 0;

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
  elements.push({
    id: generateId(),
    type: "rect",
    x: 200,
    y: 50,
    width: 120,
    height: 80,
    background: "lightblue",
    rotation: 0,
  });
  renderElements();
});

btnCircle.addEventListener("click", () => {
  elements.push({
    id: generateId(),
    type: "circle",
    x: 60,
    y: 50,
    width: 100,
    height: 100,
    background: "#1e1e",
    rotation: 0,
    borderRadius: "50%", // circle metadata
  });
  renderElements();
});

btnText.addEventListener("click", () => {
  elements.push({
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
  });
  //  console.log(elements);
  renderElements();
});

/* Canvas settings */

propBg.addEventListener("change", (e) => {
  const el = getSelectedElement();

  if (el) {
    el.background = e.target.value;
    renderElements();
  } else {
    canvas.style.backgroundColor = e.target.value;
  }
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
    }

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
