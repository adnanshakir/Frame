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
  return elements.find(el => el.id === selectedId) || null;
}

/*  UI helpers */

function updateDockState(selected) {
  document.querySelectorAll("#duplicate, #delete").forEach(btn => btn.classList.toggle("disabled", !selected));
}

/* Canvas settings */

propBg.addEventListener("change", (e) => {
  canvas.style.backgroundColor = e.target.value;
});


// Element Creation

btnRect.addEventListener("click", () => {
  elements.push({
    id: generateId(),
    type: "rect",
    x: 50,
    y: 50,
    width: 120,
    height: 80,
    background: "#888",
    rotation: 0
  });
  console.log(elements);
  renderElements();
});

btnCircle.addEventListener("click", () => {
  elements.push({
    id: generateId(),
    type: "circle",
    x: 60,
    y: 60,
    width: 100,
    height: 100,
    background: "#888",
    rotation: 0,
    borderRadius: "50%" // circle metadata
  });
   console.log(elements);
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
    rotation: 0
  });
   console.log(elements);
   renderElements();
});


//  Render elements to canvas

function renderElements() {
  // Clear canvas before re-render
  canvas.innerHTML = "";

  elements.forEach(el => {
    const div = document.createElement("div");

    div.classList.add("element");
    div.dataset.id = el.id;

    // Position & size
    div.style.left = el.x + "px";
    div.style.top = el.y + "px";
    div.style.width = el.width + "px";
    div.style.height = el.height + "px";

    // Appearance
    div.style.background = el.background;
    div.style.transform = `rotate(${el.rotation}deg)`;

    // Shape
    if (el.type === "circle") {
      div.style.borderRadius = "50%";
    }

    // Text
    if (el.type === "text") {
      div.textContent = el.text;
      div.style.background = "transparent";
    }

    // Selection state
    if (el.id === selectedId) {
      div.classList.add("selected");
    }

    canvas.appendChild(div);
  });
}
