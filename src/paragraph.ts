import type {
  CanvasKit,
  Canvas,
  FontMgr,
  ParagraphStyle,
  Paragraph,
} from "canvaskit-wasm";
import { SkChild, SkElementProps } from "./types";

export interface SkParagraphProps extends SkElementProps<SkParagraph> {
  x?: number;
  y?: number;
  width?: number;
  text?: string;
  maxLines?: number;
  ellipsis?: string;
}

export class SkParagraph implements SkChild {
  readonly canvasKit: CanvasKit;
  readonly type: "skParagraph" = "skParagraph";

  readonly layoutProperties = new Set<string>(["x", "y"]);
  dirtyLayout = false;

  x = 0;
  y = 0;
  width = 100;
  textStyle: ParagraphStyle;
  object?: Paragraph;
  fontManager?: FontMgr;
  deleted = false;
  text = "";

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    this.textStyle = new this.canvasKit.ParagraphStyle({
      textStyle: {
        color: this.canvasKit.BLACK,
        fontFamilies: ["Roboto", "Noto Color Emoji"],
        fontSize: 50,
      },
      textAlign: this.canvasKit.TextAlign.Left,
      maxLines: 7,
      ellipsis: "...",
    });
    this.build();
  }

  build() {
    if (this.object) this.delete();
    const skParagraphBuilder = this.canvasKit.ParagraphBuilder.Make(
      this.textStyle,
      this.fontManager || this.canvasKit.FontMgr.RefDefault()
    );
    skParagraphBuilder.addText(this.text);
    this.object = skParagraphBuilder.build();
  }

  private layout() {
    this.object!.layout(this.width);
    this.dirtyLayout = false;
  }

  render(canvas: Canvas): void {
    if (this.dirtyLayout) this.layout();
    if (!this.object) throw "no paragraph";
    canvas.drawParagraph(this.object, this.x, this.y);
    this.deleted = false;
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.object?.delete();
  }
}
