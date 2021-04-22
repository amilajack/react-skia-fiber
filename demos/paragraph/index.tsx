import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { init, render } from "../../src";

const htmlCanvasElement = document.createElement("canvas");
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("No root element defined.");
}
rootElement.appendChild(htmlCanvasElement);
document.body.appendChild(htmlCanvasElement);
htmlCanvasElement.width = window.innerWidth * window.devicePixelRatio;
htmlCanvasElement.height = window.innerHeight * window.devicePixelRatio;
htmlCanvasElement.style.width = window.innerWidth + "px";
htmlCanvasElement.style.height = window.innerHeight + "px";

init().then(() => render(<App />, htmlCanvasElement));
