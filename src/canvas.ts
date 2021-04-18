import type { CanvasKit, SkCanvas } from "canvaskit-oc";
import { Color } from "canvaskit-wasm";
import type { MutableRefObject, ReactNode } from "react";
import { toSkColor } from "./helpers";
import { is } from "./is";
import { CkContainer, CkElement } from "./types";
export interface CkCanvasProps extends CkElementProps<SkCanvas> {
  clear?: Color | string;
  rotate?: { degree: number; px?: number; py?: number };
  children?: ReactNode;
  ref?: MutableRefObject<CkCanvas | undefined>;
}

export default class CkCanvas implements CkContainer, CkCanvasProps {
  readonly canvasKit: CanvasKit;
  skObject?: SkCanvas;
  readonly name = "SkCanvas";
  readonly skObjectType = "SkCanvas";
  readonly type: "skCanvas" = "skCanvas";
  children: CkElement[] = [];

  clear = "#FFFFFF"

  private deleted = false;

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
  }

  render(parent: CkElementContainer<any>): void {
    if (this.deleted) {
      throw new Error("BUG. canvas element deleted.");
    }

    if (parent.skObject && is.surface(parent)) {
      if (this.skObject === undefined) {
        this.skObject = parent.skObject.getCanvas();
      }
    } else {
      throw new Error("Expected an initialized surface as parent of canvas");
    }

    this.skObject.save();
    this.drawSelf(this.skObject);
    this.children.forEach((child) => child.render(this));
    this.skObject.restore();
    this.skObject.flush();
  }

  private drawSelf(skCanvas: SkCanvas) {
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
    // this.skObject?.delete()
    this.skObject = undefined;
  }
}
