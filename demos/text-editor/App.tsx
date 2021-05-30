import {
  CanvasKit,
  FontMgr,
  LineMetrics,
  Paragraph,
  RRect,
} from "canvaskit-wasm";
import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
import {
  FontManagerProvider,
  useFontManager,
  SkParagraph,
  SkCanvas,
  useCanvasKit,
  invalidate,
  toSkColor,
  useFrame,
} from "../../src";
import alice from "./alice";
import "./style.css";

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(val, max));

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).catch((e) => {
    console.error("Failed to copy to clipboard!"), console.error(e);
  });
};

class Position {
  line = 0;
  column = 0;
  constructor(line: number, column: number) {
    this.line = line;
    this.column = column;
  }
  /**
   * Skia's Paragraph module handles cursor state using indicies of a char
   * insted of row/col
   */
  static fromIndex(index: number, paragraph: Paragraph) {
    const lineMetrics = paragraph.getLineMetrics();
    let line = lineMetrics.findIndex(
      (metric) =>
        index >= metric.startIndex && index <= metric.endExcludingWhitespaces
    );
    if (line < 0) {
      line = lineMetrics.findIndex(
        (metric) => index >= metric.startIndex && index <= metric.endIndex
      );
    }
    return new Position(line, index - lineMetrics[line].startIndex);
  }
}

class Cursor {
  position: Position;
  index: number;
  paragraph: Paragraph;
  width = 5;
  private lineMetrics: LineMetrics[];

  constructor(paragraph: Paragraph, position?: Position) {
    this.paragraph = paragraph;
    this.updateLineMetrics();
    this.position = position ?? Position.fromIndex(0, paragraph);
    this.index = this.getIndex();
  }
  moveY(deltaY: number) {
    console.log(this.lineMetrics);
    const nextLine = clamp(
      this.position.line + deltaY,
      0,
      this.lineMetrics.length - 1
    );
    const nextLineMetric = this.lineMetrics[nextLine];
    const currLineMetric = this.lineMetrics[this.position.line];

    const index = this.getIndex();
    const nextIndex = Math.min(
      nextLineMetric.startIndex + index - currLineMetric.startIndex,
      nextLineMetric.endIndex
    );
    this.moveToIndex(nextIndex);
    return this;
  }
  moveX(deltaX: number) {
    const index = this.getIndex();
    const nextIndex = clamp(
      index + deltaX,
      0,
      this.lineMetrics[this.lineMetrics.length - 1].endIndex
    );
    this.moveToIndex(nextIndex);
    return this;
  }
  moveUp() {
    this.moveY(-1);
    return this;
  }
  moveDown() {
    this.moveY(1);
    return this;
  }
  moveLeft() {
    this.moveX(-1);
    return this;
  }
  moveRight() {
    this.moveX(1);
    return this;
  }
  moveTop() {
    this.moveToIndex(0);
    return this;
  }
  moveBottom() {
    this.moveToIndex(
      this.lineMetrics[this.lineMetrics.length - 1].endIndex - 1
    );
    return this;
  }
  moveToIndex(index: number) {
    this.position = Position.fromIndex(index, this.paragraph);
    this.index = index;
    return this;
  }
  moveToStartOfWord() {
    const { start } = this.getWordBoundary();
    if (start === this.getIndex())
      this.moveToIndex(
        this.paragraph.getWordBoundary(Math.max(0, start - 1)).start
      );
    else this.moveToIndex(start);
    return this;
  }
  moveToStartOfLine() {
    const lineMetrics = this.lineMetrics[this.position.line];
    this.moveToIndex(lineMetrics.startIndex);
    return this;
  }
  moveToEndOfLine() {
    const lineMetrics = this.lineMetrics[this.position.line];
    this.moveToIndex(lineMetrics.endExcludingWhitespaces);
    return this;
  }
  moveToEndOfWord() {
    const { end } = this.getWordBoundary();
    this.moveToIndex(end);
    return this;
  }
  getWordBoundary() {
    const index = this.getIndex();
    return this.paragraph.getWordBoundary(index);
  }
  clone() {
    return new Cursor(this.paragraph, this.position);
  }
  setParagraph(paragraph: Paragraph) {
    this.paragraph = paragraph;
  }
  getIndex(): number {
    return (
      this.lineMetrics[this.position.line].startIndex + this.position.column
    );
  }
  updateLineMetrics() {
    this.lineMetrics = this.paragraph.getLineMetrics();
  }
  getCursorSelection(
    ck: CanvasKit,
    index: number = this.getIndex()
  ): [number, number, number, number] | undefined {
    const [rect] = this.paragraph!.getRectsForRange(
      index,
      index + 1,
      ck.RectWidthStyle.Max,
      ck.RectHeightStyle.Max
    );
    if (rect) {
      return rect;
    }
  }
  static fromIndex(index: number, paragraph: Paragraph) {
    return new Cursor(paragraph, Position.fromIndex(index, paragraph));
  }
}

