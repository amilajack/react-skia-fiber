import React from "react";
import Reconciler from "react-reconciler";
import { isEqual } from "lodash";
import { CkChild, CkContainer, CkElement, CkElementProps } from "./types";
import CkCanvas from "./canvas";
import CkParagraph from "./paragraph";
import { canvasKit } from ".";
import { CanvasKit } from "canvaskit-wasm";
import CkLine from "./line";
import CkRrect from "./rrect";
import CkText from "./text";
import CkSurface from "./surface";
import { UseStore } from "zustand";
import { createStore, RootState, context } from "./store";
import { createLoop } from "./loop";

let roots = new Map<Element, Root>();
export const { invalidate } = createLoop(roots);

type Instance = CkElement;
export type InstanceProps = {
  [key: string]: unknown;
};

enum RenderModes {
  legacy = 0,
  blocking = 1,
  concurrent = 2,
}

const EMPTY = {};

const FILTER = ["children", "key", "ref"];

function invalidateInstance(instance: Instance) {
  const state = instance.__r3f?.root?.getState?.();
  if (state && state.internal.frames === 0) state.invalidate();
}

function appendChild(parentInstance: CkContainer, child: CkChild) {
  parentInstance.children.push(child);
}

function removeChild(parentInstance: CkContainer, child: CkChild) {
  child.delete();
  parentInstance.children.splice(parentInstance.children.indexOf(child), 1);
}

function insertBefore(
  parentInstance: CkContainer,
  child: CkChild,
  beforeChild: CkChild
) {
  const index = parentInstance.children.indexOf(beforeChild);
  const { children } = parentInstance;
  parentInstance.children = [
    ...children.slice(0, index),
    child,
    ...children.slice(index),
  ];
}

const reconciler = Reconciler({
  /**
   * This function is used by the reconciler in order to calculate current time for prioritising work.
   */
  now: Date.now,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: false,

  appendChild,
  appendInitialChild: appendChild,
  removeChild,
  insertBefore,

  /**
   * Create instance is called on all host nodes except the leaf text nodes. So we should return the correct view
   * element for each host type here. We are also supposed to take care of the props sent to the host element. For
   * example: setting up onClickListeners or setting up styling etc.
   *
   * @param type This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props  Contains the props passed to the host react element.
   * @param rootContainerInstance Root dom node you specify while calling render. This is most commonly <div id="root"></div>
   * @param hostContext contains the context from the parent node enclosing this node. This is the return value from getChildHostContext of the parent node.
   * @param internalInstanceHandle The fiber node for the text instance. This manages work for this instance.
   */
  createInstance(
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    // @TODO: initialize with props without having to call applyProps
    const instance = (() => {
      switch (type) {
        case "skCanvas":
          return new CkCanvas(canvasKit as CanvasKit);
        case "skParagraph":
          return new CkParagraph(canvasKit as CanvasKit);
        case "skLine":
          return new CkLine(canvasKit as CanvasKit);
        case "skText":
          return new CkText(canvasKit as CanvasKit);
        case "skRrect":
          return new CkRrect(canvasKit as CanvasKit);
        default:
          throw "invalid instance";
      }
    })();
    applyProps(instance, props, {});
    return instance;
  },
  createTextInstance() {},
  appendChildToContainer: (parentInstance: CkContainer, child: CkElement) => {
    appendChild(parentInstance, child);
  },
  insertInContainerBefore(
    parentInstance: Instance,
    child: Instance,
    beforeChild: Instance
  ) {
    insertBefore(parentInstance, child, beforeChild);
  },
  removeChildFromContainer: (parentInstance: CkContainer, child: CkChild) => {
    removeChild(parentInstance, child);
  },
  commitMount() {},
  commitUpdate(
    instance: Instance,
    updatePayload: any,
    type: string,
    oldProps: InstanceProps,
    newProps: InstanceProps,
    fiber: Reconciler.Fiber
  ) {
    applyProps(instance, newProps, oldProps);
  },
  /**
   * In case of react native renderer, this function does nothing but return false.
   *
   * In case of react-dom, this adds default dom properties such as event listeners, etc.
   * For implementing auto focus for certain input elements (autofocus can happen only
   * after render is done), react-dom sends return type as true. This results in commitMount
   * method for this element to be called. The commitMount will be called only if an element
   * returns true in finalizeInitialChildren and after the all elements of the tree has been
   * rendered (even after resetAfterCommit).
   *
   * Triggers commitMount
   *
   * @param parentInstance The instance is the dom element after appendInitialChild.
   * @param type This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props Contains the props passed to the host react element.
   * @param rootContainerInstance root dom node you specify while calling render. This is most commonly <div id="root"></div>
   * @param hostContext contains the context from the parent node enclosing this node. This is the return value from getChildHostContext of the parent node.
   */
  finalizeInitialChildren() {
    return true;
  },
  shouldSetTextContent() {
    return false;
  },
  getRootHostContext(rootContainer: CkElement) {
    return EMPTY;
  },
  getChildHostContext(parentHostContext: any) {
    return EMPTY;
  },
  scheduleTimeout() {},
  cancelTimeout() {},
  noTimeout() {},
  queueMicrotask() {},
  /**
   * This function gets executed after the inmemory tree has been attached to the root dom element. Here we can do any
   * post attach operations that needs to be done. For example: react-dom re-enabled events which were temporarily
   * disabled in prepareForCommit and refocuses elements, etc.
   *
   * @param containerInfo root dom node you specify while calling render. This is most commonly <div id="root"></div>
   */
  resetAfterCommit(containerInfo) {
    containerInfo.children.forEach((child) =>
      child.render(containerInfo.skObject)
    );
  },
  getPublicInstance(instance: CkElement): CkElement {
    return instance;
  },
  /**
   * This function is called when we have made a in-memory render tree of all the views (Remember we are yet to attach
   * it the the actual root dom node). Here we can do any preparation that needs to be done on the rootContainer before
   * attaching the in memory render tree. For example: In the case of react-dom, it keeps track of all the currently
   * focused elements, disabled events temporarily, etc.
   *
   * @param containerInfo root dom node you specify while calling render. This is most commonly <div id="root"></div>
   */
  prepareForCommit() {
    return null;
  },
  prepareUpdate() {
    return EMPTY;
  },
  preparePortalMount(...args: any) {
    // noop
  },
  clearContainer() {
    return false;
  },
});

