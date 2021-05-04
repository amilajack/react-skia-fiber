import { Canvas, CanvasKit, Paragraph, RRect, Surface } from "canvaskit-wasm";
import { RefObject } from "react";
import { SkCanvasProps } from "./canvas";
import { SkLineProps } from "./line";
import { SkParagraphProps } from "./paragraph";
import { SkPathProps } from "./path";
import { SkRRectProps } from "./rrect";
import { SkSurface, SkSurfaceProps } from "./surface";
import { SkTextProps } from "./text";

export type SkElementType =
  | "skParagraph"
  | "skSurface"
  | "skText"
  | "skCanvas"
  | "skRrect"
  | "skLine"
  | "skPath";

export interface SkElement {
  readonly type: SkElementType;
  readonly canvasKit: CanvasKit;
  object?: Canvas | RRect | Paragraph | Surface;
  dirty?: boolean;
  delete: () => void;
}

export interface SkContainer<
  C extends SkElement = SkChild,
  P extends SkElement = SkSurface
> extends SkElement {
  render: (parent: P["object"]) => void;
  children: C[];
}

export interface SkChild extends SkElement {
  render: (parent: Canvas) => void;
  readonly layoutProperties?: Set<string>;
  dirtyLayout?: boolean;
  dirtyPaint?: boolean;
}

export type SkElementProps<T extends SkElement> = {
  children?: React.ReactNode;
  ref?: React.MutableRefObject<T | undefined>;
  key?: React.Key;
};

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
