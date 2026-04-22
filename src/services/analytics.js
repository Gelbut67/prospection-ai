import { supabase } from '../lib/supabase';

export async function getDashboardStats() {
  const [prospects, campaigns, emails] = await Promise.all([
    supabase.from('prospects').select('status', { count: 'exact' }),
    supabase.from('campaigns').select('id', { count: 'exact' }),
    supabase.from('emails').select('status, opened_at, clicked_at', { count: 'exact' })
  ]);

  const emailsData = emails.data || [];
  const prospectsData = prospects.data || [];

  const statusBreakdown = prospectsData.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return {
    total_prospects: prospects.count || 0,
    total_campaigns: campaigns.count || 0,
    emails_sent: emailsData.filter(e => e.status === 'sent').length,
    emails_opened: emailsData.filter(e => e.opened_at).length,
    emails_clicked: emailsData.filter(e => e.clicked_at).length,
    status_breakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count }))
  };
}

export async function getCampaignAnalytics() {
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select(`
      id,
      name,
      campaign_prospects(count),
      emails(status, opened_at, clicked_at)
    `);

  if (error) throw error;

  return campaigns.map(c => {
    const emails = c.emails || [];
    return {
      id: c.id,
      name: c.name,
      total_prospects: c.campaign_prospects?.[0]?.count || 0,
      emails_sent: emails.filter(e => e.status === 'sent').length,
      emails_opened: emails.filter(e => e.opened_at).length,
      emails_clicked: emails.filter(e => e.clicked_at).length
    };
  });
}
