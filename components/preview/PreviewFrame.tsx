import React, { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';

// Device presets
export const DEVICE_PRESETS = {
  responsive: { name: 'Responsive', width: '100%', height: '100%' },
  'iphone-14': { name: 'iPhone 14', width: 390, height: 844 },
  'iphone-14-pro-max': { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  'iphone-se': { name: 'iPhone SE', width: 375, height: 667 },
  'pixel-7': { name: 'Pixel 7', width: 412, height: 915 },
  'galaxy-s23': { name: 'Galaxy S23', width: 360, height: 780 },
  'ipad-mini': { name: 'iPad Mini', width: 744, height: 1133 },
  'ipad-pro-11': { name: 'iPad Pro 11"', width: 834, height: 1194 },
  'ipad-pro-12': { name: 'iPad Pro 12.9"', width: 1024, height: 1366 },
  'macbook-air': { name: 'MacBook Air', width: 1280, height: 800 },
  'macbook-pro-14': { name: 'MacBook Pro 14"', width: 1512, height: 982 },
  'desktop-hd': { name: 'Desktop HD', width: 1920, height: 1080 },
  'desktop-4k': { name: 'Desktop 4K', width: 3840, height: 2160 },
} as const;

export type DevicePreset = keyof typeof DEVICE_PRESETS;

export interface PreviewFrameProps {
  src?: string;
  html?: string;
  device?: DevicePreset;
  customWidth?: number;
  customHeight?: number;
  zoom?: number;
  showDeviceFrame?: boolean;
  showToolbar?: boolean;
  onDeviceChange?: (device: DevicePreset) => void;
  onZoomChange?: (zoom: number) => void;
  onRefresh?: () => void;
  className?: string;
}

export const PreviewFrame: React.FC<PreviewFrameProps> = ({
  src,
  html,
  device = 'responsive',
  customWidth,
  customHeight,
  zoom = 1,
  showDeviceFrame = true,
  showToolbar = true,
  onDeviceChange,
  onZoomChange,
  onRefresh,
  className,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  const preset = DEVICE_PRESETS[device];
  const isResponsive = device === 'responsive';

  // Calculate dimensions
  const getFrameDimensions = useCallback(() => {
    if (isResponsive) {
      return { width: '100%', height: '100%' };
    }

    let width = customWidth || (typeof preset.width === 'number' ? preset.width : 0);
    let height = customHeight || (typeof preset.height === 'number' ? preset.height : 0);

    if (orientation === 'landscape' && width && height) {
      [width, height] = [height, width];
    }

    return {
      width: width ? `${width}px` : '100%',
      height: height ? `${height}px` : '100%',
    };
  }, [device, customWidth, customHeight, orientation, isResponsive, preset]);

  // Handle iframe load
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  // Handle iframe error
  const handleError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load preview');
  }, []);

  // Refresh iframe
  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      if (src) {
        iframeRef.current.src = src;
      } else if (html) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
        }
      }
    }
    onRefresh?.();
  }, [src, html, onRefresh]);

  // Write HTML content to iframe
  useEffect(() => {
    if (html && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
        setIsLoading(false);
      }
    }
  }, [html]);

  // Toggle orientation
  const toggleOrientation = useCallback(() => {
    setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  }, []);

  const dimensions = getFrameDimensions();

  return (
    <div className={clsx('flex flex-col h-full bg-[var(--dm-bg-primary)]', className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--dm-border-primary)] bg-[var(--dm-bg-secondary)]">
          {/* Device Selector */}
          <div className="flex items-center gap-2">
            <select
              value={device}
              onChange={(e) => onDeviceChange?.(e.target.value as DevicePreset)}
              className={clsx(
                'h-7 px-2 text-xs rounded-md',
                'bg-[var(--dm-bg-tertiary)] border border-[var(--dm-border-primary)]',
                'text-[var(--dm-text-primary)]',
                'focus:outline-none focus:border-[var(--dm-border-focus)]'
              )}
            >
              <optgroup label="Responsive">
                <option value="responsive">Responsive</option>
              </optgroup>
              <optgroup label="Mobile">
                <option value="iphone-14">iPhone 14</option>
                <option value="iphone-14-pro-max">iPhone 14 Pro Max</option>
                <option value="iphone-se">iPhone SE</option>
                <option value="pixel-7">Pixel 7</option>
                <option value="galaxy-s23">Galaxy S23</option>
              </optgroup>
              <optgroup label="Tablet">
                <option value="ipad-mini">iPad Mini</option>
                <option value="ipad-pro-11">iPad Pro 11"</option>
                <option value="ipad-pro-12">iPad Pro 12.9"</option>
              </optgroup>
              <optgroup label="Desktop">
                <option value="macbook-air">MacBook Air</option>
                <option value="macbook-pro-14">MacBook Pro 14"</option>
                <option value="desktop-hd">Desktop HD</option>
                <option value="desktop-4k">Desktop 4K</option>
              </optgroup>
            </select>

            {/* Orientation toggle (for non-responsive) */}
            {!isResponsive && (
              <button
                onClick={toggleOrientation}
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)]',
                  'hover:bg-[var(--dm-bg-hover)]'
                )}
                title={`Switch to ${orientation === 'portrait' ? 'landscape' : 'portrait'}`}
              >
                <svg
                  className={clsx('w-4 h-4', orientation === 'landscape' && 'rotate-90')}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                </svg>
              </button>
            )}

            {/* Dimensions display */}
            {!isResponsive && (
              <span className="text-[10px] text-[var(--dm-text-muted)] font-mono">
                {orientation === 'portrait'
                  ? `${preset.width}×${preset.height}`
                  : `${preset.height}×${preset.width}`}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={() => onZoomChange?.(Math.max(0.25, zoom - 0.25))}
                disabled={zoom <= 0.25}
                className={clsx(
                  'p-1 rounded transition-colors',
                  'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)]',
                  'hover:bg-[var(--dm-bg-hover)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35M8 11h6" />
                </svg>
              </button>
              <span className="text-[10px] text-[var(--dm-text-muted)] font-mono w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => onZoomChange?.(Math.min(2, zoom + 0.25))}
                disabled={zoom >= 2}
                className={clsx(
                  'p-1 rounded transition-colors',
                  'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)]',
                  'hover:bg-[var(--dm-bg-hover)]',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35M8 11h6M11 8v6" />
                </svg>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className={clsx(
                'p-1.5 rounded-md transition-colors',
                'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)]',
                'hover:bg-[var(--dm-bg-hover)]'
              )}
              title="Refresh"
            >
              <svg
                className={clsx('w-4 h-4', isLoading && 'animate-spin')}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-9-9" />
                <path d="M21 3v6h-6" />
              </svg>
            </button>

            {/* Open in new tab */}
            {src && (
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  'text-[var(--dm-text-secondary)] hover:text-[var(--dm-text-primary)]',
                  'hover:bg-[var(--dm-bg-hover)]'
                )}
                title="Open in new tab"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Preview Container */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-[var(--dm-bg-tertiary)]">
        <div
          className={clsx(
            'relative transition-all duration-200',
            showDeviceFrame && !isResponsive && 'rounded-[2rem] border-[8px] border-[#1a1a1a] shadow-2xl',
            isResponsive && 'w-full h-full'
          )}
          style={{
            width: isResponsive ? '100%' : dimensions.width,
            height: isResponsive ? '100%' : dimensions.height,
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Device notch (for phones) */}
          {showDeviceFrame && !isResponsive && device.includes('iphone') && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-[#1a1a1a] rounded-b-2xl z-10" />
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--dm-bg-primary)] z-20">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--dm-accent-primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--dm-text-muted)]">Loading preview...</span>
              </div>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--dm-bg-primary)] z-20">
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <svg className="w-12 h-12 text-[var(--dm-error)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
                <span className="text-sm text-[var(--dm-text-secondary)]">{error}</span>
                <button
                  onClick={handleRefresh}
                  className="px-3 py-1.5 text-sm bg-[var(--dm-accent-primary)] text-white rounded-md hover:bg-[var(--dm-accent-primary-hover)] transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            ref={iframeRef}
            title="preview"
            src={src}
            onLoad={handleLoad}
            onError={handleError}
            className={clsx(
              'w-full h-full bg-white',
              showDeviceFrame && !isResponsive && 'rounded-[1.5rem]'
            )}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </div>

      {/* URL bar (optional) */}
      {src && showToolbar && (
        <div className="flex items-center px-3 py-1.5 border-t border-[var(--dm-border-primary)] bg-[var(--dm-bg-secondary)]">
          <div className="flex-1 flex items-center gap-2 px-2 py-1 rounded bg-[var(--dm-bg-tertiary)] text-xs text-[var(--dm-text-muted)] font-mono truncate">
            <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <span className="truncate">{src}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewFrame;
