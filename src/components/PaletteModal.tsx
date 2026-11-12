import React, { useState, useRef, useEffect } from 'react';
import { useApp, DEFAULT_CUSTOM_PALETTE } from '../context/AppContext';
import { CustomPalette } from '../types';

interface PaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ZoneKey = 'primaryAccent' | 'topBarBg' | 'sidebarBg' | 'pageBg' | 'surfaceBg';

interface ColorPin {
  key: ZoneKey;
  num: number;
  labelAr: string;
  labelEn: string;
  xPct: number; // 0..100
  yPct: number; // 0..100
}

interface LensState {
  show: boolean;
  x: number; // relative to container
  y: number; // relative to container
  colorHex: string;
}

interface FocalPoint {
  xPct: number;
  yPct: number;
}

export const PaletteModal: React.FC<PaletteModalProps> = ({ isOpen, onClose }) => {
  const { language, customPalette, updateCustomPalette } = useApp();

  const isRtl = language === 'ar';

  const [localPalette, setLocalPalette] = useState<CustomPalette>(customPalette);
  const [activePinKey, setActivePinKey] = useState<ZoneKey>('primaryAccent');
  const [sampleImage, setSampleImage] = useState<string | null>(customPalette.brandLogoUrl || null);

  // Zoom, Focal Point & Magnifying Lens States
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1x to 3x
  const [zoomFocal, setZoomFocal] = useState<FocalPoint>({ xPct: 50, yPct: 50 });
  const [enableLoupe, setEnableLoupe] = useState<boolean>(true);
  const [lensState, setLensState] = useState<LensState>({ show: false, x: 0, y: 0, colorHex: '#ffffff' });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initial Pin Positions
  const [pins, setPins] = useState<ColorPin[]>([
    { key: 'primaryAccent', num: 1, labelAr: 'اللون الرئيسي للأزرار', labelEn: 'Primary Accent', xPct: 25, yPct: 35 },
    { key: 'topBarBg', num: 2, labelAr: 'خلفية الشريط العلوي', labelEn: 'Header Top Bar', xPct: 50, yPct: 20 },
    { key: 'sidebarBg', num: 3, labelAr: 'خلفية القائمة الجانبية', labelEn: 'Sidebar Navigation', xPct: 15, yPct: 65 },
    { key: 'pageBg', num: 4, labelAr: 'خلفية الصفحة العامة', labelEn: 'Page Canvas', xPct: 75, yPct: 75 },
    { key: 'surfaceBg', num: 5, labelAr: 'خلفية الكروت واللوحات', labelEn: 'Card Surfaces', xPct: 60, yPct: 45 },
  ]);

  useEffect(() => {
    if (isOpen) {
      setLocalPalette(customPalette);
      if (customPalette.brandLogoUrl) {
        setSampleImage(customPalette.brandLogoUrl);
      }
    }
  }, [isOpen, customPalette]);

  if (!isOpen) return null;

  // Preset Palettes
  const presetPalettes: { nameEn: string; nameAr: string; palette: CustomPalette }[] = [
    {
      nameEn: 'Executive Indigo',
      nameAr: 'نيلي تنفيذي',
      palette: {
        primaryAccent: '#3525cd',
        topBarBg: '#ffffff',
        topBarText: '#0f172a',
        sidebarBg: '#ffffff',
        sidebarText: '#334155',
        pageBg: '#faf8ff',
        surfaceBg: '#ffffff',
      },
    },
    {
      nameEn: 'Midnight Corporate',
      nameAr: 'كحلي ليلي',
      palette: {
        primaryAccent: '#3b82f6',
        topBarBg: '#0f172a',
        topBarText: '#ffffff',
        sidebarBg: '#1e293b',
        sidebarText: '#f8fafc',
        pageBg: '#090d16',
        surfaceBg: '#1e293b',
      },
    },
    {
      nameEn: 'Mint Precision',
      nameAr: 'نعناعي زمردي',
      palette: {
        primaryAccent: '#059669',
        topBarBg: '#ffffff',
        topBarText: '#064e3b',
        sidebarBg: '#ecfdf5',
        sidebarText: '#065f46',
        pageBg: '#f0fdf4',
        surfaceBg: '#ffffff',
      },
    },
    {
      nameEn: 'Warm Terracotta',
      nameAr: 'قرمزي دافئ',
      palette: {
        primaryAccent: '#b91c1c',
        topBarBg: '#ffffff',
        topBarText: '#7f1d1d',
        sidebarBg: '#fef2f2',
        sidebarText: '#991b1b',
        pageBg: '#fff5f5',
        surfaceBg: '#ffffff',
      },
    },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setSampleImage(dataUrl);
        setLocalPalette((prev) => ({ ...prev, brandLogoUrl: dataUrl }));
        setZoomLevel(1);
        setZoomFocal({ xPct: 50, yPct: 50 });
      }
    };
    reader.readAsDataURL(file);
  };

  // Extract pixel color helper
  const getPixelHex = (xPct: number, yPct: number): string => {
    const img = imgRef.current;
    if (!img) return '#ffffff';

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 300;
    canvas.height = img.naturalHeight || 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const pxX = Math.max(0, Math.min(canvas.width - 1, Math.floor((xPct / 100) * canvas.width)));
    const pxY = Math.max(0, Math.min(canvas.height - 1, Math.floor((yPct / 100) * canvas.height)));

    try {
      const pixel = ctx.getImageData(pxX, pxY, 1, 1).data;
      return `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
    } catch {
      return '#ffffff';
    }
  };

  // Handle Mouse Move for Magnifying Lens Loupe & Dynamic Zoom Focal Point
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imgRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));

    // Smoothly update zoom focal origin to hover cursor location when zoomed
    if (zoomLevel > 1) {
      setZoomFocal({ xPct, yPct });
    }

    const colorHex = getPixelHex(xPct, yPct);

    setLensState({
      show: true,
      x,
      y,
      colorHex,
    });

    // Render Loupe Magnified Canvas
    if (enableLoupe && loupeCanvasRef.current && imgRef.current) {
      const lCanvas = loupeCanvasRef.current;
      const lCtx = lCanvas.getContext('2d');
      if (lCtx) {
        lCtx.imageSmoothingEnabled = false; // Pixelated crisp magnification
        const img = imgRef.current;
        const sourceX = (xPct / 100) * img.naturalWidth;
        const sourceY = (yPct / 100) * img.naturalHeight;

        const sampleSize = 24 / zoomLevel; // Size of sampled region
        lCtx.clearRect(0, 0, lCanvas.width, lCanvas.height);
        lCtx.drawImage(
          img,
          sourceX - sampleSize / 2,
          sourceY - sampleSize / 2,
          sampleSize,
          sampleSize,
          0,
          0,
          lCanvas.width,
          lCanvas.height
        );
      }
    }
  };

  const handleMouseLeave = () => {
    setLensState((prev) => ({ ...prev, show: false }));
  };

  // Sample Color from Canvas Image Click & Lock Focal Point
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = Math.max(0, Math.min(100, Math.round((x / rect.width) * 100)));
    const yPct = Math.max(0, Math.min(100, Math.round((y / rect.height) * 100)));

    // Lock focal origin to clicked point
    setZoomFocal({ xPct, yPct });

    const sampledHex = getPixelHex(xPct, yPct);

    // Update active pin position
    setPins((prevPins) =>
      prevPins.map((pin) => (pin.key === activePinKey ? { ...pin, xPct, yPct } : pin))
    );

    // Assign color to active zone
    setLocalPalette((prev) => ({ ...prev, [activePinKey]: sampledHex }));
  };

  const handleSave = () => {
    updateCustomPalette(localPalette);
    onClose();
  };

  const handleReset = () => {
    setLocalPalette(DEFAULT_CUSTOM_PALETTE);
    setSampleImage(null);
    setZoomLevel(1);
    setZoomFocal({ xPct: 50, yPct: 50 });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 flex flex-col gap-6 max-h-[92vh] overflow-y-auto border border-slate-200/90">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">palette</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isRtl ? 'التكبير التفاعلي الموجه وعدسة تحديد الألوان' : 'Targeted Zoom & Precision Color Sampling'}
              </h3>
              <p className="text-xs text-slate-500">
                {isRtl
                  ? 'وجه التكبير مباشرة نحو المنطقة المراد فحصها، ثم التقاط ألوان البكسل بالعدسة لعناصر الواجهة.'
                  : 'Focus zoom directly on any region of the image to pick exact pixel colors for all 5 UI zones.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 1. INTERACTIVE IMAGE SAMPLING WITH TARGETED FOCAL ZOOM & LENS */}
        <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-lg">center_focus_strong</span>
              <span className="text-xs font-bold text-slate-900">
                {isRtl ? 'التكبير الموجه والتحديد النقاطي على الصورة' : 'Targeted Zoom & 5-Zone Color Picker'}
              </span>
            </div>

            <label className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-indigo-400 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs">
              <span className="material-symbols-outlined text-sm text-indigo-600">upload</span>
              <span>{isRtl ? 'رفع صورة براند جديدة' : 'Upload Brand Image'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {/* Image Container with Focal Zoom Controls & Magnifying Loupe */}
          {sampleImage ? (
            <div className="flex flex-col gap-3">
              {/* Active Selector Pins Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
                  {isRtl ? 'العنصر المراد تحديده:' : 'Target UI zone:'}
                </span>
                {pins.map((pin) => (
                  <button
                    key={pin.key}
                    type="button"
                    onClick={() => {
                      setActivePinKey(pin.key);
                      // Auto jump focal point to that pin's location
                      setZoomFocal({ xPct: pin.xPct, yPct: pin.yPct });
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all whitespace-nowrap cursor-pointer ${
                      activePinKey === pin.key
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs ring-2 ring-indigo-300/50'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/10 flex items-center justify-center text-[9px] text-white font-extrabold"
                      style={{ backgroundColor: localPalette[pin.key] || '#94a3b8' }}
                    >
                      {pin.num}
                    </span>
                    <span>{isRtl ? pin.labelAr : pin.labelEn}</span>
                  </button>
                ))}
              </div>

              {/* Zoom Scale & Focal Quadrant Selector Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Focal Region Presets */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 me-1">
                    {isRtl ? 'التركيز على:' : 'Focus:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomFocal({ xPct: 50, yPct: 50 })}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                      zoomFocal.xPct === 50 && zoomFocal.yPct === 50
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isRtl ? 'الوسط' : 'Center'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomFocal({ xPct: 20, yPct: 20 })}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                      zoomFocal.xPct === 20 && zoomFocal.yPct === 20
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isRtl ? 'أعلى اليسار' : 'Top Left'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomFocal({ xPct: 80, yPct: 20 })}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                      zoomFocal.xPct === 80 && zoomFocal.yPct === 20
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isRtl ? 'أعلى اليمين' : 'Top Right'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomFocal({ xPct: 20, yPct: 80 })}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                      zoomFocal.xPct === 20 && zoomFocal.yPct === 80
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isRtl ? 'أسفل اليسار' : 'Bottom Left'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomFocal({ xPct: 80, yPct: 80 })}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                      zoomFocal.xPct === 80 && zoomFocal.yPct === 80
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isRtl ? 'أسفل اليمين' : 'Bottom Right'}
                  </button>
                </div>

                {/* Zoom Level Adjustment Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.5).toFixed(2)))}
                    title={isRtl ? 'تصغير نسبة التكبير' : 'Zoom Out'}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>

                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                    <span>{Math.round(zoomLevel * 100)}%</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setZoomLevel((z) => Math.min(4, +(z + 0.5).toFixed(2)))}
                    title={isRtl ? 'تكبير نسبة التكبير' : 'Zoom In'}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>

                  {/* Reset Zoom */}
                  <button
                    type="button"
                    onClick={() => {
                      setZoomLevel(1);
                      setZoomFocal({ xPct: 50, yPct: 50 });
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:underline px-1"
                  >
                    {isRtl ? 'إعادة الضبط' : 'Reset'}
                  </button>

                  {/* Loupe Toggle */}
                  <button
                    type="button"
                    onClick={() => setEnableLoupe(!enableLoupe)}
                    className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                      enableLoupe ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">filter_center_focus</span>
                    <span>{isRtl ? 'عدسة المكبر' : 'Loupe'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Image Display Container with Dynamic Focal Point */}
              <div className="overflow-hidden rounded-2xl border-2 border-dashed border-indigo-200 bg-slate-900/5 relative shadow-inner h-64 sm:h-72 flex items-center justify-center">
                <div
                  ref={containerRef}
                  onClick={handleImageClick}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: `${zoomFocal.xPct}% ${zoomFocal.yPct}%`,
                  }}
                  className="relative w-full h-full flex items-center justify-center cursor-crosshair select-none transition-transform duration-200 ease-out"
                >
                  <img
                    ref={imgRef}
                    src={sampleImage}
                    alt="Brand Reference"
                    crossOrigin="anonymous"
                    className="max-w-full max-h-full object-contain pointer-events-none select-none"
                  />

                  {/* 5 Pins Layer */}
                  {pins.map((pin) => (
                    <div
                      key={pin.key}
                      style={{ left: `${pin.xPct}%`, top: `${pin.yPct}%` }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePinKey(pin.key);
                        setZoomFocal({ xPct: pin.xPct, yPct: pin.yPct });
                      }}
                      title={`${pin.num}. ${isRtl ? pin.labelAr : pin.labelEn}`}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 shadow-lg flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-125 z-20 ${
                        activePinKey === pin.key ? 'border-white ring-4 ring-indigo-500 scale-110 z-30' : 'border-white/80'
                      }`}
                    >
                      <span
                        className="w-full h-full rounded-full flex items-center justify-center text-xs font-black text-white shadow-xs"
                        style={{ backgroundColor: localPalette[pin.key] || '#334155' }}
                      >
                        {pin.num}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Floating Circular Magnifying Glass / Loupe */}
                {enableLoupe && lensState.show && (
                  <div
                    style={{
                      left: `${lensState.x}px`,
                      top: `${lensState.y}px`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden pointer-events-none z-50 bg-white ring-2 ring-indigo-500 flex flex-col items-center justify-center"
                  >
                    <canvas ref={loupeCanvasRef} width={128} height={128} className="w-full h-full object-cover" />

                    {/* Crosshair Center Marker */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-px h-full bg-red-500/80" />
                      <div className="h-px w-full bg-red-500/80 absolute" />
                      <div className="w-3.5 h-3.5 rounded-full border border-white shadow-xs bg-red-500/30 absolute" />
                    </div>

                    {/* Live Pixel Swatch Label */}
                    <div className="absolute bottom-1 bg-slate-900/90 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-white/20">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lensState.colorHex }} />
                      <span>{lensState.colorHex.toUpperCase()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center gap-2 text-center">
              <span className="material-symbols-outlined text-3xl text-slate-400">add_photo_alternate</span>
              <p className="text-xs font-bold text-slate-700">
                {isRtl
                  ? 'قم برفع صورة أو شعار للبدء بالتحديد النقاطي للألوان باستخدام العدسة والتكبير الموجه'
                  : 'Upload an image or logo to start 5-point color extraction with targeted focal zoom'}
              </p>
              <label className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs">
                {isRtl ? 'اختيار صورة البراند' : 'Select Brand Image'}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>

        {/* 2. PRESET PALETTES */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-700">
            {isRtl ? 'نماذج ألوان جاهزة متناسقة (Preset Palettes)' : 'Preset Brand Palettes'}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {presetPalettes.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLocalPalette((prev) => ({ ...prev, ...p.palette }))}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white flex flex-col gap-2 text-start transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
              >
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.palette.primaryAccent }} />
                  <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.palette.topBarBg }} />
                  <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.palette.sidebarBg }} />
                  <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.palette.pageBg }} />
                  <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: p.palette.surfaceBg }} />
                </div>
                <span className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600">
                  {isRtl ? p.nameAr : p.nameEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. MULTI-ZONE HEX CODE & COLOR PICKERS */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold text-slate-900 border-b border-slate-100 pb-1">
            {isRtl ? 'التحكم الدقيق بعناصر الصفحات الخمسة (Hex & Picker)' : 'Exact Multi-Zone Color Precision Inputs'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Primary Accent */}
            <div className={`flex flex-col gap-1 p-2.5 rounded-2xl border transition-all ${
              activePinKey === 'primaryAccent' ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-white'
            }`}>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">1</span>
                  <span>{isRtl ? 'اللون الرئيسي للأزرار واللمسات' : 'Primary Accent Color'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Buttons</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={localPalette.primaryAccent}
                  onChange={(e) => setLocalPalette({ ...localPalette, primaryAccent: e.target.value })}
                  className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={localPalette.primaryAccent}
                  onChange={(e) => setLocalPalette({ ...localPalette, primaryAccent: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 2. Header Top Bar */}
            <div className={`flex flex-col gap-1 p-2.5 rounded-2xl border transition-all ${
              activePinKey === 'topBarBg' ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-white'
            }`}>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">2</span>
                  <span>{isRtl ? 'خلفية الشريط العلوي (Header)' : 'Header Top Bar Background'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Top Bar</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={localPalette.topBarBg}
                  onChange={(e) => setLocalPalette({ ...localPalette, topBarBg: e.target.value })}
                  className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={localPalette.topBarBg}
                  onChange={(e) => setLocalPalette({ ...localPalette, topBarBg: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 3. Sidebar Navigation */}
            <div className={`flex flex-col gap-1 p-2.5 rounded-2xl border transition-all ${
              activePinKey === 'sidebarBg' ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-white'
            }`}>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">3</span>
                  <span>{isRtl ? 'خلفية القائمة الجانبية (Sidebar)' : 'Sidebar Navigation Background'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Sidebar</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={localPalette.sidebarBg}
                  onChange={(e) => setLocalPalette({ ...localPalette, sidebarBg: e.target.value })}
                  className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={localPalette.sidebarBg}
                  onChange={(e) => setLocalPalette({ ...localPalette, sidebarBg: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 4. Page Background */}
            <div className={`flex flex-col gap-1 p-2.5 rounded-2xl border transition-all ${
              activePinKey === 'pageBg' ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-white'
            }`}>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">4</span>
                  <span>{isRtl ? 'خلفية الصفحة العامة (Page Canvas)' : 'Page Canvas Background'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Page Canvas</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={localPalette.pageBg}
                  onChange={(e) => setLocalPalette({ ...localPalette, pageBg: e.target.value })}
                  className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={localPalette.pageBg}
                  onChange={(e) => setLocalPalette({ ...localPalette, pageBg: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 5. Card Surfaces */}
            <div className={`flex flex-col gap-1 p-2.5 rounded-2xl border transition-all ${
              activePinKey === 'surfaceBg' ? 'border-indigo-400 bg-indigo-50/40' : 'border-slate-200 bg-white'
            }`}>
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] font-black flex items-center justify-center">5</span>
                  <span>{isRtl ? 'خلفية الكروت واللوحات (Surface)' : 'Card Surfaces Background'}</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Surfaces</span>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={localPalette.surfaceBg}
                  onChange={(e) => setLocalPalette({ ...localPalette, surfaceBg: e.target.value })}
                  className="w-9 h-9 rounded-xl border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                />
                <input
                  type="text"
                  value={localPalette.surfaceBg}
                  onChange={(e) => setLocalPalette({ ...localPalette, surfaceBg: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. LIVE UI PREVIEW MOCK */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {isRtl ? 'معاينة شاشات النظام الحية بالتعديل الفوري' : 'Live UI Palette Mock'}
          </span>
          <div
            className="p-3.5 rounded-2xl border border-slate-300 flex flex-col gap-2 transition-colors shadow-inner"
            style={{ backgroundColor: localPalette.pageBg }}
          >
            {/* Header Mock */}
            <div
              className="p-2.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs border border-black/5"
              style={{ backgroundColor: localPalette.topBarBg, color: localPalette.topBarText }}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-indigo-600 text-white text-[10px] flex items-center justify-center font-bold">B</div>
                <span>Profness Top Bar Header</span>
              </div>
              <button
                className="px-2.5 py-1 rounded-lg text-[11px] text-white font-bold shadow-xs"
                style={{ backgroundColor: localPalette.primaryAccent }}
              >
                CTA Button
              </button>
            </div>

            {/* Body Mock */}
            <div className="flex gap-2">
              <div
                className="w-28 p-2.5 rounded-xl text-[11px] font-bold flex flex-col gap-1.5 border border-black/5"
                style={{ backgroundColor: localPalette.sidebarBg, color: localPalette.sidebarText }}
              >
                <span>Sidebar Nav</span>
                <div className="w-full h-2 rounded bg-current opacity-30" />
                <div className="w-3/4 h-2 rounded bg-current opacity-30" />
                <div className="w-5/6 h-2 rounded bg-current opacity-30" />
              </div>

              <div
                className="flex-1 p-3 rounded-xl border border-slate-200/80 text-xs font-bold text-slate-800 flex flex-col gap-2 shadow-xs"
                style={{ backgroundColor: localPalette.surfaceBg }}
              >
                <span>Dashboard Card Area</span>
                <div className="w-1/2 h-2 rounded bg-slate-300/60" />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            {isRtl ? 'استعادة الافتراضي' : 'Reset Default'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: localPalette.primaryAccent }}
            >
              {isRtl ? 'تطبيق لوحة الألوان الحية' : 'Apply Live Palette'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
