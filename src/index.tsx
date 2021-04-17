import type { CanvasKit, SkFontManager, SkObject } from "canvaskit-oc";
import { init as canvasKitInit } from "canvaskit-oc";
import type { FunctionComponent, ReactNode } from "react";
import React from "react";
import ReactReconciler from "react-reconciler";
import {
  CkElement,
  CkElementContainer,
  CkElementProps,
  CkElementType,
  createCkElement,
  isContainerElement,
} from "./types";

const canvasKitPromise: Promise<CanvasKit> = canvasKitInit();
let canvasKit: CanvasKit | undefined;

let CanvasKitContext: React.Context<CanvasKit>;
export let useCanvasKit: () => CanvasKit;
export let CanvasKitProvider: FunctionComponent;

let FontManagerContext: React.Context<SkFontManager>;
export let useFontManager: () => SkFontManager;
export let FontManagerProvider: FunctionComponent<{
  fontData: ArrayBuffer | ArrayBuffer[] | undefined;
  children?: ReactNode;
}>;

export const useFrame = (callback: (time: number) => void) => {
  const requestRef = React.useRef<number>()

  const animate = (time: number) => {
    callback(time)
    requestRef.current = requestAnimationFrame(animate)
  }

  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, []);
}

enum RenderModes {
  legacy = 0,
  blocking = 1,
  concurrent = 2,
}

export async function init() {
  canvasKit = await canvasKitPromise;
  // const copy to make the TS compiler happy when we pass it down to a lambda
  const ck = canvasKit;

  CanvasKitContext = React.createContext(ck);
  useCanvasKit = () => React.useContext(CanvasKitContext);
  CanvasKitProvider = ({ children }) => (
    <CanvasKitContext.Provider value={ck}>children</CanvasKitContext.Provider>
  );

  FontManagerContext = React.createContext(ck.SkFontMgr.RefDefault());
  useFontManager = () => React.useContext(FontManagerContext);
  FontManagerProvider = (props: {
    fontData: ArrayBuffer | ArrayBuffer[] | undefined;
    children?: ReactNode;
  }) => {
    return (
      <FontManagerContext.Provider
        value={
          props.fontData
            ? ck.SkFontMgr.FromData(props.fontData)
            : ck.SkFontMgr.RefDefault()
        }
      >
        {props.children}
      </FontManagerContext.Provider>
    );
  };
}

type ContainerContext = {
  ckElement: CkElement<any>;
};

export type SkObjectRef<T extends SkObject<any> | undefined | never> = T;

const EMPTY = {}

