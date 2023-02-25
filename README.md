# react-skia-fiber

A React renderer for Skia

## Setup

```bash
npm install react-skia-fiber
```

## Usage

```tsx
import React, { useEffect, useState } from "react";
import { SkParagraph } from "react-skia-fiber";

export default function App() {
  const paragraphRef = React.useRef<SkParagraph>();
  const [color, setColor] = useState("red");

  useEffect(() => {
    let colors = ["red", "green", "blue"];
    let i = 0;
    let interval = setInterval(() => {
      i++;
      setColor(colors[i % 3]);
    }, 1_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <skCanvas clear="#ABACAB">
      <skParagraph
        x={100}
        y={100}
        width={500}
        ref={paragraphRef}
        text={color}
      />
      <skText x={100} y={100} text={color} />
    </skCanvas>
  );
}
```

## Roadmap

- [ ] Font Size
- [ ] Paint Ownership
- [ ] Animation (integration w/ [react-spring](https://github.com/pmndrs/react-spring))
- [ ] Event Binding (`<skRrect onClick={...} />`)
- [ ] Full SVG support (ex. `<skPath svg="<svg ... />" />`)

## Docs

- **SkSurface**, which is an object that manages the memory into which the canvas commands are drawn.
- **SkCanvas** is the drawing context for Skia. It knows where to direct the drawing. and maintains a stack of matrices and clips.Skia does not store any other drawing attributes in the context (e.g. color, pen size). Rather, these are specified explicitly in each draw call, via a SkPaint.
- **SkPaint**: Anytime you draw something in Skia, and want to specify what color it is, or how it blends with the background, or what style or font to draw it in, you specify those attributes in a paint.

## Paint Ownership

react-skia-fiber objects can own their own paints:

```tsx
<skPath svg="..." />
<skPath paint={{ style: "fill" }} />
```

If paints are passed as props they no longer own their paints. Deallocation of borrowed paints is owned by the environment that initialized the paints.

```tsx
<skPath paint={myPaint} ... />
```

## Demos

```bash
yarn parcel demos/moving-rects/index.html
yarn parcel demos/circular-moving-rects/index.html
```
