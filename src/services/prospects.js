import { supabase } from '../lib/supabase';

export async function getProspects(filters = {}) {
  let query = supabase.from('prospects').select('*').order('created_at', { ascending: false });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getProspect(id) {
  const { data, error } = await supabase.from('prospects').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createProspect(prospect) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase.from('prospects').insert({
    ...prospect,
    user_id: user.id
  }).select().single();
  
  if (error) throw error;
  return data;
}

export async function updateProspect(id, updates) {
  const { data, error } = await supabase.from('prospects').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProspect(id) {
  const { error } = await supabase.from('prospects').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkCreateProspects(prospects) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const withUserId = prospects.map(p => ({ ...p, user_id: user.id }));
  
  const { data, error } = await supabase.from('prospects').upsert(withUserId, { 
    onConflict: 'user_id,email',
    ignoreDuplicates: true 
  }).select();
  
  if (error) throw error;
  return data;
}
