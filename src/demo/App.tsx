import React, { useRef, useEffect } from "react";
import { store } from "../";
import { useFrame } from "..";
import CkLine from "../line";
import CkParagraph from "../paragraph";
import CkText from "../text";
import CkCanvas from "../canvas";

const paragraphText =
  "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed.";

const X = 100;
const Y = 200;

function App({x = 0, y = 0}: { x: number, y: number }) {
  const paragraphRef = React.useRef<CkParagraph>();
  const lineRef = useRef<CkLine>();
  const textRef = useRef<CkText>();
  const seed = Math.random();

  const calcWrapTo = (time: number): number =>
    350 + 150 * seed * Math.sin(seed * time / 200);

  useEffect(() => {
    paragraphRef.current?.build()
  }, [])

  useFrame((time) => {
    const wrap = calcWrapTo(time);
    lineRef.current!.x1 = wrap + x;
    lineRef.current!.x2 = wrap + x;
    paragraphRef.current!.width = wrap;

    const posA = paragraphRef.current!.skObject?.getGlyphPositionAtCoordinate(X, Y);
    let glyph;
    if (posA) {
      const cp = paragraphText.codePointAt(posA.pos);
      if (cp) {
        glyph = String.fromCodePoint(cp);
      }
    }
    textRef.current!.text = glyph ?? 'none'
  });

  return (
    <>
      <skLine ref={lineRef} x1={x} y1={y} x2={x} y2={y + 400} />
      <skParagraph ref={paragraphRef} text={paragraphText} x={x} y={y} width={500} />
      <skText ref={textRef} y={y + 450} x={x} />
    </>
  );
}

export default function StressTest() {
  const canvasRef = useRef<CkCanvas>();
  const elms = new Array(60);
  for (let i = 0; i < elms.length; i++) {
    elms[i] = i;
  }

  useFrame((time) => {
    canvasRef.current?.skObject?.translate(10*Math.cos(time/500), 10*Math.sin(time/500))
    store?.root?.render();
  });

  return (
    <skCanvas ref={canvasRef} clear="#ABACAB">
      {elms.map((num) => (
        <App x={500 * (num % 5)} y={Math.floor(num / 5) * 500} key={num} />
      ))}
    </skCanvas>
  );
}
