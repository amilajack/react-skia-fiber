import { CanvasKit, FontMgr, LineMetrics, Paragraph } from "canvaskit-wasm";
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
    const line = lineMetrics.findIndex(
      (metric) =>
        index >= metric.startIndex && index <= metric.endExcludingWhitespaces
    );
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
  }
  moveX(deltaX: number) {
    const index = this.getIndex();
    const nextIndex = clamp(
      index + deltaX,
      0,
      this.lineMetrics[this.lineMetrics.length - 1].endIndex
    );
    this.moveToIndex(nextIndex);
  }
  moveUp() {
    this.moveY(-1);
  }
  moveDown() {
    this.moveY(1);
  }
  moveLeft() {
    this.moveX(-1);
  }
  moveRight() {
    this.moveX(1);
  }
  moveTop() {
    this.moveToIndex(0);
  }
  moveBottom() {
    this.moveToIndex(
      this.lineMetrics[this.lineMetrics.length - 1].endIndex - 1
    );
  }
  moveToIndex(index: number) {
    this.position = Position.fromIndex(index, this.paragraph);
    this.index = index;
  }
  moveToStartOfWord() {
    const { start } = this.getWordBoundary();
    if (start === this.getIndex())
      this.moveToIndex(
        this.paragraph.getWordBoundary(Math.max(0, start - 1)).start
      );
    else this.moveToIndex(start);
  }
  moveToStartOfLine() {
    const lineMetrics = this.lineMetrics[this.position.line];
    this.moveToIndex(lineMetrics.startIndex);
  }
  moveToEndOfLine() {
    const lineMetrics = this.lineMetrics[this.position.line];
    this.moveToIndex(lineMetrics.endExcludingWhitespaces);
  }
  moveToEndOfWord() {
    const { end } = this.getWordBoundary();
    this.moveToIndex(end);
  }
  private getWordBoundary() {
    const index = this.getIndex();
    return this.paragraph.getWordBoundary(index);
  }
  private clone() {
    return new Cursor(this.paragraph);
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
}

const PADDING = 800;

function TextEditor({ fontMgr }: { fontMgr: FontMgr }) {
  const ck = useCanvasKit();
  const rParagraph = useRef<SkParagraph>();
  const rCursor = useRef<Cursor>();
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

  const handleClick = (e) => {
    const skParagraph = rParagraph.current!.object!;
    const posA = skParagraph!.getGlyphPositionAtCoordinate(
      e.pageX * 2 - PADDING,
      e.pageY * 2
    );
    if (posA) {
      rCursor.current?.moveToIndex(posA.pos);
      rCursor.current.dirtyLayout = true;
      invalidate();
    }
  };

  function handleInput(e) {
    const text = e.target.value;
    e.target.value = "";
    insertText(text);
    focusTextarea();
  }
  const handleTextareaKeydown = (e) => {
    const text = e.target.value;
    e.target.value = "";
    insertText(text);
    focusTextarea();
  };

  function focusTextarea() {
    setTimeout(() => {
      textarea.current.focus();
    }, 1);
  }

  function handlePaste(e) {
    e.preventDefault();
    insertText(e.clipboardData.getData("text/plain"));
    focusTextarea();
  }

  useEffect(() => {
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeydown);

    const textarea = document.querySelector("textarea")!;
    textarea.addEventListener("input", handleInput);
    textarea.addEventListener("paste", handlePaste);
    textarea.addEventListener("keydown", handleTextareaKeydown);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeydown);
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
          cursor.moveDown();
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
        const prevText = rParagraph.current!.text;
        const newText = prevText.slice(0, index) + prevText.slice(index + 1);
        updateParagraph(newText);
        cursor.moveLeft();
        break;
      }
      case "Delete":
        const index = cursor!.getIndex();
        const prevText = rParagraph.current!.text;
        updateParagraph(prevText.slice(0, index) + prevText.slice(index + 1));
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
      {/* <skText
        ref={rText}
        text={`x: ${cursor.x}, y: ${cursor.y}, index: ${cursor.current.index}`}
        x={window.innerWidth * 2 - 500 * 2}
        y={window.innerHeight * 2 - 100}
      /> */}
      {/* {selections.map(([x, y, w, h]) => (
        <skRrect
          id={String(x + y + w + h)}
          x={x}
          y={y}
          width={w - x}
          height={h - y}
          style={{ alpha: 0.5 }}
        />
      ))} */}
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
