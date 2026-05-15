import { AnalyticsManager } from '@/components/admin/analytics-manager';
import { OfferManager } from '@/components/admin/offer-manager';
import { PromptManager } from '@/components/admin/prompt-manager';
import { QuestionnaireManager } from '@/components/admin/questionnaire-manager';
import { RevenueManager } from '@/components/admin/revenue-manager';

export default function AdminPage({
  searchParams,
}: {
  searchParams?: {
    section?: string;
  };
}) {
  if (searchParams?.section === 'prompts') {
    return <PromptManager />;
  }

  if (searchParams?.section === 'analytics') {
    return <AnalyticsManager />;
  }

  if (searchParams?.section === 'questionnaires') {
    return <QuestionnaireManager />;
  }

  if (searchParams?.section === 'revenue') {
    return <RevenueManager />;
  }

  return <OfferManager />;
}