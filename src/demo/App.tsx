import React, { useRef, useEffect } from "react";
import { store } from "../";
import { useFrame } from "..";
import CkLine from "../line";
import CkParagraph from "../paragraph";
import CkText from "../text";

const X = 250;
const Y = 250;
const paragraphText =
  "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed.";

export default function App(position: { x: number, y: number }) {
  const paragraphRef = React.useRef<CkParagraph>();
  const lineRef = useRef<CkLine>();
  const textRef = useRef<CkText>();

  const calcWrapTo = (time: number): number =>
    350 + 150 * Math.sin(time / 2000);

  useFrame((time) => {
    if (lineRef.current && paragraphRef.current) {
      const wrap = calcWrapTo(time);
      lineRef.current.x1 = wrap;
      lineRef.current.x2 = wrap;
      paragraphRef.current.width = wrap;

      const posA = paragraphRef.current.skObject?.getGlyphPositionAtCoordinate(X, Y);
      let glyph;
      if (posA) {
        const cp = paragraphText.codePointAt(posA.pos);
        if (cp) {
          glyph = String.fromCodePoint(cp);
        }
      }
      textRef.current.text = glyph ?? 'none'

      store?.root?.render()
    }
  });

  return (
    <skCanvas clear="#5a5a5a">
      <skLine ref={lineRef} x1={0} y1={0} x2={0} y2={400} />
      <skParagraph ref={paragraphRef} width={100} />
      <skText y={400} ref={textRef} />
    </skCanvas>
  );
}
