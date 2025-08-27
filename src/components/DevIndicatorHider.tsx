'use client';

import { useEffect } from 'react';

export default function DevIndicatorHider() {
  useEffect(() => {
    const hideDevIndicators = () => {
      // Only target VERY SPECIFIC Next.js development indicators
      const specificSelectors = [
        '[data-nextjs-dialog-overlay]',
        '[data-nextjs-build-watcher]',
        '[data-turbo-dev-overlay]',
        '.nextjs-turbo-dev-overlay',
        '.__nextjs_turbo_dev_overlay__',
        '#__next-build-watcher',
        '.__next-build-watcher',
        '[id^="__nextjs"]',
        '[class^="__nextjs"]'
      ];

      specificSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          if (element instanceof HTMLElement) {
            element.remove();
          }
        });
      });

      // Very specific targeting for the "N" indicator - must be fixed position, circular, and contain only "N"
      const allDivs = document.querySelectorAll('div[style*="position: fixed"]');
      allDivs.forEach(div => {
        const computedStyle = window.getComputedStyle(div);
        const text = div.textContent?.trim();
        
        // Only remove if it's exactly "N", has high z-index, and looks like a dev indicator
        if (text === 'N' && 
            computedStyle.position === 'fixed' && 
            parseInt(computedStyle.zIndex || '0') > 9999 &&
            (computedStyle.borderRadius === '50%' || 
             div.style.borderRadius === '50%' ||
             computedStyle.width === '60px' ||
             div.style.width === '60px')) {
          div.remove();
        }
      });
    };

    // Run immediately
    hideDevIndicators();

    // Run periodically to catch dynamically added indicators
    const interval = setInterval(hideDevIndicators, 100);

    // Also run on DOM mutations
    const observer = new MutationObserver(hideDevIndicators);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'id']
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null; // This component renders nothing
}