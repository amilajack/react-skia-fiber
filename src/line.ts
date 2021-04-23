import type { Canvas, CanvasKit, Paint } from "canvaskit-wasm";
import { MutableRefObject } from "react";
import { CkChild } from "./types";

export interface CkLineProps {
  ref?: MutableRefObject<CkLine | undefined>;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export default class CkLine implements CkChild {
  readonly canvasKit: CanvasKit;
  readonly type = "skLine";

  private deleted = false;

  private readonly defaultPaint: Paint;
  private renderPaint?: Paint;

  dirty = false;
  dirtyLayout = false;
  layoutProperties = new Set<string>();

  x1: number = 0;
  y1: number = 0;
  x2: number = 10;
  y2: number = 10;

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;

    this.defaultPaint = new this.canvasKit.Paint();
    this.defaultPaint.setColor(this.canvasKit.Color(0.9, 0, 0, 1.0));
    this.defaultPaint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.defaultPaint.setAntiAlias(true);
  }

  render(canvas: Canvas): void {
    canvas.drawLine(this.x1, this.y1, this.x2, this.y2, this.defaultPaint);
    this.deleted = false;
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.defaultPaint.delete();
    this.renderPaint?.delete();
  }
}
