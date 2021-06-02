/**
 * A minimal text editor implementation.
 *
 * Text editing is hard. See https://lord.io/text-editing-hates-you-too/. This implementation
 * has a number of bugs and lacks in many areas.
 */
import {
  CanvasKit,
  FontMgr,
  LineMetrics,
  Paragraph,
  RRect,
} from "canvaskit-wasm";
import React, { useRef, useEffect, useState, useMemo } from "react";
import {
  render,
  init,
  FontManagerProvider,
  useFontManager,
  SkParagraph,
  SkCanvas,
  useCanvasKit,
  invalidate,
  toSkColor,
  useFrame,
} from "../../src";
import longText from "./alice";
import "./style.css";
import { useControls } from "leva";

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(val, max));

const sliceRange = (text: string, start: number, end: number) =>
  text.slice(0, Math.min(start, end)) + text.slice(Math.max(start, end));

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).catch((e) => {
    console.error("Failed to copy to clipboard!"), console.error(e);
  });
};

const CURSOR_WIDTH = 3;
const DPR = 2;
const shortText = "hello word. the sky is blue";

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
  selection = new ClickCounter();
  lineMetrics: LineMetrics[] = [];

  constructor(paragraph: Paragraph, position?: Position) {
    this.paragraph = paragraph;
    this.updateLineMetrics();
    this.position = position ?? Position.fromIndex(0, paragraph);
    this.index = this.getIndex();
  }
  moveY(deltaY: number, select = false) {
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
    this.moveIndex(nextIndex, select);
    return this;
  }
  moveX(deltaX: number, select = false) {
    const index = this.getIndex();
    const nextIndex = clamp(index + deltaX, 0, this.getLastIndex());
    this.moveIndex(nextIndex, select);
    return this;
  }
  moveUp(select = false) {
    this.moveY(-1, select);
    return this;
  }
  moveDown(select = false) {
    this.moveY(1, select);
    return this;
  }
  moveLeft(select = false) {
    this.moveX(-1, select);
    return this;
  }
  moveRight(select = false) {
    this.moveX(1, select);
    return this;
  }
  moveTop(select = false) {
    this.moveIndex(0, select);
    return this;
  }
  moveBottom(select = false) {
    this.moveIndex(this.getLastIndex(), select);
    return this;
  }
  moveIndex(index: number, select = false) {
    this.position = Position.fromIndex(index, this.paragraph);
    this.index = index;
    if (select) {
      if (this.selection.start < 0) this.selection.start = index;
      this.selection.end = index;
    }
    return this;
  }
  moveStartOfWord(select = false) {
    const { start } = this.getWordBoundary();
    if (start === this.getIndex())
      this.moveIndex(
        this.paragraph.getWordBoundary(Math.max(0, start - 1)).start,
        select
      );
    else this.moveIndex(start, select);
    return this;
  }
  moveStartOfLine(select = false) {
    const lineMetrics = this.lineMetrics[this.position.line];
    this.moveIndex(lineMetrics.startIndex, select);
    return this;
  }
  moveEndOfLine(select = false) {
    const lineMetrics = this.lineMetrics[this.position.line];
    this.moveIndex(lineMetrics.endExcludingWhitespaces, select);
    return this;
  }
  moveEndOfWord(select = false) {
    const { end } = this.getWordBoundary();
    this.moveIndex(end, select);
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
  getLastIndex() {
    return this.lineMetrics[this.lineMetrics.length - 1]?.endIndex ?? 0;
  }
  updateLineMetrics() {
    this.lineMetrics = this.paragraph.getLineMetrics();
  }
  getCursorRect(
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
  select(from: number, to: number) {
    this.selection.start = from;
    this.selection.end = to;
  }
  selectLine() {
    this.moveStartOfLine(true);
    this.moveEndOfLine(true);
  }
  selectWord() {
    this.moveStartOfWord(true);
    this.moveEndOfWord(true);
  }
  clearSelection() {
    this.selection.start = -1;
    this.selection.end = -1;
  }
  getSelectionRects(ck: CanvasKit) {
    const { start, end } = this.selection;
    return (
      this.paragraph.getRectsForRange(
        Math.min(start, end),
        Math.max(start, end),
        ck.RectWidthStyle.Tight,
        ck.RectHeightStyle.Tight
      ) || []
    );
  }
  selectionIsValid() {
    const { start, end } = this.selection;
    return start > -1 && end > -1;
  }
}

class ClickCounter {
  lastClicked = Date.UTC(0, 0);
  timesClicked = 0;
  lastIndex = -1;
  // Start serves as an anchor index for marking the initial index of the selection
  start = -1;
  // End marks the index which people
  end = -1;

  handleTextChange() {
    this.resetState();
  }

  resetState() {
    this.lastClicked = Date.UTC(0, 0);
    this.timesClicked = 0;
    this.lastIndex = -1;
  }

  handleClick(index: number) {
    const deltaMs = Date.now() - this.lastClicked;
    if (index === this.lastIndex && deltaMs < 400) {
      if (this.timesClicked < 3) this.timesClicked++;
    } else {
      this.resetState();
      this.lastIndex = index;
      this.timesClicked++;
    }
    this.lastClicked = Date.now();
  }
}

class TextBuffer {
  insert(start: number) {}
  delete(start: number, end: number): string {}
}

function TextEditor({
  fontMgr,
  text,
  x,
  y,
  width,
}: {
  fontMgr: FontMgr;
  text: string;
  x: number;
  y: number;
  width: number;
}) {
  const ck = useCanvasKit();
  const rParagraph = useRef<SkParagraph>();
  const rCursor = useRef<Cursor>();
  const rSelection = useRef({
    selectionActive: false,
    rects: [] as Float32Array[],
  });
  const [selectionRects, setSelectionRects] = useState<RRect[]>([]);
  const rCursorRect = useRef({
    x: width,
    y: 0,
    w: 0,
    h: 0,
  });

  const textarea = useRef(document.querySelector("textarea")!);

  useEffect(() => {
    rSelection.current.rects = selectionRects;
    rCursorRect.current.dirtyLayout = true;
    if (rCursor.current) rCursor.current!.dirtyLayout = true;
    invalidate();
  }, [selectionRects]);

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
    const afterChar =
      rCursor.current?.getLastIndex() === rCursor.current!.index;
    const cursorRect = afterChar
      ? rParagraph.current!.object!.getRectsForRange(
          rCursor.current!.index - 1,
          rCursor.current!.index,
          ck.RectWidthStyle.Tight,
          ck.RectHeightStyle.Tight
        )[0]
      : rCursor.current!.getCursorRect(ck);

    if (cursorRect) {
      // Only move the cursor to after character for last char in text
      const [x, y, w, h] = cursorRect;
      rCursorRect.current.width = CURSOR_WIDTH;
      rCursorRect.current.height = h - y;
      rCursorRect.current.x = x + width + (afterChar ? w - x : 0);
      rCursorRect.current.y = y;
      rCursorRect.current.dirtyLayout = true;
    }
  });

  useEffect(() => {
    rParagraph.current!.fontManager = fontMgr;
    rParagraph.current!.textStyle = new ck.ParagraphStyle({
      textStyle: {
        color: toSkColor(ck, "#d1d1d1"),
        fontFamilies: ["Roboto", "Noto Color Emoji"],
        fontSize: 60,
      },
      textAlign: ck.TextAlign.Left,
      maxLines: 100,
      ellipsis: "...",
    });
    rParagraph.current!.width = window.innerWidth * DPR - width * DPR;
    rParagraph.current!.text = text;
    rParagraph.current!.build();
    rParagraph.current!.layout();
    rCursor.current = new Cursor(rParagraph.current!.object!);
    focusTextarea();
    invalidate();
  }, []);

  type BBox = {
    x: number;
    y: number;
    maxX: number;
    maxY: number;
  };

  const getBoundingBox = (paragraph: Paragraph): BBox => {
    return {
      x,
      y,
      maxX: x + paragraph.getMaxWidth(),
      maxY: y + rCursor.current.lineMetrics.reduce((a, b) => a + b.height, 0),
    };
  };

  const collideBBox = (x: number, y: number, bbox: BBox) => {
    return x >= bbox.x && y >= bbox.y && x <= bbox.maxX && y <= bbox.maxY;
  };

  const handleMouseDown = (e) => {
    const paragraph = rParagraph.current!.object!;
    if (!collideBBox(e.pageX * DPR, e.pageY * DPR, getBoundingBox(paragraph))) {
      return;
    }
    console.log("inside", rCursor.current?.lineMetrics);
    e.preventDefault();

    focusTextarea();
    const cursor = rCursor.current!;
    const pos = paragraph!.getGlyphPositionAtCoordinate(
      e.pageX * DPR - width,
      e.pageY * DPR
    );
    let rects = [];
    if (pos) {
      cursor.clearSelection();
      cursor.selection.handleClick(pos.pos);
      rSelection.current.selectionActive = true;
      if (cursor.selection.timesClicked > 1) {
        switch (cursor.selection.timesClicked) {
          case 2: {
            cursor.moveStartOfWord(true);
            cursor.moveEndOfWord(true);
            break;
          }
          case 3: {
            cursor.moveStartOfLine(true);
            cursor.moveEndOfLine(true);
            break;
          }
        }
        rects = cursor.getSelectionRects(ck);
      } else {
        cursor?.moveIndex(pos.pos, true);
      }
      cursor.dirtyLayout = true;
      invalidate();
    }
    setSelectionRects(rects);
  };

  const handleMouseUp = () => {
    rSelection.current.selectionActive = false;
  };

  const handleMouseMove = (e) => {
    if (rSelection.current.selectionActive) {
      const cursor = rCursor.current;
      const skParagraph = rParagraph.current!.object!;
      const pos = skParagraph!.getGlyphPositionAtCoordinate(
        e.pageX * DPR - width,
        e.pageY * DPR
      );
      if (pos) {
        cursor?.moveIndex(pos.pos, true);
        invalidate();
        setSelectionRects(cursor?.getSelectionRects(ck)!);
      }
    }
  };

  const handleInput = (e) => {
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

    const textarea = document.querySelector("textarea")!;
    textarea.addEventListener("input", handleInput);
    textarea.addEventListener("paste", handlePaste);
    textarea.addEventListener("keydown", handleKeydown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      textarea.removeEventListener("input", handleInput);
      textarea.removeEventListener("paste", handlePaste);
      textarea.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const handleTextareaKeydown = (e) => {
    const text = e.target.value;
    e.target.value = "";
    insertText(text);
    focusTextarea();
  };

  const handleKeydown = (e) => {
    invalidate();
    const cursor = rCursor.current!;
    const shift = !!e.shiftKey;

    const clearSelection = () => {
      cursor.clearSelection();
      setSelectionRects([]);
      invalidate();
      rSelection.current.selectionActive = false;
    };

    switch (e.key) {
      case "ArrowLeft":
        e.metaKey
          ? cursor.moveStartOfLine(shift)
          : e.altKey
          ? cursor.moveStartOfWord(shift)
          : cursor.moveLeft(shift);
        if (shift) setSelectionRects(cursor.getSelectionRects(ck));
        else clearSelection();
        break;
      case "ArrowRight":
        e.metaKey
          ? cursor.moveEndOfLine(shift)
          : e.altKey
          ? cursor.moveEndOfWord(shift)
          : cursor.moveRight(shift);
        if (shift) setSelectionRects(cursor.getSelectionRects(ck));
        else clearSelection();
        break;
      case "ArrowUp":
        e.metaKey ? cursor.moveTop(shift) : cursor.moveUp(shift);
        if (shift) setSelectionRects(cursor.getSelectionRects(ck));
        else clearSelection();
        break;
      case "ArrowDown":
        e.metaKey ? cursor.moveBottom(shift) : cursor.moveDown(shift);
        if (shift) setSelectionRects(cursor.getSelectionRects(ck));
        else clearSelection();
        break;
      case "c":
        if (e.metaKey) {
          e.preventDefault();
          if (cursor.selectionIsValid()) {
            const { start, end } = cursor.selection;
            copyToClipboard(
              rParagraph.current!.text.slice(
                Math.min(start, end),
                Math.max(start, end)
              )
            );
          }
        }
        break;
      case "a":
        if (e.metaKey) {
          e.preventDefault();
          cursor.clearSelection();
          cursor.selection.resetState();
          cursor.moveTop(true);
          cursor.moveBottom(true);
          setSelectionRects(cursor.getSelectionRects(ck));
          invalidate();
        }
        break;
      case "x":
        if (e.metaKey) {
          e.preventDefault();
          if (cursor.selectionIsValid()) {
            const { start, end } = cursor.selection;
            copyToClipboard(sliceRange(rParagraph.current!.text, start, end));
          }
        }
        break;
      // Prevent default tab behavior
      case "Tab":
        e.preventDefault();
        insertText("  ");
        break;
      // Prevent default tab behavior
      case "Escape":
        e.preventDefault();
        clearSelection();
        break;
      // @TODO: Handle shift + tab
      case "Backspace": {
        e.preventDefault();

        if (cursor.selectionIsValid()) {
          let { start: _start, end: _end } = cursor.selection;
          const start = Math.min(_start, _end);
          const end = Math.max(_start, _end);

          cursor.moveIndex(start);

          const prevText = rParagraph.current!.text;
          updateParagraph(prevText.slice(0, start) + prevText.slice(end));
          rSelection.current.selectionActive = false;
          clearSelection();
          setSelectionRects([]);
        } else {
          const index = cursor!.getIndex() - 1;
          const to = e.metaKey
            ? cursor.clone().moveStartOfLine().getIndex()
            : e.altKey
            ? cursor.getWordBoundary().start === cursor.getIndex()
              ? cursor.paragraph.getWordBoundary(Math.max(0, index - 1)).start
              : cursor.getWordBoundary().start
            : undefined;
          cursor.moveX((to ?? index) - (index + 1));
          const prevText = rParagraph.current!.text;
          const newText =
            prevText.slice(0, to ?? index) + prevText.slice(index + 1);
          updateParagraph(newText);
        }
        break;
      }
      case "Delete":
        if (rSelection.current.selectionActive) {
          const { start, end } = cursor.selection;
          const prevText = rParagraph.current!.text;
          updateParagraph(prevText.slice(0, start) + prevText.slice(end + 1));
          rSelection.current.selectionActive = false;
          setSelectionRects([]);
        } else {
          const index = cursor!.getIndex();
          const prevText = rParagraph.current!.text;
          updateParagraph(prevText.slice(0, index) + prevText.slice(index + 1));
        }
        clearSelection();
        break;
      default: {
        handleTextareaKeydown(e);
      }
    }
  };

  return (
    <>
      <skParagraph
        ref={rParagraph}
        x={width}
        y={0}
        width={window.innerWidth * DPR}
      />
      <skRrect ref={rCursorRect} style={{ color: "dodgerblue" }} />
      {selectionRects.map(([x, y, w, h]) => (
        <skRrect
          key={String(x + y + w + h + Math.random().toFixed(3))}
          x={x + width}
          y={y}
          width={w - x}
          height={h - y}
          style={{ alpha: 0.3, color: "#ffffff" }}
        />
      ))}
    </>
  );
}

function App({
  short,
  x,
  y,
  width,
}: {
  short: boolean;
  x: number;
  y: number;
  width: number;
}) {
  const canvasRef = useRef<SkCanvas>();
  const [fonts, setFonts] = useState<ArrayBuffer[]>();
  const fontMgr = useFontManager();
  const ck = useCanvasKit();
  const [text, setText] = useState(shortText);

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

  useEffect(() => {
    setText(short ? shortText : longText);
  }, [short]);

  return (
    <skCanvas ref={canvasRef} clear={toSkColor(ck, "#1d1d1d")}>
      <FontManagerProvider fontData={fonts}>
        <TextEditor fontMgr={fontMgr} text={text} x={x} y={y} width={width} />
      </FontManagerProvider>
    </skCanvas>
  );
}

export default function Surface() {
  const rCk = useRef<CanvasKit>(null);
  const [loaded, setLoaded] = useState(false);
  const controls = useControls({
    short: true,
    x: 800,
    y: 0,
    width: 800,
  });

  useEffect(() => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    init().then((ck) => {
      rCk.current = ck;
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (rCk.current) {
      const canvas = document.querySelector("canvas")!;
      render(<App {...controls} />, canvas, {
        canvasKit: rCk.current,
        frameloop: "demand",
        renderMode: 1,
      });
    }
  }, [controls, loaded]);

  return null;
}
