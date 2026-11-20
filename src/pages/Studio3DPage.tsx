import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  RotateCw,
  Sun,
  X,
} from 'lucide-react';
import { useOS } from '../context/OSContext';
import { BalanceStudioCanvas } from '../components/three/BalanceStudioCanvas';
import {
  CAMERA_PRESETS,
  buildStudioTelemetry,
  type CameraPresetId,
  type LightingPresetId,
  type StudioNodeId,
} from '../utils/studio3d';

export function Studio3DPage() {
  const { data, lang, theme } = useOS();
  const navigate = useNavigate();

  const [selectedNodeId, setSelectedNodeId] = useState<StudioNodeId | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [cameraPresetTick, setCameraPresetTick] = useState(0);
  const [lightingPreset, setLightingPreset] = useState<LightingPresetId>('showcase');
  const [explodeMode, setExplodeMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  const telemetry = useMemo(() => buildStudioTelemetry(data, lang), [data, lang]);
  const selectedTelemetry = selectedNodeId ? telemetry[selectedNodeId] : null;
  const NavArrow = lang === 'ar' ? ArrowUpLeft : ArrowUpRight;

  const selectPreset = (preset: CameraPresetId) => {
    setSelectedNodeId(null);
    setCameraPreset(preset);
    setCameraPresetTick((t) => t + 1);
  };

  return (
    <div className="relative w-full h-[calc(100vh-8.25rem)] min-h-[500px] rounded-xl overflow-hidden border border-[#E4E7EC] dark:border-[#293548] bg-[#EEF3F9] dark:bg-[#0B1220]">
      {webglError ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center space-y-3">
          <h1 className="text-lg font-bold text-[#101828] dark:text-[#F9FAFB]">
            {lang === 'ar' ? 'العرض ثلاثي الأبعاد غير متاح في هذا المتصفح' : '3D WebGL Viewport Unavailable'}
          </h1>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] max-w-md">{webglError}</p>
        </div>
      ) : (
        <BalanceStudioCanvas
          telemetry={telemetry}
          lang={lang}
          theme={theme}
          selectedNodeId={selectedNodeId}
          cameraPreset={cameraPreset}
          cameraPresetTick={cameraPresetTick}
          lightingPreset={lightingPreset}
          explodeMode={explodeMode}
          autoRotate={autoRotate}
          onSelectNode={setSelectedNodeId}
          onWebGLError={setWebglError}
        />
      )}

      {/* Compact Top-Start Title Chip (solid surface, zero backdrop-blur over WebGL) */}
      <div className="absolute top-3 start-3 z-10 pointer-events-auto bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl px-3.5 py-2 shadow-sm max-w-[85vw]">
        <h1 className="text-sm font-bold text-[#101828] dark:text-[#F9FAFB] leading-tight">
          {lang === 'ar' ? 'الاستوديو ثلاثي الأبعاد والتوأم التشغيلي' : '3D Production Studio & Agency Twin'}
        </h1>
        <p className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
          {lang === 'ar'
            ? 'اسحب للتدوير · انقر على أي منصة أو فرع لفحص المؤشرات الحية'
            : 'Drag to orbit · Click any camera rig, branch hub, or creative bay to inspect live metrics'}
        </p>
      </div>

      {/* Selected Hub Inspector (anchored compactly at top-end, never blocking center stage) */}
      {selectedTelemetry && (
        <aside
          aria-label="Selected Studio Hub"
          className="absolute top-3 end-3 z-20 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl p-3.5 shadow-lg space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-[#101828] dark:text-[#F9FAFB]">
                {lang === 'ar' ? selectedTelemetry.titleAr : selectedTelemetry.titleEn}
              </div>
              <div className="text-[11px] text-[#667085] dark:text-[#9CA3AF] mt-0.5">
                {lang === 'ar' ? selectedTelemetry.subtitleAr : selectedTelemetry.subtitleEn}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              aria-label={lang === 'ar' ? 'إغلاق التفاصيل' : 'Close inspector'}
              className="p-1 rounded-lg text-[#667085] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {selectedTelemetry.metrics.map((m) => (
              <div
                key={m.labelEn}
                className="p-2 rounded-lg bg-[#F7F9FC] dark:bg-[#0B1220] border border-[#E4E7EC] dark:border-[#293548] text-center"
              >
                <div className="text-sm font-bold tabular-nums text-[#2563EB]">{m.value}</div>
                <div className="text-[10px] text-[#667085] dark:text-[#9CA3AF] truncate mt-0.5">
                  {lang === 'ar' ? m.labelAr : m.labelEn}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate(selectedTelemetry.route)}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors"
          >
            <span>{lang === 'ar' ? 'فتح الوحدة في BALANCE OS' : 'Open Module Workspace'}</span>
            <NavArrow className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Single Collapsible Bottom Control Dock (solid surface, <= 12% viewport height) */}
      <div className="absolute bottom-3 inset-x-0 z-10 flex justify-center px-3 pointer-events-none">
        {dockCollapsed ? (
          <button
            type="button"
            onClick={() => setDockCollapsed(false)}
            className="pointer-events-auto inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white dark:bg-[#111827] text-[#101828] dark:text-[#F9FAFB] border border-[#E4E7EC] dark:border-[#293548] rounded-xl shadow-md hover:border-[#2563EB]"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'أدوات المشهد ثلاثي الأبعاد' : 'Studio Controls'}</span>
          </button>
        ) : (
          <div className="pointer-events-auto bg-white dark:bg-[#111827] border border-[#E4E7EC] dark:border-[#293548] rounded-xl px-3 py-2 shadow-lg flex flex-wrap items-center justify-center gap-2 max-w-full">
            {/* Camera Presets */}
            <div className="flex items-center gap-1 border-e border-[#E4E7EC] dark:border-[#293548] pe-2">
              <Eye className="w-3.5 h-3.5 text-[#667085] shrink-0 hidden sm:block" />
              {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((pid) => {
                const preset = CAMERA_PRESETS[pid];
                const active = cameraPreset === pid && !selectedNodeId;
                return (
                  <button
                    type="button"
                    key={pid}
                    onClick={() => selectPreset(pid)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                      active
                        ? 'bg-[#2563EB] text-white'
                        : 'text-[#101828] dark:text-[#F9FAFB] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]'
                    }`}
                  >
                    {lang === 'ar' ? preset.labelAr : preset.labelEn}
                  </button>
                );
              })}
            </div>

            {/* Lighting Presets */}
            <div className="flex items-center gap-1 border-e border-[#E4E7EC] dark:border-[#293548] pe-2">
              <Sun className="w-3.5 h-3.5 text-[#667085] shrink-0 hidden sm:block" />
              {(
                [
                  { id: 'showcase', ar: 'معرض', en: 'Showcase' },
                  { id: 'daylight', ar: 'نهاري', en: 'Daylight' },
                  { id: 'cinema', ar: 'سينمائي', en: 'Cinema' },
                ] as const
              ).map((lt) => (
                <button
                  type="button"
                  key={lt.id}
                  onClick={() => setLightingPreset(lt.id)}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                    lightingPreset === lt.id
                      ? 'bg-[#101828] dark:bg-[#2563EB] text-white'
                      : 'text-[#667085] dark:text-[#9CA3AF] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]'
                  }`}
                >
                  {lt[lang]}
                </button>
              ))}
            </div>

            {/* Explode + Auto Orbit + Collapse */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExplodeMode((v) => !v)}
                aria-pressed={explodeMode}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                  explodeMode
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-800 dark:text-amber-200'
                    : 'border-[#E4E7EC] dark:border-[#293548] text-[#101828] dark:text-[#F9FAFB] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>{lang === 'ar' ? 'تفكيك المعدات' : 'Explode Rig'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                aria-pressed={autoRotate}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                  autoRotate
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-[#2563EB] text-[#2563EB] dark:text-sky-300'
                    : 'border-[#E4E7EC] dark:border-[#293548] text-[#101828] dark:text-[#F9FAFB] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]'
                }`}
              >
                <RotateCw className="w-3 h-3" />
                <span>{lang === 'ar' ? 'دوران' : 'Orbit'}</span>
              </button>

              <button
                type="button"
                onClick={() => setDockCollapsed(true)}
                aria-label={lang === 'ar' ? 'طي شريط التحكم' : 'Collapse dock'}
                className="p-1.5 rounded-lg text-[#667085] hover:bg-[#EEF2F6] dark:hover:bg-[#182235]"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
