import type { CanvasKit, Canvas, Surface } from "canvaskit-wasm";
import { Color } from "canvaskit-wasm";
import type { MutableRefObject, ReactNode } from "react";
import { toSkColor } from "./helpers";
import { is } from "./is";
import { CkElement } from "./types";

export interface CkCanvasProps {
  clear?: Color | string;
  rotate?: { degree: number; px?: number; py?: number };
  children?: ReactNode;
  ref?: MutableRefObject<CkCanvas | undefined>;
}

export default class CkCanvas implements CkCanvasProps {
  readonly canvasKit: CanvasKit;
  skObject?: Canvas;
  readonly name = "SkCanvas";
  readonly skObjectType = "SkCanvas";
  readonly type: "skCanvas" = "skCanvas";
  children: CkElement[] = [];

  clear = "#FFFFFF"

  private deleted = false;

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
  }

  render(surface: Surface) {
    this.skObject = surface.getCanvas();
    this.skObject.save();
    this.drawSelf(this.skObject);
    this.children.forEach((child) => child.render(this.skObject!));
    this.skObject.restore();
    surface.flush();
  }

  private drawSelf(skCanvas: Canvas) {
    const skColor = toSkColor(this.canvasKit, this.clear);
    if (skColor) {
      skCanvas.clear(skColor);
    }

    if (this.rotate) {
      const { degree, px, py } = this.rotate;
      skCanvas.rotate(degree, px ?? 0, py ?? 0);
    }
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    // The canvas object is 1-to-1 linked to the parent surface object, so deleting it means we could never recreate it.
    // this.skObject = undefined;
  }
}
