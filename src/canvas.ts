import type { CanvasKit, Canvas, Surface } from "canvaskit-wasm";
import { Color } from "canvaskit-wasm";
import type { MutableRefObject, ReactNode } from "react";
import { toSkColor } from "./helpers";
import { SkSurface } from "./surface";
import { CkChild, CkContainer, CkElement } from "./types";

export interface SkCanvasProps {
  clear?: Color | string;
  rotate?: { degree: number; px?: number; py?: number };
  children?: ReactNode;
  ref?: MutableRefObject<SkCanvas | undefined>;
}

export class SkCanvas
  implements CkContainer<CkChild, SkSurface>, SkCanvasProps {
  readonly canvasKit: CanvasKit;
  object?: Canvas;
  readonly type: "skCanvas" = "skCanvas";
  children: CkChild[] = [];

  rotate?: {
    degree: number;
    px: number;
    py: number;
  };

  clear = "#FFFFFF";

  private deleted = false;

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
  }

  render(surface: Surface) {
    this.object = surface.getCanvas();
    this.object.save();
    this.drawSelf(this.object);
    this.children.forEach((child) => child.render(this.object!));
    this.object.restore();
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
    // this.object = undefined;
  }
}
