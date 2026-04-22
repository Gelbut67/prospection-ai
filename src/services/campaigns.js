import { supabase } from '../lib/supabase';

export async function getCampaigns() {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_prospects(count),
      emails(count)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data.map(c => ({
    ...c,
    total_prospects: c.campaign_prospects?.[0]?.count || 0,
    emails_sent: c.emails?.[0]?.count || 0
  }));
}

export async function getCampaign(id) {
  const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createCampaign(campaign) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data, error } = await supabase.from('campaigns').insert({
    ...campaign,
    user_id: user.id
  }).select().single();
  
  if (error) throw error;
  return data;
}

export async function updateCampaign(id, updates) {
  const { data, error } = await supabase.from('campaigns').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCampaign(id) {
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}

export async function getCampaignProspects(campaignId) {
  const { data, error } = await supabase
    .from('campaign_prospects')
    .select(`
      *,
      prospects(*)
    `)
    .eq('campaign_id', campaignId);
  
  if (error) throw error;
  return data.map(cp => ({ ...cp.prospects, campaign_status: cp.status }));
}

export async function addProspectsToCampaign(campaignId, prospectIds) {
  const rows = prospectIds.map(prospect_id => ({
    campaign_id: campaignId,
    prospect_id
  }));

  const { data, error } = await supabase
    .from('campaign_prospects')
    .upsert(rows, { onConflict: 'campaign_id,prospect_id', ignoreDuplicates: true })
    .select();
  
  if (error) throw error;
  return data;
}

export async function removeProspectFromCampaign(campaignId, prospectId) {
  const { error } = await supabase
    .from('campaign_prospects')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('prospect_id', prospectId);
  
  if (error) throw error;
}
