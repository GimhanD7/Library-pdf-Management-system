import { useEffect } from 'react';

/**
 * Global component to disable developer tools and right-click across the entire application
 */
export default function DisableDevTools() {
  useEffect(() => {
    // ========== Disable Right-Click Globally ==========
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    // ========== Disable Developer Tools Keyboard Shortcuts ==========
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I - DevTools
      // Ctrl+Shift+J - Console
      // Ctrl+Shift+C - Inspect Element
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const key = e.key.toLowerCase();
        if (['i', 'j', 'c'].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      // Ctrl+U - View Source
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S - Save Page
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+P - Print
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // ========== Detect DevTools Opening ==========
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // DevTools detected - you can add custom handling here
        console.clear();
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h1>Developer Tools are disabled</h1></div>';
      }
    };

    // ========== Disable Text Selection Globally ==========
    const disableSelection = () => {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      (document.body.style as any).msUserSelect = 'none';
    };

    // ========== Add Event Listeners ==========
    document.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
    document.addEventListener('keydown', handleKeyDown, { capture: true, passive: false });
    
    // Check for DevTools every 1 second
    const devToolsInterval = setInterval(detectDevTools, 1000);
    
    // Disable selection
    disableSelection();

    // ========== Cleanup ==========
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      clearInterval(devToolsInterval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
