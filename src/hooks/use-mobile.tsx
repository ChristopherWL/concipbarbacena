import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Detect if the device is actually a mobile/touch device (not just screen width)
function detectMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check touch support
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i;
  const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
  
  // Check screen width
  const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
  
  // Consider it mobile if:
  // 1. Has touch AND matches mobile user agent (real mobile device)
  // 2. OR screen is small (preview mode or small window)
  return (hasTouch && isMobileUA) || isSmallScreen;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => detectMobileDevice());

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(detectMobileDevice());
    
    // Check on mount
    checkMobile();
    
    // Also listen for resize to handle preview dimension changes
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// Hook that checks screen width (for responsive layouts that should change with orientation)
export function useIsSmallScreen() {
  const [isSmall, setIsSmall] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsSmall(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsSmall(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isSmall;
}
