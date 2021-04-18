import type {
  CanvasKit,
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
  text = 'hello asdfaksfdalsdajklsdfklasdkldlkdjsafklak';

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    // this.fontManager = fontManager;
    this.textStyle = new this.canvasKit.ParagraphStyle({
      textStyle: {
        color: this.canvasKit.WHITE,
        fontFamilies: ['Roboto', 'Noto Color Emoji'],
        fontSize: 50,
      },
      textAlign: this.canvasKit.TextAlign.Left,
      maxLines: 7,
      ellipsis: '...',
    });
  }

  layout() {
    if (this.deleted) {
      throw new Error("BUG. paragraph element deleted.");
    }

    const skParagraphBuilder = this.canvasKit.ParagraphBuilder.Make(
      this.textStyle,
      this.canvasKit.FontMgr.RefDefault()
    );
    skParagraphBuilder.addText(this.text);
    this.skObject?.delete();
    this.skObject = skParagraphBuilder.build();
    this.skObject.layout(this.width);
  }

  render(parent: CkElementContainer<any>): void {
    // if (!this.fontManager) return;
    // TODO: Only layout if props changed
    this.layout();
    parent.skObject.drawParagraph(this.skObject, this.x, this.y);
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
