import type {
  CanvasKit,
  Canvas,
  FontManager,
  Paragraph,
  ParagraphStyle,
} from "canvaskit-wasm";
import { MutableRefObject } from "react";
import {
  CkElement,
} from "./types";

export interface CkParagraphProps {
  x?: number;
  y?: number;
  width?: number;
  text?: string;
  maxLines?: number;
  ellipsis?: string;
  ref?: MutableRefObject<CkParagraph | undefined>;
}

export default class CkParagraph implements CkElement {
  readonly canvasKit: CanvasKit;
  readonly name = "SkParagraph";
  readonly skObjectType = "SkParagraph";
  readonly type: "skParagraph" = "skParagraph";

  x = 0;
  y = 0;
  width = 100;
  textStyle: ParagraphStyle;
  skObject?: Paragraph;
  fontManager?: FontManager;
  deleted = false;
  text = '';

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    this.textStyle = new this.canvasKit.ParagraphStyle({
      textStyle: {
        color: this.canvasKit.BLACK,
        fontFamilies: ['Roboto', 'Noto Color Emoji'],
        fontSize: 50,
      },
      textAlign: this.canvasKit.TextAlign.Left,
      maxLines: 7,
      ellipsis: '...',
    });
    this.build();
  }

  build() {
    const skParagraphBuilder = this.canvasKit.ParagraphBuilder.Make(
      this.textStyle,
      this.canvasKit.FontMgr.RefDefault()
    );
    skParagraphBuilder.addText(this.text);
    // this.skObject?.delete();
    this.skObject = skParagraphBuilder.build();
  }

  layout() {
    this.skObject.layout(this.width);
  }

  render(canvas: Canvas): void {
    // this.delete();
    // if (!this.fontManager) return;
    // TODO: Only layout if props changed
    this.layout();
    if (!this.skObject) throw 'no paragraph'
    canvas.drawParagraph(this.skObject, this.x, this.y);
    this.deleted = false;
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.skObject?.delete();
  }
}
