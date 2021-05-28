import { FontMgr } from "canvaskit-wasm";
import React, { useRef, useEffect, useState } from "react";
import {
  FontManagerProvider,
  useFontManager,
  SkParagraph,
  SkCanvas,
  useCanvasKit,
  invalidate,
  toSkColor,
} from "../../src";
import alice from "./alice";
import "./style.css";

const PADDING = 800;

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(val, max));

function TextEditor({ fontMgr }: { fontMgr: FontMgr }) {
  const ck = useCanvasKit();
  const rParagraph = useRef<SkParagraph>();
  const rIndex = useRef(0);
  const rCursor = useRef({
    x: PADDING,
    y: 0,
    w: 0,
    h: 0,
  });

  const textarea = useRef(document.querySelector("textarea")!);

  const insertText = (text: string) => {
    const prevText = rParagraph.current!.text;
    const nextIndex = rIndex.current;
    rParagraph.current!.text = [
      prevText.slice(0, nextIndex),
      text,
      prevText.slice(nextIndex),
    ].join("");
    rParagraph.current!.build();
    rParagraph.current!.layout();
    moveCursor(text.length);
    invalidate();
  };

  useEffect(() => {
    rParagraph.current!.fontManager = fontMgr;
    rParagraph.current!.text = alice.slice(0, 8_000);
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
    rParagraph.current!.build();
    rParagraph.current!.width = innerWidth * 2 - PADDING * 2;
    rParagraph.current!.layout();
    invalidate();
  }, []);

  const handleClick = (e) => {
    const skParagraph = rParagraph.current!.object!;
    const posA = skParagraph!.getGlyphPositionAtCoordinate(
      e.pageX * 2,
      e.pageY * 2
    );
    if (posA) {
      const [rect] = skParagraph!.getRectsForRange(
        posA.pos,
        posA.pos + 1,
        ck.RectWidthStyle.Max,
        ck.RectHeightStyle.Max
      );
      const [x, y, _w, h] = rect;
      rCursor.current.width = 5;
      rCursor.current.height = h - y;
      rCursor.current.x = x;
      rCursor.current.y = y;
      rIndex.current = posA.pos;
      rCursor.current.dirtyLayout = true;
      invalidate();
    }
  };

  function handleInput(e) {
    const text = e.target.value;
    (e.target.value = ""), insertText(text), focusTextarea();
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

  const moveCursor = (cursorDelta: number, deltaY = 0) => {
    const skParagraph = rParagraph.current!.object!;
    const metrics = skParagraph.getLineMetrics();
    let nextIndex = rIndex.current;

    if (deltaY === 0) {
      nextIndex = clamp(
        rIndex.current + cursorDelta,
        0,
        metrics[metrics.length - 1].endIndex
      );
    } else {
      const metricIndex = metrics.findIndex(
        (metric) =>
          rIndex.current >= metric.startIndex &&
          rIndex.current <= metric.endExcludingWhitespaces
      );
      if (metricIndex > -1) {
        const nextLineMetric =
          metrics[clamp(metricIndex + deltaY, 0, metrics.length - 1)];
        const currLineMetric = metrics[metricIndex];

        nextIndex = Math.min(
          nextLineMetric.startIndex +
            rIndex.current -
            currLineMetric.startIndex,
          nextLineMetric.endIndex
        );
      }
    }
    const [rect] = skParagraph!.getRectsForRange(
      nextIndex,
      nextIndex + 1,
      ck.RectWidthStyle.Max,
      ck.RectHeightStyle.Max
    );
    if (rect) {
      const [x, y, _w, h] = rect;
      rCursor.current.width = 5;
      rCursor.current.height = h - y;
      rCursor.current.x = x + PADDING;
      rCursor.current.y = y;
      rCursor.current.dirtyLayout = true;
      rIndex.current = nextIndex;
      invalidate();
    }
  };

  const handleKeydown = (e) => {
    switch (e.key) {
      case "ArrowLeft":
        moveCursor(-1);
        break;
      case "ArrowRight":
        moveCursor(1);
        break;
      case "ArrowUp":
        moveCursor(0, -1);
        break;
      case "ArrowDown":
        moveCursor(0, 1);
        break;
      // Prevent default tab behavior
      case "Tab":
        e.preventDefault();
        insertText("  ");
        break;
      // @TODO: Handle shift + tab
      case "Backspace": {
        const nextIndex = rIndex.current - 1;
        const prevText = rParagraph.current!.text;
        const newText =
          prevText.slice(0, nextIndex) + prevText.slice(nextIndex + 1);
        rParagraph.current!.text = newText;
        rParagraph.current!.build();
        rParagraph.current!.layout();
        moveCursor(-1);
        invalidate();
        break;
      }
      case "Delete":
        const nextIndex = rIndex.current;
        const prevText = rParagraph.current!.text;
        const newText =
          prevText.slice(0, nextIndex) + prevText.slice(nextIndex + 1);
        rParagraph.current!.text = newText;
        rParagraph.current!.build();
        rParagraph.current!.layout();
        invalidate();
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
      <skRrect ref={rCursor} style={{ color: "#3477f4" }} />
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
