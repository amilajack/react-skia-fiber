## react-skia-fiber

### Docs

#### Paint Ownership

react-skia-fiber objects can own their own paints:

```tsx
<skPath svg="..." />
<skPath paint={{ style: "fill" }} />
```

If paints are passed as props they no longer own their paints. Deallocation of borrowed paints is owned by the environment that initialized the paints.

```tsx
<skPath paint={myPaint} ... />
```