const reconciler = ReactReconciler({
  /**
   * This function is used by the reconciler in order to calculate current time for prioritising work.
   */
  now: Date.now,
  supportsMutation: true,
  supportsPersistence: true,
  supportsHydration: false,

  createContainerChildSet(
    container: CkElementContainer<any>
  ): CkElement<any>[] {
    return [];
  },
  /**
   * Attaches new children to the set returned by createContainerChildSet
   * @param childSet
   * @param child
   */
  appendChildToContainerChildSet(childSet, child) {
    childSet.push(child);
  },
  appendChildToContainer(container, child) {
    container.children.push(child);
  },
  replaceContainerChildren(container, newChildren) {
    container.children.forEach((child) => child.delete());
    container.children = newChildren;
  },
  /**
   * This function lets you share some context with the other functions in this HostConfig.
   *
   * @param rootContainerInstance is basically the root dom node you specify while calling render. This is most commonly
   * <div id="root"></div>
   * @return A context object that you wish to pass to immediate child.
   */
  getRootHostContext(rootContainerInstance): ContainerContext {
    return { ckElement: rootContainerInstance };
  },

  /**
   * This function provides a way to access context from the parent and also a way to pass some context to the immediate
   * children of the current node. Context is basically a regular object containing some information.
   *
   * @param parentHostContext Context from parent. Example: This will contain rootContext for the immediate child of
   * roothost.
   * @param type This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param rootContainerInstance rootInstance is basically the root dom node you specify while calling render. This is
   * most commonly <div id="root"></div>
   * @return A context object that you wish to pass to immediate child.
   */
  getChildHostContext(
    parentHostContext,
    type,
    rootContainerInstance
  ): ContainerContext {
    return parentHostContext;
  },

  /**
   * If the function returns true, the text would be created inside the host element and no new text element would be
   * created separately.
   *
   * If this returned true, the next call would be to createInstance for the current element and traversal would stop at
   * this node (children of this element wont be traversed).
   *
   * If it returns false, getChildHostContext and shouldSetTextContent will be called on the child elements and it will
   * continue till shouldSetTextContent returns true or if the recursion reaches the last tree endpoint which usually is
   * a text node. When it reaches the last leaf text node it will call createTextInstance
   *
   * @param type This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props Contains the props passed to the host react element.
   * @return This should be a boolean value.
   */
  shouldSetTextContent(type, props): boolean {
    return type === "skText" || type === "skParagraph";
  },

  /**
   * Here we specify how renderering should handle text content
   *
   * @param text contains the text string that needs to be rendered.
   * @param rootContainerInstance root dom node you specify while calling render. This is most commonly
   * <div id="root"></div>
   * @param hostContext contains the context from the host node enclosing this text node. For example, in the case of
   * <p>Hello</p>: currentHostContext for Hello text node will be host context of p.
   * @param internalInstanceHandle The fiber node for the text instance. This manages work for this instance.
   * @return This should be an actual text view element. In case of dom it would be a textNode.
   */
  createTextInstance(
    text,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ): CkElement<"skText"> | CkElement<"skParagraph"> {
    throw new Error(
      `The text '${text}' must be wrapped in a text or paragraph element.`
    );
  },

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
    type: CkElementType,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    return createCkElement(type, props, hostContext.ckElement.canvasKit);
  },

  /**
   * Here we will attach the child dom node to the parent on the initial render phase. This method will be called for
   * each child of the current node.
   *
   * @param parentInstance The current node in the traversal
   * @param child The child dom node of the current node.
   */
  appendInitialChild(parentInstance, child) {
    if (isContainerElement(parentInstance)) {
      parentInstance.children.push(child);
    } else {
      throw new Error(
        "Bug? Trying to append a child to a parent that is not a container."
      );
    }
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
   * @param parentInstance The instance is the dom element after appendInitialChild.
   * @param type This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props Contains the props passed to the host react element.
   * @param rootContainerInstance root dom node you specify while calling render. This is most commonly <div id="root"></div>
   * @param hostContext contains the context from the parent node enclosing this node. This is the return value from getChildHostContext of the parent node.
   */
  finalizeInitialChildren(
    parentInstance,
    type,
    props,
    rootContainerInstance,
    hostContext
  ) {
    return false;
  },
  finalizeContainerChildren(container, newChildren) {},

  /**
   * This function is called when we have made a in-memory render tree of all the views (Remember we are yet to attach
   * it the the actual root dom node). Here we can do any preparation that needs to be done on the rootContainer before
   * attaching the in memory render tree. For example: In the case of react-dom, it keeps track of all the currently
   * focused elements, disabled events temporarily, etc.
   *
   * @param containerInfo root dom node you specify while calling render. This is most commonly <div id="root"></div>
   */
  prepareForCommit(containerInfo) {},

  /**
   * This function gets executed after the inmemory tree has been attached to the root dom element. Here we can do any
   * post attach operations that needs to be done. For example: react-dom re-enabled events which were temporarily
   * disabled in prepareForCommit and refocuses elements, etc.
   *
   * @param containerInfo root dom node you specify while calling render. This is most commonly <div id="root"></div>
   */
  resetAfterCommit(containerInfo) {
    // TODO instead of re-rendering everything, only rerender dirty nodes?
    containerInfo.children.forEach((child) => child.render(containerInfo));
    containerInfo.props.renderCallback?.();
  },

  getPublicInstance(
    instance: CkElement<any> | CkElement<"text">
  ): SkObjectRef<any> {
    return instance;
  },

  prepareUpdate(
    _instance,
    type,
    oldProps,
    newProps,
    rootContainerInstance,
    hostContext
  ) {
    // TODO check & return if we can need to create an entire new object or we can reuse the underlying skobject and use it as the payload in cloneInstance.
  },

  cloneInstance(
    instance,
    updatePayload,
    type,
    oldProps,
    newProps,
    internalInstanceHandle,
    keepChildren,
    recyclableInstance
  ): CkElement<any> {
    // TODO implement a way where we can create a new instance and reuse the underlying canvaskit objects where possible

    const ckElement = createCkElement(type, newProps, instance.canvasKit);
    if (
      keepChildren &&
      isContainerElement(ckElement) &&
      isContainerElement(instance)
    ) {
      ckElement.children = instance.children;
    }
    // recyclableInstance.props = newProps
    // return recyclableInstance
    return ckElement;
  },
  preparePortalMount(...args: any) {
    // noop
  },
  clearContainer() {
    return false
  },
});

reconciler.injectIntoDevTools({
  bundleType: process.env.NODE_ENV === 'production' ? 0 : 1,
  version: "0.0.1",
  rendererPackageName: "react-skia-fiber",
});

export const store = {}

export function render(
  element: React.ReactNode,
  canvas: HTMLCanvasElement,
  renderCallback?: () => void
) {
  if (canvasKit === undefined) {
    throw new Error("Not initialized");
  }

  const skSurface = canvasKit.MakeCanvasSurface(canvas);
  const ckSurfaceElement: CkElementContainer<"skSurface"> = {
    canvasKit,
    type: "skSurface",
    // @ts-ignore
    props: { width: canvas.width, height: canvas.height, renderCallback },
    skObjectType: "SkSurface",
    skObject: skSurface,
    children: [],
    render() {
      this.children.forEach((child) => child.render(ckSurfaceElement));
    },
  };

  store.root = ckSurfaceElement;

  const container = reconciler.createContainer(
    ckSurfaceElement,
    RenderModes.concurrent,
    false,
    null
  );

  return new Promise<void>((resolve) => {
    reconciler.updateContainer(element, container, null, () =>
      resolve()
    );
  });
}
