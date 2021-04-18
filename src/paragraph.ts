import type {
  CanvasKit,
  SkFontManager,
  SkParagraph,
  SkParagraphStyle,
} from "canvaskit-oc";
import {
  CkElement,
} from "./types";

export default class CkParagraph implements CkElement {
  readonly canvasKit: CanvasKit;
  readonly name = "SkParagraph";
  readonly skObjectType = "SkParagraph";
  readonly type: "skParagraph" = "skParagraph";

  x = 1;
  y = 1;
  width = 100;
  textStyle: SkParagraphStyle;
  skObject?: SkParagraph;
  fontManager: SkFontManager;
  deleted = false;
  text = 'hello';

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    // this.fontManager = fontManager;
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
  }

  layout() {
    if (this.deleted) {
      throw new Error("BUG. paragraph element deleted.");
    }

    const skParagraphBuilder = this.canvasKit.ParagraphBuilder.Make(
      this.textStyle,
      this.canvasKit.SkFontMgr.RefDefault()
      // this.fontManager
    );
    if (this.text) {
      skParagraphBuilder.addText(this.text);
    }
    this.skObject?.delete();
    this.skObject = skParagraphBuilder.build();
    this.skObject.layout(this.width);
  }

  render(parent: CkElementContainer<any>): void {
    if (!this.fontManager) return;
    // TODO: Only layout if props changed
    this.layout();
    parent.skObject.drawParagraph(this.skObject, this.x, this.y);
    this.deleted = false;
    // TODO we can avoid deleting & recreating the paragraph skobject by checkin props that require a new paragraph instance.
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.skObject?.delete();
  }
}
