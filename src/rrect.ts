import type { Canvas, CanvasKit, Paint } from "canvaskit-wasm";
import { MutableRefObject } from "react";
import { CkChild } from "./types";

export interface SkRRectProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  ref?: MutableRefObject<SkRRect | undefined>;
}

export class SkRRect implements CkChild {
  x = 0;
  y = 0;
  rx = 10;
  ry = 10;
  width = 100;
  height = 100;
  canvasKit: CanvasKit;
  paint: Paint;
  private rr?: Float32Array;

  readonly layoutProperties = new Set<string>([
    "x",
    "y",
    "rx",
    "ry",
    "width",
    "height",
  ]);
  dirtyLayout = false;

  readonly type: "skRrect" = "skRrect";

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    const paint = new canvasKit.Paint();
    paint.setColor(canvasKit.Color4f(0, 0, 0, 1.0));
    paint.setStyle(canvasKit.PaintStyle.Fill);
    paint.setAntiAlias(true);
    this.paint = paint;
    this.layout();
  }

  layout() {
    const { x, y, width, height } = this;
    this.rr = this.canvasKit.RRectXY(
      this.canvasKit.LTRBRect(x, y, x + width, y + height),
      this.rx,
      this.ry
    );
    this.dirtyLayout = false;
  }

  render(canvas: Canvas) {
    if (this.dirtyLayout) this.layout();
    canvas.drawRRect(this.rr!, this.paint);
  }

  delete() {}
}
