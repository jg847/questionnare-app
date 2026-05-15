import 'server-only';

import { createServiceRoleSupabaseClient } from '@/lib/db/supabase';
import type {
  AdminPromptCreateInput,
  AdminPromptDetail,
  AdminPromptListItem,
} from '@/types/admin';
import type { SystemPromptRecord } from '@/types/database';

async function getNextPromptVersion() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('system_prompts')
    .select('version')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return ((data as { version: number } | null)?.version ?? 0) + 1;
}

export async function listAdminPrompts() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('system_prompts')
    .select('id, version, is_active, created_at')
    .order('version', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as AdminPromptListItem[]) ?? [];
}

export async function getActiveAdminPrompt() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('system_prompts')
    .select('id, version, content, is_active, created_at')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AdminPromptDetail | null) ?? null;
}

export async function getAdminPromptById(id: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('system_prompts')
    .select('id, version, content, is_active, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AdminPromptDetail | null) ?? null;
}

export async function activateAdminPrompt(id: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { error: clearError } = await supabase
    .from('system_prompts')
    .update({ is_active: false })
    .eq('is_active', true);

  if (clearError) {
    throw clearError;
  }

  const { data, error } = await supabase
    .from('system_prompts')
    .update({ is_active: true })
    .eq('id', id)
    .select('id, version, content, is_active, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data as AdminPromptDetail;
}

export async function createAdminPrompt(input: AdminPromptCreateInput) {
  const supabase = createServiceRoleSupabaseClient();
  const version = await getNextPromptVersion();
  const activate = Boolean(input.activate);

  if (activate) {
    const { error: clearError } = await supabase
      .from('system_prompts')
      .update({ is_active: false })
      .eq('is_active', true);

    if (clearError) {
      throw clearError;
    }
  }

  const { data, error } = await supabase
    .from('system_prompts')
    .insert({
      version,
      content: input.content,
      is_active: activate,
    })
    .select('id, version, content, is_active, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data as AdminPromptDetail;
}

export async function listPromptHistoryWithContent() {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('system_prompts')
    .select('id, version, content, is_active, created_at')
    .order('version', { ascending: false });

  if (error) {
    throw error;
  }

  return (data as SystemPromptRecord[]) ?? [];
}