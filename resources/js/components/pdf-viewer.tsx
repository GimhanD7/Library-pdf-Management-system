import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Loader2, AlertTriangle, Maximize2, Minimize2, Ban } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  onClose: () => void;
}

export default function PDFViewer({ fileUrl, fileName, onClose }: PDFViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDisplayRef = useRef<HTMLDivElement>(null);

  // Alerts / deterrence
  const [isBlurred, setIsBlurred] = useState(false);
  const [showPrintScreenAlert, setShowPrintScreenAlert] = useState(false);
  const [showSaveBlockedAlert, setShowSaveBlockedAlert] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Update PDF URL when fileUrl changes
  useEffect(() => {
    if (fileUrl) {
      const url = `${fileUrl}${fileUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`;
      setPdfUrl(url);
    }
  }, [fileUrl]);

  // ========== Keyboard guards ==========
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Allow arrow keys, Page Up/Down, Home/End, Space for scrolling
      const scrollKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '];
      if (scrollKeys.includes(e.key)) {
        // Allow these keys to pass through for scrolling
        return;
      }

      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        const k = e.key.toLowerCase();
        if (k === 's' || (e.shiftKey && k === 's')) {
          e.preventDefault();
          e.stopPropagation();
          setShowSaveBlockedAlert(true);
          setTimeout(() => setShowSaveBlockedAlert(false), 1800);
          return;
        }
        if (['c', 'p', 'a', 'u', 'f'].includes(k)) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Enhanced Print Screen detection
      if (
        e.key === 'PrintScreen' || 
        e.code === 'PrintScreen' ||
        (e as any).keyCode === 44 ||
        (e as any).which === 44
      ) {
        e.preventDefault();
        e.stopPropagation();
        setShowPrintScreenAlert(true);
        setIsBlurred(true);
        // Clear clipboard immediately
        navigator.clipboard?.writeText('').catch(() => {});
        setTimeout(() => {
          setShowPrintScreenAlert(false);
          setIsBlurred(false);
        }, 1800);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      // Enhanced Print Screen detection on key up
      if (
        e.key === 'PrintScreen' || 
        e.code === 'PrintScreen' ||
        (e as any).keyCode === 44 ||
        (e as any).which === 44
      ) {
        e.preventDefault();
        e.stopPropagation();
        // Clear clipboard again on key up
        navigator.clipboard?.writeText('').catch(() => {});
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [onClose]);

  // ========== Visibility/focus blur ==========
  useEffect(() => {
    let blurTimeout: ReturnType<typeof setTimeout> | null = null;

    const triggerBlur = (ms = 1200) => {
      setIsBlurred(true);
      if (blurTimeout) clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => setIsBlurred(false), ms);
    };

    const onVisibility = () => {
      if (document.hidden) triggerBlur(1800);
    };
    const onBlur = () => triggerBlur(1800);
    const onFocus = () => triggerBlur(700);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur, true);
    window.addEventListener('focus', onFocus, true);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur, true);
      window.removeEventListener('focus', onFocus, true);
      if (blurTimeout) clearTimeout(blurTimeout);
    };
  }, []);

  // ========== Right-click / selection block ==========
  const blockContextMenu = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // ========== Fullscreen ==========
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // ========== Custom context menu on right-click ==========
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Show custom context menu at cursor position
      setContextMenu({
        x: e.clientX,
        y: e.clientY
      });
      
      return false;
    };

    const preventRightClick = (e: MouseEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const container = containerRef.current;
    const pdfDisplay = pdfDisplayRef.current;
    
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
      container.addEventListener('mousedown', preventRightClick, { capture: true, passive: false });
      container.addEventListener('mouseup', preventRightClick, { capture: true, passive: false });
    }

    if (pdfDisplay) {
      pdfDisplay.addEventListener('contextmenu', handleContextMenu, { capture: true, passive: false });
      pdfDisplay.addEventListener('mousedown', preventRightClick, { capture: true, passive: false });
      pdfDisplay.addEventListener('mouseup', preventRightClick, { capture: true, passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu, { capture: true });
        container.removeEventListener('mousedown', preventRightClick, { capture: true });
        container.removeEventListener('mouseup', preventRightClick, { capture: true });
      }
      if (pdfDisplay) {
        pdfDisplay.removeEventListener('contextmenu', handleContextMenu, { capture: true });
        pdfDisplay.removeEventListener('mousedown', preventRightClick, { capture: true });
        pdfDisplay.removeEventListener('mouseup', preventRightClick, { capture: true });
      }
    };
  }, []);

  // Close context menu when clicking anywhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      document.addEventListener('contextmenu', handleClick);
      return () => {
        document.removeEventListener('click', handleClick);
        document.removeEventListener('contextmenu', handleClick);
      };
    }
  }, [contextMenu]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load PDF. The file may be corrupted, missing, or you may not have permission to view it.');
  };

  const getFileName = (url: string) => {
    if (fileName) return fileName;
    if (!url) return 'Document';
    const base = url.split('/').pop() || 'Document';
    return base.split('?')[0];
  };

  if (!fileUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        ref={containerRef}
        className={`relative ${isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[90vh]'} 
                    bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200`}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center min-w-0">
            <h2 className="text-lg font-medium text-gray-900 truncate select-none" title={getFileName(fileUrl)}>
              {getFileName(fileUrl)}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-9 w-9 p-0 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
              aria-label="Close PDF viewer"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 relative overflow-hidden">
          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 select-none">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
              <p className="mt-3 text-gray-600">Loading document...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none">
              <div className="bg-red-50 p-4 rounded-full mb-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load document</h3>
              <p className="text-gray-600 mb-6 max-w-md">{error}</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => location.reload()}
                  className="bg-white hover:bg-gray-50 border-gray-300"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* PDF */}
          {!error && (
            <div
              ref={pdfDisplayRef}
              className="w-full h-full relative"
              style={{
                WebkitUserSelect: 'none',
                userSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
              }}
            >
              <iframe
                src={`${pdfUrl || fileUrl}#toolbar=0&navpanes=0&scrollbar=1&page=1&view=FitH`}
                className={`w-full h-full border-0 transition-all duration-100 ${
                  isLoading ? 'opacity-0' : 'opacity-100'
                }`}
                title="PDF Viewer"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                style={{
                  overflow: 'auto',
                  width: '100%',
                  height: '100%',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  filter: isBlurred ? 'blur(50px) brightness(0.3)' : 'none',
                  transition: 'filter 0.1s ease-out',
                  pointerEvents: 'auto',
                }}
              />
              
              {/* Overlay to capture right-click, allow scrolling */}
              <div 
                className="absolute inset-0"
                style={{ 
                  zIndex: 5,
                  background: 'transparent',
                  pointerEvents: 'none', // Allow scrolling by default
                }}
              />
              
              {/* Separate layer for context menu capture - allows scrolling */}
              <div 
                className="absolute inset-0"
                style={{ 
                  zIndex: 6,
                  background: 'transparent',
                  pointerEvents: 'auto', // Enable to capture right-click
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // ALWAYS show our custom context menu
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY
                  });
                  
                  return false;
                }}
                onMouseDown={(e) => {
                  // Only block right-click
                  if (e.button === 2) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  // For left-click and scroll, temporarily disable overlay
                  const target = e.currentTarget as HTMLDivElement;
                  target.style.pointerEvents = 'none';
                  setTimeout(() => {
                    target.style.pointerEvents = 'auto';
                  }, 10);
                }}
                onWheel={(e) => {
                  // Allow scroll - temporarily disable overlay
                  const target = e.currentTarget as HTMLDivElement;
                  target.style.pointerEvents = 'none';
                  setTimeout(() => {
                    target.style.pointerEvents = 'auto';
                  }, 1000);
                }}
              />

              {/* Permanent watermark overlay */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] opacity-20 select-none">
                  <p className="text-9xl font-bold text-red-600 whitespace-nowrap">
                    CONFIDENTIAL
                  </p>
                </div>
                <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] opacity-15 select-none">
                  <p className="text-7xl font-bold text-red-600 whitespace-nowrap">
                    DO NOT COPY
                  </p>
                </div>
                <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 rotate-[-45deg] opacity-15 select-none">
                  <p className="text-7xl font-bold text-red-600 whitespace-nowrap">
                    DO NOT COPY
                  </p>
                </div>
              </div>

              {/* Screenshot alert */}
              {showPrintScreenAlert && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none animate-pulse"
                  style={{ zIndex: 10 }}
                >
                  <div className="bg-red-600 text-white px-8 py-5 rounded-xl shadow-2xl border-4 border-white text-center">
                    <p className="text-2xl font-bold mb-1">🚫 SCREENSHOT BLOCKED</p>
                    <p className="text-base">PrintScreen is disabled for this document</p>
                    <p className="text-xs mt-2 opacity-90">This action has been logged</p>
                  </div>
                </div>
              )}

              {/* Save blocked alert */}
              {showSaveBlockedAlert && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/80 pointer-events-none animate-pulse"
                  style={{ zIndex: 10 }}
                >
                  <div className="bg-orange-600 text-white px-8 py-5 rounded-xl shadow-2xl border-4 border-white text-center">
                    <p className="text-2xl font-bold mb-1">💾 SAVE BLOCKED</p>
                    <p className="text-base">Saving is disabled for this document</p>
                    <p className="text-xs mt-2 opacity-90">This action has been logged</p>
                  </div>
                </div>
              )}

              {/* Passive blur warning */}
              {isBlurred && !showPrintScreenAlert && !showSaveBlockedAlert && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none"
                  style={{ zIndex: 9 }}
                >
                  <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl text-center">
                    <p className="text-lg font-bold">⚠️ SCREENSHOT DETECTED</p>
                    <p className="text-xs mt-1">This action has been logged</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-2xl border-2 border-gray-300 py-1 min-w-[220px] z-[99999]"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">PDF Options</p>
          </div>
          
          <button
            className="w-full px-4 py-2.5 text-left text-sm text-gray-400 cursor-not-allowed flex items-center gap-3 bg-gray-50"
            disabled
          >
            <Ban className="h-4 w-4 text-red-500" />
            <div className="flex-1">
              <span className="font-medium line-through">Save As</span>
              <p className="text-xs text-red-600 mt-0.5">Disabled</p>
            </div>
          </button>
          
          <button
            className="w-full px-4 py-2.5 text-left text-sm text-gray-400 cursor-not-allowed flex items-center gap-3 bg-gray-50"
            disabled
          >
            <Ban className="h-4 w-4 text-red-500" />
            <div className="flex-1">
              <span className="font-medium line-through">Print</span>
              <p className="text-xs text-red-600 mt-0.5">Disabled</p>
            </div>
          </button>

          <div className="px-4 py-2 border-t border-gray-200 bg-yellow-50">
            <p className="text-xs text-yellow-800 flex items-center gap-2">
              <Ban className="h-3 w-3" />
              <span>Protected document</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
