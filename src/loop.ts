import { Root } from "./renderer";
import { RootState } from "./store";

export class Clock {
  constructor(autoStart?: boolean) {
    this.autoStart = autoStart !== undefined ? autoStart : true;

    this.startTime = 0;
    this.oldTime = 0;
    this.elapsedTime = 0;

    this.running = false;
  }

  start() {
    this.startTime = now();

    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
  }

  stop() {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }

  getElapsedTime() {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta() {
    let diff = 0;

    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }

    if (this.running) {
      const newTime = now();

      diff = (newTime - this.oldTime) / 1000;
      this.oldTime = newTime;

      this.elapsedTime += diff;
    }

    return diff;
  }
}

function now() {
  return (typeof performance === "undefined" ? Date : performance).now(); // see #10732
}

function render(timestamp: number, state: RootState) {
  // Call subscribers (useFrame)
  const delta = state.clock.getDelta();
  for (let i = 0; i < state.internal.subscribers.length; i++)
    state.internal.subscribers[i].ref.current(state, delta);
  // Render content
  if (!state.internal.priority) state.surface.render();
  // Decrease frame count
  state.internal.frames = Math.max(0, state.internal.frames - 1);
  return state.frameloop === "always" ? 1 : state.internal.frames;
}

export function createLoop(roots: Map<Element, Root>) {
  let running = false;
  let repeat: number;

  function loop(timestamp: number) {
    running = true;
    repeat = 0;

    roots.forEach((root) => {
      const state = root.store.getState();
      // If the frameloop is invalidated, do not run another frame
      if (
        state.internal.active &&
        (state.frameloop === "always" || state.internal.frames > 0)
      )
        repeat += render(timestamp, state);
    });

    // Keep on looping if anything invalidates the frameloop
    if (repeat > 0) return requestAnimationFrame(loop);

    // Flag end of operation
    running = false;
  }

  function invalidate(state?: RootState): void {
    if (!state)
      return roots.forEach((root) => invalidate(root.store.getState()));
    if (!state.internal.active || state.frameloop === "never") return;
    // If the render-loop isn't active, start it
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  return { invalidate };
}
