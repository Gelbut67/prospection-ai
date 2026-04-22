import { supabase } from '../lib/supabase';

export async function discoverProspects(criteria) {
  const { data, error } = await supabase.functions.invoke('discover-prospects', {
    body: criteria
  });
  if (error) throw error;
  return data;
}

export async function generatePersonalizedEmail(prospect) {
  const { data, error } = await supabase.functions.invoke('generate-email', {
    body: { prospect }
  });
  if (error) throw error;
  return data;
}

export async function saveDiscovery(criteria, results) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('discoveries').insert({
    user_id: user.id,
    search_criteria: criteria,
    results
  });
}
