import type { SkParagraph } from "canvaskit-oc";
import React, { useRef } from "react";
import { SkObjectRef, store } from "../";
import { useFontManager, useFrame } from "..";

const X = 250;
const Y = 250;
const paragraphText =
  "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed.";

export default function App() {
  const skParagraphRef = React.useRef<SkObjectRef<SkParagraph>>(null);
  const textRef = React.useRef<SkObjectRef<never>>(null);
  const fontManager = useFontManager();
  const skLineRef = useRef(null);

  const calcWrapTo = (time: number): number =>
    350 + 150 * Math.sin(time / 2000);

  useFrame((time) => {
    if (skParagraphRef.current) {
      // skParagraphRef.current.width = calcWrapTo(time)
      skLineRef.current.x1 = calcWrapTo(time)
      store.root.render()
    }
  });

  const posA = skParagraphRef.current?.skObject.getGlyphPositionAtCoordinate(X, Y);
  let glyph;
  if (posA) {
    const cp = paragraphText.codePointAt(posA.pos);
    if (cp) {
      glyph = String.fromCodePoint(cp);
    }
  }

  return (
    <skCanvas clear="#5a5a5a">
      <skParagraph
        fontManager={fontManager}
        ref={skParagraphRef}
        maxLines={7}
        ellipsis="..."
        width={100}
      />
      <skLine ref={skLineRef} x1={12} y1={0} x2={100} y2={400} />
    </skCanvas>
  );
}
