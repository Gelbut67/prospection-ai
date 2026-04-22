import { supabase } from '../lib/supabase';

export async function getEmails(filters = {}) {
  let query = supabase
    .from('emails')
    .select(`
      *,
      prospects(first_name, last_name, email, company),
      campaigns(name)
    `)
    .order('created_at', { ascending: false });
  
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.campaign_id) query = query.eq('campaign_id', filters.campaign_id);
  
  const { data, error } = await query;
  if (error) throw error;
  
  return data.map(e => ({
    ...e,
    first_name: e.prospects?.first_name,
    last_name: e.prospects?.last_name,
    prospect_email: e.prospects?.email,
    campaign_name: e.campaigns?.name
  }));
}

export async function sendEmail({ prospectId, campaignId, subject, body }) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { prospectId, campaignId, subject, body }
  });
  if (error) throw error;
  return data;
}

export async function sendCampaign(campaignId) {
  const { data, error } = await supabase.functions.invoke('send-campaign', {
    body: { campaignId }
  });
  if (error) throw error;
  return data;
}
