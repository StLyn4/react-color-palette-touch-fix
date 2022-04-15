import React, { useCallback, useEffect, useRef } from "react";
import { InteractiveProps } from "../interfaces/Interactive.interface";
import { clamp } from "../utils/clamp.util";

interface PointerPosition {
  x: number;
  y: number;
}

const getPointerPosition = (event: MouseEvent | TouchEvent): PointerPosition => {
  if (window.TouchEvent && event instanceof TouchEvent) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  } else if (event instanceof MouseEvent) {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  } else {
    throw new Error("Unexpected event: " + event);
  }
};

export const Interactive = ({ className, style, onChange, children }: InteractiveProps): JSX.Element => {
  const divRef = useRef<HTMLDivElement>(null);

  const move = useCallback(
    (clientX: number, clientY: number, complete?: boolean): void => {
      if (divRef.current) {
        const { current: div } = divRef;
        const { width, height, left, top } = div.getBoundingClientRect();

        const x = clamp(clientX - left, width, 0);
        const y = clamp(clientY - top, height, 0);

        onChange({ x, y });

        if (complete) onChange({ x, y, complete: true });
      }
    },
    [onChange]
  );

  const onPointerMove = useCallback(
    (event: MouseEvent | TouchEvent): void => {
      const point = getPointerPosition(event);

      move(point.x, point.y);
    },
    [move]
  );

  const onPointerUp = useCallback(
    (event: MouseEvent | TouchEvent): void => {
      document.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("mouseup", onPointerUp);
      document.removeEventListener("touchmove", onPointerMove);
      document.removeEventListener("touchend", onPointerUp);

      const point = getPointerPosition(event);

      move(point.x, point.y, true);
    },
    [move, onPointerMove]
  );

  const onPointerDown = useCallback(
    (event: MouseEvent | TouchEvent): void => {
      if (event instanceof MouseEvent && event.button !== 0) {
        return;
      } else if (event.cancelable) {
        event.preventDefault();
      }

      const point = getPointerPosition(event);

      move(point.x, point.y);

      document.addEventListener("mousemove", onPointerMove, {
        passive: false,
      });
      document.addEventListener("mouseup", onPointerUp, {
        passive: false,
      });
      document.addEventListener("touchmove", onPointerMove, {
        passive: false,
      });
      document.addEventListener("touchend", onPointerUp, {
        passive: false,
      });
    },
    [move, onPointerMove, onPointerUp]
  );

  useEffect(() => {
    const div = divRef.current;

    if (div) {
      div.addEventListener("mousedown", onPointerDown, {
        passive: false,
      });
      div.addEventListener("touchstart", onPointerDown, {
        passive: false,
      });
    }

    return (): void => {
      if (div) {
        div.removeEventListener("mousedown", onPointerDown);
        div.removeEventListener("touchstart", onPointerDown);
      }
    };
  }, [onPointerDown]);

  return (
    <div ref={divRef} className={className} style={style}>
      {children}
    </div>
  );
};
