import type { BalanceOSDataset } from '../data/seedData';
import type { Language } from '../types/os';

export type StudioNodeId =
  | 'camera_rig'
  | 'lighting_gantry'
  | 'cairo_hq'
  | 'alex_branch'
  | 'editing_bay'
  | 'dev_cluster';

export type CameraPresetId = 'overview' | 'camera_rig' | 'branches' | 'creative_bay';
export type LightingPresetId = 'showcase' | 'daylight' | 'cinema';

export interface CameraPresetConfig {
  id: CameraPresetId;
  labelAr: string;
  labelEn: string;
  position: [number, number, number];
  target: [number, number, number];
}

export interface StudioNodeTelemetry {
  id: StudioNodeId;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  accentHex: string;
  route: string;
  metrics: Array<{ labelAr: string; labelEn: string; value: string }>;
  status: 'active' | 'warning' | 'idle';
}

export const CAMERA_PRESETS: Record<CameraPresetId, CameraPresetConfig> = {
  overview: {
    id: 'overview',
    labelAr: 'نظرة شاملة',
    labelEn: 'Overview',
    position: [7.6, 5.2, 8.6],
    target: [0, 1.0, 0],
  },
  camera_rig: {
    id: 'camera_rig',
    labelAr: 'كاميرا الإنتاج',
    labelEn: 'Cinema Rig',
    position: [2.8, 2.2, 3.6],
    target: [-0.8, 1.25, 0.2],
  },
  branches: {
    id: 'branches',
    labelAr: 'فروع الوكالة',
    labelEn: 'Branches',
    position: [-5.6, 3.6, 5.2],
    target: [-3.2, 1.1, -1.5],
  },
  creative_bay: {
    id: 'creative_bay',
    labelAr: 'العمليات الإبداعية',
    labelEn: 'Creative Bay',
    position: [5.8, 3.4, 4.8],
    target: [3.2, 1.1, -1.4],
  },
};

export function dampScalar(current: number, target: number, lambda: number, dt: number): number {
  const clampedDt = Math.min(Math.max(dt, 0), 0.1);
  return current + (target - current) * (1 - Math.exp(-lambda * clampedDt));
}

export function dampTuple3(
  current: [number, number, number],
  target: [number, number, number],
  lambda: number,
  dt: number
): [number, number, number] {
  return [
    dampScalar(current[0], target[0], lambda, dt),
    dampScalar(current[1], target[1], lambda, dt),
    dampScalar(current[2], target[2], lambda, dt),
  ];
}

export function isSoftwareGlRenderer(rendererInfo: string | null | undefined): boolean {
  if (!rendererInfo) return false;
  return /SwiftShader|llvmpipe|mesa|software|softpipe|lavapipe|Microsoft Basic Render/i.test(
    rendererInfo
  );
}

export function computeExplodePosition(
  base: [number, number, number],
  offset: [number, number, number],
  factor: number
): [number, number, number] {
  const f = Math.min(Math.max(factor, 0), 1);
  return [base[0] + offset[0] * f, base[1] + offset[1] * f, base[2] + offset[2] * f];
}

