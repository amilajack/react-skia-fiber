import { useRef, useEffect } from "react";

export const useFrame = (callback: (time: number) => void) => {
  const requestRef = useRef<number>();

  const animate = (time: number) => {
    callback(time);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
};
