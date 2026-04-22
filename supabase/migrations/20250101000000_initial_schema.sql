-- ============================================================
-- PROSPECTION AI - Schéma Initial Supabase
-- ============================================================

-- Table des utilisateurs (géré par Supabase Auth)
-- auth.users existe déjà

-- ============================================================
-- Table: prospects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.prospects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  position TEXT,
  phone TEXT,
  linkedin_url TEXT,
  website TEXT,
  city TEXT,
  department TEXT,
  sector TEXT,
  company_size TEXT,
  container_type TEXT,
  relevance_score INTEGER,
  discovery_reason TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'qualified', 'converted', 'lost')),
  tags TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX idx_prospects_user_id ON public.prospects(user_id);
CREATE INDEX idx_prospects_status ON public.prospects(status);
CREATE INDEX idx_prospects_department ON public.prospects(department);

-- ============================================================
-- Table: campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  follow_up_enabled BOOLEAN DEFAULT true,
  follow_up_delay_days INTEGER DEFAULT 3,
  follow_up_count INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);

-- ============================================================
-- Table: campaign_prospects (liaison)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaign_prospects (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  prospect_id BIGINT REFERENCES public.prospects(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'replied', 'clicked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, prospect_id)
);

CREATE INDEX idx_campaign_prospects_campaign ON public.campaign_prospects(campaign_id);
CREATE INDEX idx_campaign_prospects_prospect ON public.campaign_prospects(prospect_id);

-- ============================================================
-- Table: emails
-- ============================================================
CREATE TABLE IF NOT EXISTS public.emails (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id BIGINT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  prospect_id BIGINT REFERENCES public.prospects(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'failed', 'bounced')),
  type TEXT DEFAULT 'initial' CHECK (type IN ('initial', 'follow_up')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emails_user_id ON public.emails(user_id);
CREATE INDEX idx_emails_campaign ON public.emails(campaign_id);
CREATE INDEX idx_emails_prospect ON public.emails(prospect_id);
CREATE INDEX idx_emails_status ON public.emails(status);

-- ============================================================
-- Table: follow_ups
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_email_id BIGINT REFERENCES public.emails(id) ON DELETE CASCADE NOT NULL,
  prospect_id BIGINT REFERENCES public.prospects(id) ON DELETE CASCADE NOT NULL,
  campaign_id BIGINT REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_followups_scheduled ON public.follow_ups(scheduled_at, status);

-- ============================================================
-- Table: discovered_prospects (recherches IA non importées)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discoveries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  search_criteria JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_discoveries_user ON public.discoveries(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;

-- Policies : chaque utilisateur ne voit que ses données
CREATE POLICY "Users manage their own prospects"
  ON public.prospects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own campaigns"
  ON public.campaigns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own campaign_prospects"
  ON public.campaign_prospects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c 
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage their own emails"
  ON public.emails FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own follow_ups"
  ON public.follow_ups FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own discoveries"
  ON public.discoveries FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Triggers pour updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_prospects
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