export function buildStudioTelemetry(
  data: BalanceOSDataset,
  lang: Language
): Record<StudioNodeId, StudioNodeTelemetry> {
  const cairoProjects = data.projects.filter((p) => p.branchId === 'br-cairo');
  const alexProjects = data.projects.filter((p) => p.branchId === 'br-alex');
  const activeShoots = data.shoots.filter((s) => s.status !== 'handover_completed');
  const openTasks = data.tasks.filter((t) => t.status !== 'completed');
  const overdueTasks = openTasks.filter((t) => t.dueDate < '2026-11-20');
  const activeEditing = data.editingJobs.filter((j) => j.status !== 'delivered');
  const activeDesign = data.designJobs.filter((j) => j.status !== 'delivered');
  const activeDev = data.devItems.filter((d) => d.status !== 'released' && d.status !== 'closed');
  const activeMarketing = data.marketingItems.filter((m) => m.status !== 'completed');
  const availableAssets = data.assets.filter((a) => a.status === 'available');

  const formatNum = (n: number) => n.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US');

  return {
    camera_rig: {
      id: 'camera_rig',
      titleAr: 'منصة التصوير السينمائي',
      titleEn: 'Cinema Production Rig',
      subtitleAr: 'إدارة التصوير وحجز الكاميرات',
      subtitleEn: 'Media Production & Asset Booking',
      accentHex: '#2563EB',
      route: '/production',
      status: activeShoots.length > 0 ? 'active' : 'idle',
      metrics: [
        { labelAr: 'أيام تصوير نشطة', labelEn: 'Active Shoots', value: formatNum(activeShoots.length) },
        { labelAr: 'حجوزات مؤكدة', labelEn: 'Bookings', value: formatNum(data.equipmentReservations.length) },
        { labelAr: 'معدات متاحة', labelEn: 'Available Gear', value: formatNum(availableAssets.length) },
      ],
    },
    lighting_gantry: {
      id: 'lighting_gantry',
      titleAr: 'منظومة الإضاءة والمعدات',
      titleEn: 'Studio Lighting & Gear Gantry',
      subtitleAr: 'عهد الأصول ومنع تعارض الحجز',
      subtitleEn: 'Studio Inventory & Conflict Guard',
      accentHex: '#D97706',
      route: '/assets',
      status: data.assets.some((a) => a.status === 'maintenance') ? 'warning' : 'active',
      metrics: [
        { labelAr: 'إجمالي الأصول', labelEn: 'Total Assets', value: formatNum(data.assets.length) },
        { labelAr: 'في الصيانة', labelEn: 'Maintenance', value: formatNum(data.assets.filter((a) => a.status === 'maintenance').length) },
        { labelAr: 'مؤمن بالكامل', labelEn: 'Tracked', value: '100%' },
      ],
    },
    cairo_hq: {
      id: 'cairo_hq',
      titleAr: 'فرع القاهرة الرئيسي (HQ)',
      titleEn: 'Cairo Headquarters',
      subtitleAr: 'التجمع الخامس — الإدارة والمبيعات والإنتاج',
      subtitleEn: 'New Cairo — HQ, Sales & Studio',
      accentHex: '#0284C7',
      route: '/company/branches',
      status: 'active',
      metrics: [
        { labelAr: 'مشاريع القاهرة', labelEn: 'Cairo Projects', value: formatNum(cairoProjects.length) },
        { labelAr: 'الموظفون', labelEn: 'Staff', value: formatNum(data.employees.filter((e) => e.branchIds.includes('br-cairo')).length) },
        { labelAr: 'فرص المبيعات', labelEn: 'Pipeline Leads', value: formatNum(data.leads.filter((l) => l.branchId === 'br-cairo').length) },
      ],
    },
    alex_branch: {
      id: 'alex_branch',
      titleAr: 'فرع الإسكندرية (ALEX-02)',
      titleEn: 'Alexandria Branch',
      subtitleAr: 'سموحة — التطوير والتسويق الرقمي',
      subtitleEn: 'Smouha — Growth & Software Hub',
      accentHex: '#16A34A',
      route: '/company/branches',
      status: 'active',
      metrics: [
        { labelAr: 'مشاريع الإسكندرية', labelEn: 'Alex Projects', value: formatNum(alexProjects.length) },
        { labelAr: 'الموظفون', labelEn: 'Staff', value: formatNum(data.employees.filter((e) => e.branchIds.includes('br-alex')).length) },
        { labelAr: 'حسابات الخزينة', labelEn: 'Treasuries', value: formatNum(data.treasuryAccounts.filter((t) => t.branchId === 'br-alex').length) },
      ],
    },
    editing_bay: {
      id: 'editing_bay',
      titleAr: 'وحدة المونتاج والتصميم الإبداعي',
      titleEn: 'Editing & Design Post-Production',
      subtitleAr: 'مراحل المراجعة والنسخ الإبداعية',
      subtitleEn: 'Cut Pipelines & Brand Creative',
      accentHex: '#7C3AED',
      route: '/editing',
      status: overdueTasks.length > 0 ? 'warning' : 'active',
      metrics: [
        { labelAr: 'وظائف مونتاج نشطة', labelEn: 'Editing Jobs', value: formatNum(activeEditing.length) },
        { labelAr: 'تصاميم جارية', labelEn: 'Design Jobs', value: formatNum(activeDesign.length) },
        { labelAr: 'مهام متأخرة', labelEn: 'Overdue Tasks', value: formatNum(overdueTasks.length) },
      ],
    },
    dev_cluster: {
      id: 'dev_cluster',
      titleAr: 'قسم البرمجة والتسويق الرقمي',
      titleEn: 'Engineering & Digital Marketing',
      subtitleAr: 'تطوير الأنظمة وحملات النمو',
      subtitleEn: 'Software Builds & Campaign Ops',
      accentHex: '#0F766E',
      route: '/development',
      status: 'active',
      metrics: [
        { labelAr: 'مشاريع تقنية', labelEn: 'Dev Builds', value: formatNum(activeDev.length) },
        { labelAr: 'حملات تسويقية', labelEn: 'Campaigns', value: formatNum(activeMarketing.length) },
        { labelAr: 'تذاكر الدعم المفتوحة', labelEn: 'Open Tickets', value: formatNum(data.supportTickets.filter((tk) => tk.status !== 'closed').length) },
      ],
    },
  };
}
