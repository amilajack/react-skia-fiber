import React, { useRef } from "react";
import SimplexNoise from 'simplex-noise';
import { invalidate, useCanvasKit, useFrame } from "../../src";
import CkRRect from "../../src/rrect";

export default function App() {
  const canvasKit = useCanvasKit();

  const rects = new Array(3_000).fill(true).map((_, i) => {
    const ref = useRef<CkRRect>()
    const simplex = new SimplexNoise(String(i));
    return { elm: <skRrect key={i} ref={ref} />, ref, simplex }
  });

  useFrame(() => {
    const now = performance.now() * 0.0001;
    rects.forEach((rect, i) => {
      rect.ref.current!.x = (rect.simplex.noise2D(i + now, 0) + 1) * window.innerWidth;
      rect.ref.current!.y = (rect.simplex.noise2D(i + 1 + now, 0) + 1) * window.innerHeight;
      rect.ref.current!.paint.setColor(canvasKit.Color4f(
        (rect.simplex.noise2D(i + .1 + now, 0) + 1) / 2,
        (rect.simplex.noise2D(i + .2 + now, 0) + 1) / 2,
        (rect.simplex.noise2D(i + .3 + now, 0) + 1) / 2,
        1.0
      ));
      rect.ref.current!.dirtyLayout = true;
    })
    invalidate()
  })

  return (
    <skCanvas clear="#ABACAB">
      {rects.map(rect => rect.elm)}
    </skCanvas>
  )
}
