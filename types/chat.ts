export type ChatApiRequest = {
  session_id: string;
  message: string;
};

export type SupportedUseCase =
  | 'project-management'
  | 'crm'
  | 'support'
  | 'automation'
  | 'note-taking'
  | 'knowledge-base'
  | 'design'
  | 'scheduling';

export type TrackClickRequest = {
  recommendation_id?: string;
  offer_id: string;
  session_id: string;
  sub_id: string;
  utm_source: 'toolmatch';
  utm_medium: 'recommendation';
  utm_campaign: string;
  referrer?: string;
};

export type TrackClickResponse = {
  tracked: boolean;
  deduplicated?: boolean;
};

export type StoredMessageRole = 'user' | 'assistant';

export type CollectedContext = {
  useCase?: string;
  teamSize?: string;
  budget?: string;
  priorities?: string[];
};

export type RecommendationItem = {
  offer_id: string;
  rank: number;
  match_score: number;
  match_reason: string;
  name: string;
  description: string;
  affiliate_url: string;
  logo_url?: string | null;
  recommendation_id?: string;
};

export type CompletionReason =
  | 'needs_more_info'
  | 'unsupported_domain'
  | 'llm_recommendation'
  | 'fallback_recommendation';

export type ContextExtractionOutput = {
  useCase?: string;
  teamSize?: string;
  budget?: string;
  priorities?: string[];
  unsupportedRequest?: boolean;
  requestedUseCase?: string;
};

export type ChatServiceResult = {
  reply: string;
  needsMoreInfo: boolean;
  collectedContext: CollectedContext;
  recommendations?: RecommendationItem[];
  completionReason?: CompletionReason;
};

export type RecommendationOutput = {
  needsMoreInfo: boolean;
  reply: string;
  recommendations?: Array<{
    offer_id: string;
    match_score: number;
    match_reason: string;
  }>;
};

export type ConversationMessage = {
  role: StoredMessageRole;
  content: string;
};