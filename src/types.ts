import { Canvas, CanvasKit, Paragraph, RRect, Surface } from "canvaskit-wasm";
import { RefObject } from "react";
import { CkCanvasProps } from "./canvas";
import { CkLineProps } from "./line";
import { CkParagraphProps } from "./paragraph";
import { CkRrectProps } from "./rrect";
import { CkTextProps } from "./text";

export type CkElementType = "skParagraph" | "skSurface" | "skText" | "skCanvas" | "skRrect" | "skLine";

export interface CkElement {
  readonly type: CkElementType;
  readonly canvasKit: CanvasKit;
  ref?: RefObject<CkElement>;
  render: (parent: Canvas) => void;
  skObject?: Canvas | RRect | Paragraph | Surface;
  dirty?: boolean;
}

export interface CkContainer extends Omit<CkElement, 'render'> {
  render: (parent: Surface) => void;
  children: CkElement[];
}

export interface CkChild extends CkElement {
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
    }
  }
}
