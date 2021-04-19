import type { Canvas, CanvasKit, Paint } from "canvaskit-wasm";
import { MutableRefObject } from "react";

export interface CkLineProps extends CkElementProps<never> {
  ref?: MutableRefObject<CkLine | undefined>;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  paint?: Paint;
}

export default class CkLine implements CkElement<"skLine"> {
  readonly canvasKit: CanvasKit;
  readonly skObjectType: CkObjectTyping["skLine"]["name"] = "Line";
  readonly type: "skLine" = "skLine";

  x1 = 0;
  x2 = 10;
  y1 = 10;
  y2 = 0;

  private readonly defaultPaint: Paint;
  private renderPaint?: Paint;
  deleted = false;

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;

    this.defaultPaint = new this.canvasKit.Paint();
    this.defaultPaint.setColor(this.canvasKit.Color(0.9, 0, 0, 1.0));
    this.defaultPaint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.defaultPaint.setAntiAlias(true);
  }

  render(canvas: Canvas): void {
    // TODO we can be smart and only recreate the paint object if the paint props have changed.
    // this.renderPaint.delete();

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
