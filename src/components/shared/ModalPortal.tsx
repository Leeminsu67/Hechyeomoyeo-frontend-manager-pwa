"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 모달을 document.body에 직접 렌더링하여 부모의 overflow/transform 제약을 우회합니다.
 */
export function ModalPortal({ children }: { children: React.ReactNode }) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    setContainer(el);

    return () => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);

  if (!container) return null;
  return createPortal(children, container);
}
