import type {
  CanvasKit,
  SkFontManager,
  SkParagraph,
  SkParagraphStyle,
} from "canvaskit-oc";
import { isCkCanvas } from "./canvas";
import { toSkParagraphStyle } from "./mappings";
import {
  CkElement,
  CkElementContainer,
  CkElementCreator,
  CkElementProps,
  CkObjectTyping,
  TextAlignEnum,
  TextDirectionEnum,
  TextStyle,
} from "./types";

export interface ParagraphStyle {
  disableHinting?: boolean;
  heightMultiplier?: number;
  ellipsis?: string;
  maxLines?: number;
  textAlign?: TextAlignEnum;
  textDirection?: TextDirectionEnum;
  textStyle: TextStyle;
}

export interface ParagraphProps {
  style: ParagraphStyle;
  maxWidth: number;
  x: number;
  y: number;
}

export interface CkParagraphProps
  extends ParagraphStyle,
    CkElementProps<SkParagraph> {
  layout: number;
  x?: number;
  y?: number;
  children?: string;
  fontManager?: SkFontManager;
}

class CkParagraph implements CkElement<"skParagraph"> {
  readonly canvasKit: CanvasKit;
  readonly props: CkParagraphProps;
  skObject?: SkParagraph;
  readonly skObjectType = "SkParagraph";
  readonly type: "skParagraph" = "skParagraph";

  deleted = false;

  constructor(
    canvasKit: CanvasKit,
    props: CkObjectTyping["skParagraph"]["props"]
  ) {
    this.canvasKit = canvasKit;
    this.props = props;
  }

  render(parent: CkElementContainer<any>): void {
    if (this.deleted) {
      throw new Error("BUG. paragraph element deleted.");
    }

    const skParagraphBuilder = this.canvasKit.ParagraphBuilder.Make(
      <SkParagraphStyle>toSkParagraphStyle(this.canvasKit, this.props),
      this.props.fontManager ?? this.canvasKit.SkFontMgr.RefDefault()
    );
    if (this.props.children) {
      skParagraphBuilder.addText(this.props.children);
    }
    this.skObject?.delete();
    this.skObject = skParagraphBuilder.build();
    this.skObject.layout(this.layout || this.props.layout);
    if (isCkCanvas(parent)) {
      parent.skObject?.drawParagraph(
        this.skObject,
        this.props.x ?? 0,
        this.props.y ?? 0
      );
    }
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

export const createCkParagraph: CkElementCreator<"skParagraph"> = (
  type,
  props,
  canvasKit
): CkElement<"skParagraph"> => new CkParagraph(canvasKit, props);
