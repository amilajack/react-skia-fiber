import { Canvas, CanvasKit, Paragraph, RRect, Surface } from "canvaskit-wasm";
import { RefObject } from "react";
import { CkCanvasProps } from "./canvas";
import { CkLineProps } from "./line";
import { CkParagraphProps } from "./paragraph";
import { CkPathProps } from "./path";
import { CkRrectProps } from "./rrect";
import CkSurface, { CkSurfaceProps } from "./surface";
import { CkTextProps } from "./text";

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
  skObject?: Canvas | RRect | Paragraph | Surface;
  dirty?: boolean;
  delete: () => void;
}

export interface CkContainer<
  C extends CkElement = CkChild,
  P extends CkElement = CkSurface
> extends CkElement {
  render: (parent: P["skObject"]) => void;
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
      skCanvas: CkCanvasProps;
      skLine: CkLineProps;
      skText: CkTextProps;
      skRrect: CkRrectProps;
      skParagraph: CkParagraphProps;
      skSurface: CkSurfaceProps;
      skPath: CkPathProps;
    }
  }
}
