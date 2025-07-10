-- Create cancel_requests table
CREATE TABLE public.cancel_requests (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason text NOT NULL,
  bank_account_number text NOT NULL,
  bank_name text NOT NULL,
  account_holder_name text NOT NULL,
  refund_amount decimal(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  processed_at timestamp with time zone,
  processed_by uuid REFERENCES public.users(id),
  admin_notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on cancel_requests
ALTER TABLE public.cancel_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for cancel_requests
CREATE POLICY "Users can view own cancel requests" ON public.cancel_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own cancel requests" ON public.cancel_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Event organizers can view all cancel requests" ON public.cancel_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('event_organizer', 'super_admin')
    )
  );

CREATE POLICY "Event organizers can update cancel requests" ON public.cancel_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('event_organizer', 'super_admin')
    )
  );

-- Create transportation_groups table
CREATE TABLE public.transportation_groups (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  region region_type NOT NULL,
  departure_location text NOT NULL,
  departure_time timestamp with time zone NOT NULL,
  arrival_location text DEFAULT 'Venue Location',
  capacity integer NOT NULL DEFAULT 45,
  current_count integer DEFAULT 0,
  vehicle_type text DEFAULT 'bus', -- bus, van, train, etc.
  contact_person text,
  contact_phone text,
  notes text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'full', 'cancelled')),
  created_by uuid REFERENCES public.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on transportation_groups
ALTER TABLE public.transportation_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for transportation_groups
CREATE POLICY "Regional admins can manage their region's transport groups" ON public.transportation_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND (
        users.role = 'super_admin' OR 
        (users.role = 'regional_admin' AND users.region = transportation_groups.region)
      )
    )
  );

CREATE POLICY "Users can view transport groups in their region" ON public.transportation_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.region = transportation_groups.region
    )
  );

-- Create transportation_registrations junction table
CREATE TABLE public.transportation_registrations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  transportation_group_id uuid REFERENCES public.transportation_groups(id) ON DELETE CASCADE NOT NULL,
  registrant_id uuid REFERENCES public.registrants(id) ON DELETE CASCADE NOT NULL,
  registered_by uuid REFERENCES public.users(id) NOT NULL,
  emergency_contact_name text,
  emergency_contact_phone text,
  special_needs text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure a registrant can only be in one transport group
  UNIQUE(registrant_id)
);

-- Enable RLS on transportation_registrations
ALTER TABLE public.transportation_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for transportation_registrations
CREATE POLICY "Users can view transport registrations they created" ON public.transportation_registrations
  FOR SELECT USING (auth.uid() = registered_by);

CREATE POLICY "Regional admins can manage transport registrations in their region" ON public.transportation_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.transportation_groups tg ON tg.id = transportation_group_id
      WHERE u.id = auth.uid() 
      AND (
        u.role = 'super_admin' OR 
        (u.role = 'regional_admin' AND u.region = tg.region)
      )
    )
  );

-- Create function to update transportation group current_count
CREATE OR REPLACE FUNCTION update_transportation_group_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.transportation_groups 
    SET current_count = current_count + 1,
        updated_at = NOW()
    WHERE id = NEW.transportation_group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.transportation_groups 
    SET current_count = current_count - 1,
        updated_at = NOW()
    WHERE id = OLD.transportation_group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for transportation group count
CREATE TRIGGER update_transportation_count_on_insert
  AFTER INSERT ON public.transportation_registrations
  FOR EACH ROW EXECUTE FUNCTION update_transportation_group_count();

CREATE TRIGGER update_transportation_count_on_delete
  AFTER DELETE ON public.transportation_registrations
  FOR EACH ROW EXECUTE FUNCTION update_transportation_group_count();

-- Create indexes for better performance
CREATE INDEX idx_cancel_requests_registration_id ON public.cancel_requests(registration_id);
CREATE INDEX idx_cancel_requests_user_id ON public.cancel_requests(user_id);
CREATE INDEX idx_cancel_requests_status ON public.cancel_requests(status);
CREATE INDEX idx_transportation_groups_region ON public.transportation_groups(region);
CREATE INDEX idx_transportation_groups_created_by ON public.transportation_groups(created_by);
CREATE INDEX idx_transportation_registrations_group_id ON public.transportation_registrations(transportation_group_id);
CREATE INDEX idx_transportation_registrations_registrant_id ON public.transportation_registrations(registrant_id);
