import type { BalanceOSDataset } from '../data/seedData';
import type { Language } from '../types/os';
import { formatEGP } from '../utils/accounting';
import { auth } from './firebaseService';

export type AiAdvisorRoleId =
  | 'ceo'
  | 'sales'
  | 'project'
  | 'finance'
  | 'hr'
  | 'marketing'
  | 'support';

export interface AiChatContextSummary {
  revenuePiasters: number;
  netProfitPiasters: number;
  projectsCount: number;
  atRiskProjects: string[];
  leadsCount: number;
  pendingApprovals: number;
}

export interface AiChatPayload {
  role: AiAdvisorRoleId;
  prompt: string;
  lang: Language;
  contextSummary: AiChatContextSummary;
}

export interface AiChatResponse {
  text?: string;
  error?: string;
}

export function buildAiChatPayload(params: {
  role: AiAdvisorRoleId;
  prompt: string;
  lang: Language;
  revenuePiasters: number;
  netProfitPiasters: number;
  data: Pick<BalanceOSDataset, 'projects' | 'leads' | 'approvals'>;
}): AiChatPayload {
  const trimmedPrompt = params.prompt.trim();
  if (!trimmedPrompt) {
    throw new Error('Prompt cannot be empty.');
  }
  return {
    role: params.role,
    prompt: trimmedPrompt,
    lang: params.lang,
    contextSummary: {
      revenuePiasters: params.revenuePiasters,
      netProfitPiasters: params.netProfitPiasters,
      projectsCount: params.data.projects.length,
      atRiskProjects: params.data.projects
        .filter((p) => p.status === 'at_risk')
        .map((p) => p.name),
      leadsCount: params.data.leads.length,
      pendingApprovals: params.data.approvals.filter((a) => a.status === 'pending').length,
    },
  };
}

export function buildDemoAiResponse(params: {
  role: AiAdvisorRoleId;
  lang: Language;
  revenuePiasters: number;
  netProfitPiasters: number;
  data: Pick<BalanceOSDataset, 'projects' | 'leads'>;
}): string {
  const atRiskCount = params.data.projects.filter((p) => p.status === 'at_risk').length;
  const pipelineEstimate = params.data.leads.reduce(
    (sum, lead) => sum + lead.estimatedBudgetPiasters,
    0
  );

  if (params.lang === 'ar') {
    return `**حقائق مؤكدة (من السجلات الحالية):**\n• الإيرادات المعتمدة: ${formatEGP(params.revenuePiasters, 'ar')}\n• صافي الربح المحاسبي: ${formatEGP(params.netProfitPiasters, 'ar')}\n• عدد المشاريع النشطة: ${params.data.projects.length} (بينها ${atRiskCount} مشروع معرض للخطر).\n\n**تقديرات:**\n• القيمة التقديرية لفرص CRM الحالية: ${formatEGP(pipelineEstimate, 'ar')}.\n\n**توصيات مقترحة (${params.role.toUpperCase()}):**\n• متابعة الفواتير المتأخرة والمصروفات المعلقة بالاعتماد لرفع السيولة التشغيلية.`;
  }

  return `**Confirmed Facts:**\n• Recognized Revenue: ${formatEGP(params.revenuePiasters, 'en')}\n• Net Profit: ${formatEGP(params.netProfitPiasters, 'en')}\n• Projects: ${params.data.projects.length} (${atRiskCount} at risk).\n\n**Recommendation (${params.role.toUpperCase()}):**\n• Prioritize overdue receivables and pending SoD approvals.`;
}

export async function sendAiChatRequest(params: {
  role: AiAdvisorRoleId;
  prompt: string;
  lang: Language;
  isDemoMode: boolean;
  revenuePiasters: number;
  netProfitPiasters: number;
  data: BalanceOSDataset;
}): Promise<string> {
  const payload = buildAiChatPayload({
    role: params.role,
    prompt: params.prompt,
    lang: params.lang,
    revenuePiasters: params.revenuePiasters,
    netProfitPiasters: params.netProfitPiasters,
    data: params.data,
  });

  if (params.isDemoMode || !auth.currentUser) {
    return buildDemoAiResponse({
      role: params.role,
      lang: params.lang,
      revenuePiasters: params.revenuePiasters,
      netProfitPiasters: params.netProfitPiasters,
      data: params.data,
    });
  }

  const token = await auth.currentUser.getIdToken();
  const resp = await fetch('/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = (await resp.json()) as AiChatResponse;
  if (!resp.ok && json.error) {
    throw new Error(json.error);
  }
  return json.text ?? json.error ?? 'AI service returned empty response.';
}
