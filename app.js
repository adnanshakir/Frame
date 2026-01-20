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

/* Global editor state (base) */

/* Stores all elements on canvas */
let elements = [];

/* Currently selected element id null means nothing is selected */

let selectedId = null;

/* Current tool (select / rect / text etc.) default is select */

let activeTool = "select";

/* Utility helpers (placeholders) */

/* Get selected element from state (used everywhere, so keeping it simple) */

function getSelectedElement() {
  return elements.find((el) => el.id === selectedId) || null;
}

function updateDockState(selected) {
  document
    .querySelectorAll("#duplicate, #delete")
    .forEach((btn) => btn.classList.toggle("disabled", !selected));
}
