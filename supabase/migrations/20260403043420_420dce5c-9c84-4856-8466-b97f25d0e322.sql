CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  vendor_name TEXT,
  vendor_normalized TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  subtotal NUMERIC(12,2),
  tax_amount NUMERIC(12,2),
  total_amount NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  confidence_score NUMERIC(3,2),
  raw_extracted_text TEXT,
  raw_extracted_json JSONB,
  format_hash TEXT,
  error_message TEXT,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES public.invoices(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoices" ON public.invoices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own invoices" ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own invoices" ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own invoices" ON public.invoices FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_vendor ON public.invoices(vendor_normalized);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date);
CREATE INDEX idx_invoices_format_hash ON public.invoices(format_hash);

CREATE TABLE public.invoice_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT,
  quantity NUMERIC(10,3),
  unit_price NUMERIC(12,2),
  amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own line items" ON public.invoice_line_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can insert own line items" ON public.invoice_line_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));
CREATE POLICY "Users can delete own line items" ON public.invoice_line_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_line_items.invoice_id AND invoices.user_id = auth.uid()));

CREATE TABLE public.invoice_formats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  format_hash TEXT NOT NULL UNIQUE,
  vendor_name TEXT,
  sample_prompt TEXT,
  field_mapping JSONB,
  times_seen INTEGER DEFAULT 1,
  avg_confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Formats readable by authenticated" ON public.invoice_formats FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_invoice_formats_updated_at BEFORE UPDATE ON public.invoice_formats
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);

CREATE POLICY "Users can upload invoices" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own invoices storage" ON storage.objects FOR SELECT
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own invoices storage" ON storage.objects FOR DELETE
  USING (bucket_id = 'invoices' AND auth.uid()::text = (storage.foldername(name))[1]);