const PADDING = 800;

function TextEditor({ fontMgr }: { fontMgr: FontMgr }) {
  const ck = useCanvasKit();
  const rParagraph = useRef<SkParagraph>();
  const rCursor = useRef<Cursor>();
  const rSelection = useRef({
    selecting: false,
    start: 0,
    end: 0,
  });
  const [selectionRects, setSelectionRects] = useState<RRect[]>([]);
  const rCursorRect = useRef({
    x: PADDING,
    y: 0,
    w: 0,
    h: 0,
  });

  const textarea = useRef(document.querySelector("textarea")!);

  const updateParagraph = (text: string) => {
    rParagraph.current!.text = text;
    rParagraph.current!.build();
    rParagraph.current!.layout();
    rCursor.current.paragraph = rParagraph.current.object;
    rCursor.current!.updateLineMetrics();
    invalidate();
  };

  const insertText = (text: string) => {
    const prevText = rParagraph.current!.text;
    const nextIndex = rCursor.current.getIndex();
    updateParagraph(
      [prevText.slice(0, nextIndex), text, prevText.slice(nextIndex)].join("")
    );
    rCursor.current?.moveX(text.length);
    invalidate();
  };

  useFrame(() => {
    const cursorRect = rCursor.current.getCursorSelection(ck);
    const [x, y, w, h] = cursorRect;
    rCursorRect.current.width = 5;
    rCursorRect.current.height = h - y;
    rCursorRect.current.x = x + PADDING;
    rCursorRect.current.y = y;
    rCursorRect.current.dirtyLayout = true;
  });

  useEffect(() => {
    rParagraph.current!.fontManager = fontMgr;
    rParagraph.current!.textStyle = new ck.ParagraphStyle({
      textStyle: {
        color: toSkColor(ck, "#d1d1d1"),
        fontFamilies: ["Roboto", "Noto Color Emoji"],
        fontSize: 30,
      },
      textAlign: ck.TextAlign.Left,
      maxLines: 100,
      ellipsis: "...",
    });
    rParagraph.current!.width = innerWidth * 2 - PADDING * 2;
    rParagraph.current!.text = alice.slice(0, 8_000);
    rParagraph.current!.build();
    rParagraph.current!.layout();
    rCursor.current = new Cursor(rParagraph.current!.object!);
    focusTextarea();
    invalidate();
  }, []);

  const handleMouseDown = (e) => {
    const skParagraph = rParagraph.current!.object!;
    const posA = skParagraph!.getGlyphPositionAtCoordinate(
      e.pageX * 2 - PADDING,
      e.pageY * 2
    );
    if (posA) {
      rSelection.current.selecting = true;
      rCursor.current?.moveToIndex(posA.pos);
      rCursor.current.dirtyLayout = true;
      rSelection.current.start = posA.pos;
      invalidate();
    }
    rSelection.current.start = posA?.pos;
    setSelectionRects([]);
  };

  const handleMouseUp = (e) => {
    if (rSelection.current.selecting) {
      rSelection.current.selecting = false;
      const skParagraph = rParagraph.current!.object!;
      const posA = skParagraph!.getGlyphPositionAtCoordinate(
        e.pageX * 2 - PADDING,
        e.pageY * 2
      );
      rSelection.current.end = posA?.pos;
    }
  };

  const handleMouseMove = (e) => {
    if (rSelection.current.selecting) {
      const skParagraph = rParagraph.current!.object!;
      const posA = skParagraph!.getGlyphPositionAtCoordinate(
        e.pageX * 2 - PADDING,
        e.pageY * 2
      );
      if (posA) {
        rCursor.current?.moveToIndex(posA.pos);
        rCursor.current.dirtyLayout = true;
        invalidate();
        const { start } = rSelection.current;
        console.log(
          start,
          posA.pos,
          rParagraph.current?.object?.getRectsForRange(
            start,
            posA.pos,
            ck.RectWidthStyle.Tight,
            ck.RectHeightStyle.Tight
          )
        );
        setSelectionRects(
          rParagraph.current?.object?.getRectsForRange(
            Math.min(start, posA.pos),
            Math.max(start, posA.pos),
            ck.RectWidthStyle.Tight,
            ck.RectHeightStyle.Tight
          ) || []
        );
      }
    }
  };

  const handleInput = (e) => {
    const text = e.target.value;
    e.target.value = "";
    insertText(text);
    focusTextarea();
  };

  const handleTextareaKeydown = (e) => {
    const text = e.target.value;
    e.target.value = "";
    insertText(text);
    focusTextarea();
  };

  const focusTextarea = () => {
    setTimeout(() => {
      textarea.current.focus();
    }, 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    insertText(e.clipboardData.getData("text/plain"));
    focusTextarea();
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keydown", handleKeydown);

    const textarea = document.querySelector("textarea")!;
    textarea.addEventListener("input", handleInput);
    textarea.addEventListener("paste", handlePaste);
    textarea.addEventListener("keydown", handleTextareaKeydown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      textarea.removeEventListener("input", handleInput);
      textarea.removeEventListener("paste", handlePaste);
      textarea.removeEventListener("keydown", handleTextareaKeydown);
    };
  }, []);

  const handleKeydown = (e) => {
    invalidate();
    const cursor = rCursor.current!;
    switch (e.key) {
      case "ArrowLeft":
        e.metaKey
          ? cursor.moveToStartOfLine()
          : e.altKey
          ? cursor.moveToStartOfWord()
          : cursor.moveLeft();
        break;
      case "ArrowRight":
        e.metaKey
          ? cursor.moveToEndOfLine()
          : e.altKey
          ? cursor.moveToEndOfWord()
          : cursor.moveRight();
        break;
      case "ArrowUp":
        e.metaKey ? cursor.moveTop() : cursor.moveUp();
        break;
      case "ArrowDown":
        e.metaKey ? cursor.moveBottom() : cursor.moveDown();
        break;
      case "c":
        if (e.metaKey) {
          copyToClipboard("foo");
        }
        break;
      case "a":
        if (e.metaKey) {
          cursor.moveDown();
        }
        break;
      case "x":
        if (e.metaKey) {
          cursor.moveDown();
        }
        break;
      // Prevent default tab behavior
      case "Tab":
        e.preventDefault();
        insertText("  ");
        break;
      // @TODO: Handle shift + tab
      case "Backspace": {
        const index = cursor!.getIndex() - 1;
        const to = e.metaKey
          ? cursor.clone().moveToStartOfLine().getIndex()
          : e.altKey
          ? cursor.getWordBoundary().start === cursor.getIndex()
            ? cursor.paragraph.getWordBoundary(Math.max(0, index - 1)).start
            : cursor.getWordBoundary().start
          : 0;
        const prevText = rParagraph.current!.text;
        const newText =
          prevText.slice(0, to || index) + prevText.slice(index + 1);
        updateParagraph(newText);
        cursor.moveX((to || index) - (index + 1));
        break;
      }
      case "Delete":
        const index = cursor!.getIndex();
        const to = e.metaKey
          ? cursor.clone().moveToEndOfLine().getIndex()
          : e.altKey
          ? cursor.getWordBoundary().end === cursor.getIndex()
            ? cursor.paragraph.getWordBoundary(Math.max(0, index + 1)).end
            : cursor.getWordBoundary().end
          : 0;
        const prevText = rParagraph.current!.text;
        updateParagraph(
          prevText.slice(0, index) + prevText.slice(index + to || 1)
        );
        break;
      default: {
        focusTextarea();
      }
    }
  };

  return (
    <>
      <skParagraph
        ref={rParagraph}
        x={PADDING}
        y={0}
        width={window.innerWidth * 2}
      />
      <skRrect ref={rCursorRect} style={{ color: "#3477f4" }} />
      {selectionRects.map(([x, y, w, h]) => (
        <skRrect
          id={String(x + y + w + h)}
          x={x + PADDING}
          y={y}
          width={w - x}
          height={h - y}
          style={{ alpha: 0.3, color: "#ffffff" }}
        />
      ))}
    </>
  );
}

export default function App() {
  const canvasRef = useRef<SkCanvas>();
  const [fonts, setFonts] = useState<ArrayBuffer[]>();
  const fontMgr = useFontManager();
  const ck = useCanvasKit();

  useEffect(() => {
    Promise.all([
      fetch(
        "https://storage.googleapis.com/skia-cdn/google-web-fonts/Roboto-Regular.ttf"
      ).then((res) => res.arrayBuffer()),
      fetch(
        "https://storage.googleapis.com/skia-cdn/misc/NotoColorEmoji.ttf"
      ).then((res) => res.arrayBuffer()),
    ]).then((font) => {
      setFonts(font);
    });
  }, []);

  return (
    <skCanvas ref={canvasRef} clear={toSkColor(ck, "#1d1d1d")}>
      <FontManagerProvider fontData={fonts}>
        <TextEditor fontMgr={fontMgr} />
      </FontManagerProvider>
    </skCanvas>
  );
}
