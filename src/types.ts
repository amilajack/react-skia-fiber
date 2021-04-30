import { Canvas, CanvasKit, Paragraph, RRect, Surface } from "canvaskit-wasm";
import { RefObject } from "react";
import { SkCanvasProps } from "./canvas";
import { SkLineProps } from "./line";
import { SkParagraphProps } from "./paragraph";
import { SkPathProps } from "./path";
import { SkRRectProps } from "./rrect";
import { SkSurface, SkSurfaceProps } from "./surface";
import { SkTextProps } from "./text";

export type CkElementType =
  | "skParagraph"
  | "skSurface"
  | "skText"
  | "skCanvas"
  | "skRrect"
  | "skLine"
  | "skPath";

export interface CkElement {
  readonly type: CkElementType;
  readonly canvasKit: CanvasKit;
  ref?: RefObject<CkElement>;
  object?: Canvas | RRect | Paragraph | Surface;
  dirty?: boolean;
  delete: () => void;
}

export interface CkContainer<
  C extends CkElement = CkChild,
  P extends CkElement = SkSurface
> extends CkElement {
  render: (parent: P["object"]) => void;
  children: C[];
}

export interface CkChild extends CkElement {
  render: (parent: Canvas) => void;
  readonly layoutProperties: Set<string>;
  dirtyLayout: boolean;
}

export type CkElementProps = Record<string, unknown>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      skCanvas: SkCanvasProps;
      skLine: SkLineProps;
      skText: SkTextProps;
      skRrect: SkRRectProps;
      skParagraph: SkParagraphProps;
      skSurface: SkSurfaceProps;
      skPath: SkPathProps;
    }
  }
}
