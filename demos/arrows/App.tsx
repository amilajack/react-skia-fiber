import React, { useEffect, useState } from 'react'
import { invalidate } from '../../src'

export default function App() {
  const [color, setColor] = useState('red')

  useEffect(() => {
    let colors = ['red', 'green', 'blue']
    let i = 0
    let interval = setInterval(() => {
      i++
      setColor(colors[i % 3])
      invalidate()
    }, 1_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <skCanvas clear="#ABACAB">
      <skRrect x={150 - 10 / 2} y={200} width={10} style={{ color }} />
      <skPath
        svg="M150 150 L125 200 L175 200 Z"
        style={{ style: 'fill', color, strokeWidth: 5 }}
      />
      <skPath
        svg={`M10 10 Q100 100 400 400`}
        style={{ style: 'stroke', strokeWidth: 8 }}
      />
    </skCanvas>
  )
}
