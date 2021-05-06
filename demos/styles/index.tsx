import React from "react";
import App from "./App";
import { init, render } from "../../src";

const canvas = document.createElement("canvas");
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No root element defined.");
}
rootElement.appendChild(canvas);
document.body.appendChild(canvas);
canvas.width = window.innerWidth * window.devicePixelRatio;
canvas.height = window.innerHeight * window.devicePixelRatio;
canvas.style.width = window.innerWidth + "px";
canvas.style.height = window.innerHeight + "px";

init().then((canvasKit) => render(<App />, canvas, { canvasKit, frameloop: "demand" }));