reconciler.injectIntoDevTools({
  bundleType: process.env.NODE_ENV === "production" ? 0 : 1,
  version: "0.0.1",
  rendererPackageName: "react-skia-fiber",
});

export const store = {};

export type Root = { fiber: Reconciler.FiberRoot; store: UseStore<RootState> };

export type LocalState = {
  root: UseStore<RootState>;
  objects: CkElement[];
  instance?: boolean;
  // handlers?: EventHandlers
  memoizedProps: {
    [key: string]: any;
  };
};

export function unmountComponentAtNode<TElement extends Element>(
  canvas: TElement,
  callback?: (canvas: TElement) => void
) {
  const root = roots.get(canvas);
  const fiber = root?.fiber;
  if (fiber) {
    const state = root?.store.getState();
    reconciler.updateContainer(null, fiber, null, () => {
      if (state) {
        setTimeout(() => {
          roots.delete(canvas);
          if (callback) callback(canvas);
        }, 500);
      }
    });
  }
}

function applyProps(
  elm: CkChild,
  newProps: CkElementProps,
  oldProps: CkElementProps = {}
) {
  const isDirty = !isEqual(newProps, oldProps);
  elm.dirty = isDirty;
  elm.dirtyLayout = false;
  if (!isDirty) return;

  const filteredProps: { [key: string]: any } = {};
  Object.entries(newProps).forEach(([key, entry]) => {
    // we don't want children, ref or key in the memoized props
    if (!FILTER.includes(key)) {
      filteredProps[key] = entry;
    }
  });
  for (const key in filteredProps) {
    elm[key] = filteredProps[key];
    if (
      !elm.dirtyLayout &&
      elm.layoutProperties?.has(key) &&
      newProps[key] !== oldProps[key]
    ) {
      elm.dirtyLayout = true;
    }
  }

  return elm;
}

export type RenderProps = {
  width?: number;
  height?: number;
  dpr?: 1 | 2;
  canvasKit: CanvasKit;
  renderMode?: RenderModes;
};

export function render(
  element: React.ReactNode,
  canvas: HTMLCanvasElement,
  { canvasKit }: RenderProps
): UseStore<RootState> {
  // Allow size to take on container bounds initially

  let root = roots.get(canvas);
  let fiber = root?.fiber;
  let store = root?.store;

  if (!fiber) {
    // If no root has been found, make one

    // Create gl
    const surface = new CkSurface(canvasKit, canvas);
    store = createStore(canvasKit, surface, invalidate);
    // Create renderer
    fiber = reconciler.createContainer(
      surface,
      RenderModes.blocking,
      false,
      null
    );
    // Map it
    roots.set(canvas, { fiber, store });
  }

  if (store && fiber) {
    reconciler.updateContainer(
      <Provider store={store} element={element} />,
      fiber,
      null,
      () => undefined
    );
    return store;
  } else {
    throw "Error creating root!";
  }
}

function Provider({
  store,
  element,
}: {
  store: UseStore<RootState>;
  element: React.ReactNode;
}) {
  return <context.Provider value={store}>{element}</context.Provider>;
}