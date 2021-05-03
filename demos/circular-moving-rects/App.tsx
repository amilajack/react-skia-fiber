import React, { useRef } from "react";
import { invalidate, useCanvasKit, useFrame } from "../../src";
import { SkRRect } from "../../src/rrect";

export default function App() {
  const canvasKit = useCanvasKit();
  const paint = new canvasKit.Paint();
  paint.setColor(canvasKit.Color4f(0, 0, 0, 1.0));
  paint.setStyle(canvasKit.PaintStyle.Stroke);

  const rects = new Array(6_000).fill(true).map((_, i) => {
    const ref = useRef<SkRRect>();
    const rand = Math.random();
    return {
      elm: <skRrect key={i} ref={ref} paint={paint} />,
      ref,
      rand,
      x: rand * window.innerWidth,
      y: rand * window.innerHeight,
    };
  });

  useFrame((_, ms) => {
    const now = performance.now() * 0.0001;
    rects.forEach((rect, i) => {
      const rectRef = rect.ref.current!;
      const x = rect.x + Math.cos(now * rect.rand) * i + window.innerWidth / 2;
      const y =
        rect.y + Math.sin(now * rect.rand * 10) * i + window.innerHeight / 2;
      rectRef.x = x;
      rectRef.y = y;
      rectRef.dirtyLayout = true;
    });
    invalidate();
  });

  return <skCanvas clear="#ABACAB">{rects.map((rect) => rect.elm)}</skCanvas>;
}
