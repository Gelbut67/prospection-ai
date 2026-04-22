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

  const emailsSent = emailsData.filter(e => e.status === 'sent').length;
  const emailsOpened = emailsData.filter(e => e.opened_at).length;
  const emailsClicked = emailsData.filter(e => e.clicked_at).length;

  return {
    stats: {
      total_prospects: prospects.count || 0,
      total_campaigns: campaigns.count || 0,
      emails_sent: emailsSent,
      emails_opened: emailsOpened,
      emails_clicked: emailsClicked,
      open_rate: emailsSent > 0 ? ((emailsOpened / emailsSent) * 100).toFixed(1) : 0,
      click_rate: emailsSent > 0 ? ((emailsClicked / emailsSent) * 100).toFixed(1) : 0,
      active_follow_ups: 0
    },
    prospect_status: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count }))
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

  return (campaigns || []).map(c => {
    const emails = c.emails || [];
    const totalSent = emails.filter(e => e.status === 'sent').length;
    const opened = emails.filter(e => e.opened_at).length;
    const clicked = emails.filter(e => e.clicked_at).length;
    
    return {
      id: c.id,
      name: c.name,
      total_prospects: c.campaign_prospects?.[0]?.count || 0,
      total_sent: totalSent,
      opened: opened,
      clicked: clicked
    };
  });
}
