import { DEVELOPMENT_FALLBACK_PROMPT } from '@/lib/ai/constants';
import { createServiceRoleSupabaseClient } from '@/lib/db/supabase';

export async function loadActivePrompt() {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('system_prompts')
      .select('content')
      .eq('is_active', true)
      .single();

    if (error) {
      throw error;
    }

    if (data?.content) {
      return data.content;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      return DEVELOPMENT_FALLBACK_PROMPT;
    }

    throw error;
  }

  if (process.env.NODE_ENV === 'development') {
    return DEVELOPMENT_FALLBACK_PROMPT;
  }

  throw new Error('No active system prompt is available.');
}