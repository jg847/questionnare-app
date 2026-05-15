export type AdminOfferInput = {
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  affiliate_url: string;
  logo_url?: string;
  pricing_model?: string;
  commission_info?: string;
  is_active: boolean;
};

export type AdminOfferListItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  pricing_model?: string | null;
  is_active: boolean;
  updated_at: string;
};

export type AdminOfferDetail = AdminOfferInput & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type AdminPromptCreateInput = {
  content: string;
  activate?: boolean;
};

export type AdminPromptListItem = {
  id: string;
  version: number;
  is_active: boolean;
  created_at: string;
};

export type AdminPromptDetail = {
  id: string;
  version: number;
  content: string;
  is_active: boolean;
  created_at: string;
};

export type AdminPromptSandboxRequest = {
  content: string;
  sampleConversation: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  sampleContext?: {
    useCase?: string;
    teamSize?: string;
    budget?: string;
    priorities?: string[];
  };
};

export type AdminPromptSandboxResponse = {
  reply: string;
  needsMoreInfo: boolean;
  recommendations?: Array<{
    offer_id: string;
    rank?: number;
    match_score: number;
    match_reason: string;
    name?: string;
  }>;
};

export type AdminAnalyticsSummary = {
  totalConversations: number;
  recommendationGenerationRate: number;
  totalClicks: number;
  metricDefinitions: {
    totalConversations: 'count(conversations.created_at in window)';
    recommendationGenerationRate: 'count(conversations where recommendation_generated = true in window) / count(conversations in window)';
    ctrPerOffer: 'clicks for that offer in the window / recommendations for that offer in the window';
    funnel: 'conversations started, conversations with recommendations, sessions with at least one recommendation click';
  };
  topClickedOffer?: {
    offer_id: string;
    name: string;
    clicks: number;
  };
  funnel: {
    conversationsStarted: number;
    recommendationsGenerated: number;
    recommendationClicks: number;
  };
};

export type AdminOfferAnalyticsItem = {
  offer_id: string;
  name: string;
  clicks: number;
  recommendations: number;
  ctr: number;
};

export type AdminAnalyticsActivityPoint = {
  date: string;
  conversations: number;
  recommendationsGenerated: number;
  clicks: number;
};

export type AdminAnalyticsResponse = {
  summary: AdminAnalyticsSummary;
  offers: AdminOfferAnalyticsItem[];
  topOffersByClicks: AdminOfferAnalyticsItem[];
  activity: AdminAnalyticsActivityPoint[];
  window: {
    from: string;
    to: string;
  };
};

export type AdminQuestionType =
  | 'single_select'
  | 'multi_select'
  | 'text'
  | 'number'
  | 'boolean';

export type AdminQuestionnaireOptionInput = {
  id?: string;
  label: string;
  value: string;
  display_order: number;
};

export type AdminQuestionnaireBranchInput = {
  id?: string;
  source_question_key?: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  expected_value: string | number | boolean | string[];
  next_question_id?: string;
  display_order: number;
};

export type AdminQuestionnaireQuestionInput = {
  id?: string;
  key: string;
  prompt: string;
  helper_text?: string;
  question_type: AdminQuestionType;
  required: boolean;
  display_order: number;
  default_next_question_id?: string;
  context_key?: string;
  options?: AdminQuestionnaireOptionInput[];
  branches?: AdminQuestionnaireBranchInput[];
};

export type AdminQuestionnaireInput = {
  name: string;
  slug: string;
  category: string;
  questions: AdminQuestionnaireQuestionInput[];
};

export type AdminQuestionnaireListItem = {
  id: string;
  name: string;
  slug: string;
  category: string;
  version: number;
  status: 'draft' | 'active' | 'inactive';
  is_active: boolean;
  updated_at: string;
  question_count: number;
};

export type AdminQuestionnaireDetail = AdminQuestionnaireInput & {
  id: string;
  version: number;
  status: 'draft' | 'active' | 'inactive';
  is_active: boolean;
  published_snapshot_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type AdminQuestionnaireValidationResult = {
  valid: boolean;
  errors: string[];
};

export type PublicQuestionnaireQuestion = {
  id: string;
  key: string;
  prompt: string;
  helper_text?: string;
  question_type: AdminQuestionType;
  required: boolean;
  display_order: number;
  options?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
};

export type PublicQuestionnaire = {
  id: string;
  name: string;
  slug: string;
  category: string;
  version: number;
  first_question_id?: string;
  questions: PublicQuestionnaireQuestion[];
};

export type QuestionnaireSubmissionResponse = {
  submission_id: string;
  questionnaire_id: string;
  current_question_id?: string;
  answers: Record<string, unknown>;
  completed: boolean;
  recommendations?: Array<{
    offer_id: string;
    recommendation_id: string;
    name: string;
    description: string;
    category: string;
    affiliate_url: string;
    logo_url?: string | null;
    pricing_model?: string | null;
    commission_info?: string | null;
    match_reason: string;
    match_score: number;
    rank: number;
  }>;
  reply?: string;
};

export type AdminPartnerListItem = {
  id: string;
  name: string;
  slug: string;
  network?: string | null;
  default_currency: string;
  commission_model?: string | null;
  is_active: boolean;
};

export type AdminConversionInput = {
  partner_id?: string;
  offer_id?: string;
  sub_id?: string;
  partner_conversion_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  conversion_value?: number;
  commission_value: number;
  currency: string;
  occurred_at: string;
  source_type?: string;
  source_payload?: Record<string, unknown>;
  notes?: string;
};

export type AdminConversionListItem = {
  id: string;
  partner_name?: string | null;
  offer_name?: string | null;
  sub_id?: string | null;
  partner_conversion_id?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  commission_value: number;
  currency: string;
  occurred_at: string;
  attribution_state: 'matched' | 'unmatched' | 'manual_match' | 'duplicate_rejected';
};

export type AdminRevenueSummary = {
  totalClicks: number;
  totalConversions: number;
  approvedConversions: number;
  conversionRate: number;
  attributedRevenue: number;
  epc: number;
  currency: string;
  metricDefinitions: {
    totalConversions: 'count(all conversion records in window excluding duplicate_rejected)';
    approvedConversions: 'count(conversions where status in approved or paid and attribution_state = matched in window)';
    conversionRate: 'approved matched conversions / tracked clicks in window';
    epc: 'approved attributed revenue / tracked clicks in window';
  };
};

export type AdminRevenueOfferItem = {
  offer_id: string;
  name: string;
  clicks: number;
  conversions: number;
  approvedConversions: number;
  attributedRevenue: number;
  conversionRate: number;
  epc: number;
};

export type AdminRevenuePartnerItem = {
  partner_id: string;
  name: string;
  conversions: number;
  approvedConversions: number;
  attributedRevenue: number;
};

export type AdminRevenueResponse = {
  summary: AdminRevenueSummary;
  offers: AdminRevenueOfferItem[];
  partners: AdminRevenuePartnerItem[];
  conversions: AdminConversionListItem[];
  partnersCatalog: AdminPartnerListItem[];
  window: {
    from: string;
    to: string;
  };
};