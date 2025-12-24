import { useEffect, useState } from "react";

export function useLandscapeBlocker(isMobile: boolean) {
  const [isLandscape, setIsLandscape] = useState(false);
  const [allowLandscape, setAllowLandscape] = useState(
    document.documentElement.dataset.allowLandscape === "true"
  );

  useEffect(() => {
    if (!isMobile) {
      setIsLandscape(false);
      return;
    }

    const mq = window.matchMedia("(orientation: landscape)");

    const update = () => {
      setIsLandscape(isMobile && mq.matches);
      setAllowLandscape(document.documentElement.dataset.allowLandscape === "true");
    };

    update();

    if ("addEventListener" in mq) {
      mq.addEventListener("change", update);
    } else {
      // @ts-expect-error - Safari legacy
      mq.addListener(update);
    }

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-allow-landscape"],
    });

    return () => {
      observer.disconnect();
      if ("removeEventListener" in mq) {
        mq.removeEventListener("change", update);
      } else {
        // @ts-expect-error - Safari legacy
        mq.removeListener(update);
      }
    };
  }, [isMobile]);

  return { shouldBlock: isLandscape && !allowLandscape };
}
