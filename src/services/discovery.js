import { supabase } from '../lib/supabase';

export async function discoverProspects(criteria) {
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Discovery - Session token:', session?.access_token ? 'Present' : 'Missing');
  
  // Utiliser la nouvelle fonction avec badges de confiance
  const { data, error } = await supabase.functions.invoke('discover-real-prospects', {
    body: criteria,
    headers: {
      Authorization: `Bearer ${session?.access_token}`
    }
  });
  
  console.log('Discovery response:', { data, error });
  if (error) throw error;
  return data;
}

export async function generatePersonalizedEmail(prospect) {
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Session token:', session?.access_token ? 'Present' : 'Missing');
  
  const { data, error } = await supabase.functions.invoke('generate-email', {
    body: { prospect },
    headers: {
      Authorization: `Bearer ${session?.access_token}`
    }
  });
  
  if (error) {
    console.error('Generate email error:', error);
    throw error;
  }
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
