import type { CanvasKit, Canvas, Surface } from "canvaskit-wasm";
import { Color } from "canvaskit-wasm";
import { toSkColor } from "./styles";
import { SkSurface } from "./surface";
import { SkChild, SkContainer, SkElement, SkElementProps } from "./types";

export interface SkCanvasProps extends SkElementProps<SkCanvas> {
  clear?: Color | string;
  rotate?: { degree: number; px?: number; py?: number };
}

export class SkCanvas
  implements SkContainer<SkChild, SkSurface>, SkCanvasProps {
  readonly canvasKit: CanvasKit;
  object?: Canvas;
  readonly type: "skCanvas" = "skCanvas";
  children: SkChild[] = [];

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
    this.object = undefined;
  }
}
