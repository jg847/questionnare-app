export type OfferRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  affiliate_url: string;
  logo_url?: string | null;
  pricing_model?: string | null;
  commission_info?: string | null;
  is_active: boolean;
};

export type ConversationRecord = {
  id: string;
  session_id: string;
  recommendation_generated: boolean;
};

export type MessageRecord = {
  role: 'user' | 'assistant';
  content: string;
};

export type ClickRecord = {
  id: string;
  recommendation_id?: string | null;
  offer_id: string;
  session_id: string;
  sub_id: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  referrer?: string | null;
  created_at: string;
};

export type SystemPromptRecord = {
  id: string;
  version: number;
  content: string;
  is_active: boolean;
  created_at: string;
};

export type QuestionnaireRecord = {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
  version: number;
  status: 'draft' | 'active' | 'inactive';
  is_active: boolean;
  published_snapshot_json?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type QuestionnaireQuestionRecord = {
  id: string;
  questionnaire_id: string;
  key: string;
  prompt: string;
  helper_text?: string | null;
  question_type: 'single_select' | 'multi_select' | 'text' | 'number' | 'boolean';
  required: boolean;
  display_order: number;
  default_next_question_id?: string | null;
  context_key?: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionnaireOptionRecord = {
  id: string;
  question_id: string;
  label: string;
  value: string;
  display_order: number;
};

export type QuestionnaireBranchRecord = {
  id: string;
  question_id: string;
  source_question_key?: string | null;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  expected_value_json: unknown;
  next_question_id?: string | null;
  display_order: number;
};

export type QuestionnaireSubmissionRecord = {
  id: string;
  questionnaire_id: string;
  questionnaire_version: number;
  questionnaire_snapshot_id: string;
  session_id: string;
  current_question_id?: string | null;
  answers_json: Record<string, unknown>;
  started_at: string;
  completed_at?: string | null;
  last_interaction_at: string;
};

export type QuestionnaireAnswerRecord = {
  id: string;
  submission_id: string;
  question_id?: string | null;
  question_key: string;
  value_json: unknown;
  answered_at: string;
};

export type PartnerRecord = {
  id: string;
  name: string;
  slug: string;
  network?: string | null;
  default_currency: string;
  commission_model?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ConversionRecord = {
  id: string;
  partner_id?: string | null;
  offer_id?: string | null;
  click_id?: string | null;
  sub_id?: string | null;
  partner_conversion_id?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  conversion_value?: number | null;
  commission_value: number;
  currency: string;
  occurred_at: string;
  recorded_at: string;
  source_type: string;
  source_payload: Record<string, unknown>;
  attribution_state: 'matched' | 'unmatched' | 'manual_match' | 'duplicate_rejected';
  notes?: string | null;
};