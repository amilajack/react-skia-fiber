import type { CanvasKit, Font, Paint } from "canvaskit-wasm";
import { Canvas } from "canvaskit-wasm";
import { MutableRefObject } from "react";

export interface CkTextProps {
  text?: string;
  x?: number;
  y?: number;
  ref?: MutableRefObject<CkText | undefined>;
}

export default class CkText {
  readonly canvasKit: CanvasKit;
  readonly skObjectType: CkObjectTyping["skText"]["name"] = "Text";
  readonly type: "skText" = "skText";

  private readonly defaultPaint: Paint;
  private readonly defaultFont: Font;

  private renderPaint?: Paint;
  private renderFont?: Font;
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
    // this.delete();
    // this.renderPaint.delete();
    // this.renderPaint = toSkPaint(this.canvasKit, this.props.paint);
    // TODO we can be smart and only recreate the font object if the font props have changed.
    // this.renderFont.delete();
    // this.renderFont = toSkFont(this.canvasKit, this.props.font);
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
