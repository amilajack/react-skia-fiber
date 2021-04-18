import type { CanvasKit, SkFont, SkPaint } from "canvaskit-oc";
import { MutableRefObject } from "react";

export interface CkTextProps {
  text: string;
  x: number;
  y: number;
  ref?: MutableRefObject<CkText | undefined>;
}

export default class CkText {
  readonly canvasKit: CanvasKit;
  readonly skObjectType: CkObjectTyping["skText"]["name"] = "Text";
  readonly type: "skText" = "skText";

  private readonly defaultPaint: SkPaint;
  private readonly defaultFont: SkFont;

  private renderPaint?: SkPaint;
  private renderFont?: SkFont;
  deleted = false;
  x = 0
  y = 0
  text = 'hello'

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;

    this.defaultPaint = new this.canvasKit.SkPaint();
    this.defaultPaint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.defaultPaint.setAntiAlias(true);
    this.defaultFont = new this.canvasKit.SkFont(null, 40);
  }

  render(parent?: CkElementContainer<any>): void {
    // this.renderPaint.delete();
    // this.renderPaint = toSkPaint(this.canvasKit, this.props.paint);
    // TODO we can be smart and only recreate the font object if the font props have changed.
    // this.renderFont.delete();
    // this.renderFont = toSkFont(this.canvasKit, this.props.font);
    parent.skObject.drawText(
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
    // this.deleted = true;
    // this.defaultFont.delete();
    // this.defaultPaint.delete();
    // this.renderPaint?.delete();
    // this.renderFont?.delete();
  }
}
