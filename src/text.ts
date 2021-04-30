import type { CanvasKit, Font, Paint } from "canvaskit-wasm";
import { Canvas } from "canvaskit-wasm";
import { MutableRefObject } from "react";

export interface SkTextProps {
  text?: string;
  x?: number;
  y?: number;
  ref?: MutableRefObject<SkText | undefined>;
}

export class SkText {
  readonly canvasKit: CanvasKit;
  readonly type: "skText" = "skText";

  private readonly defaultPaint: Paint;
  private readonly defaultFont: Font;
  private renderPaint?: Paint;
  private renderFont?: Font;

  readonly layoutProperties = new Set<string>(["x", "y"]);
  dirtyLayout = false;
  deleted = false;
  x = 0;
  y = 0;
  text = "hello";

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;

    this.defaultPaint = new this.canvasKit.Paint();
    this.defaultPaint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.defaultPaint.setAntiAlias(true);
    this.defaultFont = new this.canvasKit.Font(null, 40);
  }

  render(canvas: Canvas): void {
    canvas.drawText(
      this.text,
      this.x,
      this.y,
      this.defaultPaint,
      this.defaultFont
    );
    this.deleted = false;
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.defaultFont.delete();
    this.defaultPaint.delete();
    this.renderPaint?.delete();
    this.renderFont?.delete();
  }
}
