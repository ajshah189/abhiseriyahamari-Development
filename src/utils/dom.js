const SVG_NS = "http://www.w3.org/2000/svg";

export function $(id) {
  return document.getElementById(id);
}

export function createSvgElement(tagName) {
  return document.createElementNS(SVG_NS, tagName);
}

export function setHidden(el, hidden) {
  if (el) el.classList.toggle("hidden", hidden);
}

export function copyText(text) {
  navigator.clipboard?.writeText(text).catch(() => {});
}
