-- Create enums for the system
CREATE TYPE public.app_role AS ENUM ('applicant', 'fire_officer', 'senior_officer', 'admin');
CREATE TYPE public.application_status AS ENUM ('draft', 'submitted', 'under_review', 'inspection_scheduled', 'inspection_completed', 'approved', 'rejected', 'requires_compliance');
CREATE TYPE public.building_category AS ENUM ('residential', 'commercial', 'hospital', 'school', 'factory', 'mall', 'hotel', 'warehouse', 'office', 'mixed_use', 'other');
CREATE TYPE public.risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.inspection_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE public.deficiency_status AS ENUM ('open', 'in_progress', 'resolved', 'overdue');
CREATE TYPE public.grievance_status AS ENUM ('submitted', 'under_review', 'resolved', 'closed');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  organization TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'applicant',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID,
  UNIQUE (user_id, role)
);

-- Buildings table
CREATE TABLE public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL,
  category building_category NOT NULL,
  floors INTEGER NOT NULL DEFAULT 1,
  area_sqft NUMERIC NOT NULL,
  occupancy_capacity INTEGER,
  year_built INTEGER,
  latitude NUMERIC,
  longitude NUMERIC,
  risk_score INTEGER DEFAULT 50,
  risk_level risk_level DEFAULT 'medium',
  last_inspection_date DATE,
  noc_valid_until DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number TEXT NOT NULL UNIQUE,
  applicant_id UUID NOT NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  application_type TEXT NOT NULL DEFAULT 'new_noc',
  status application_status NOT NULL DEFAULT 'draft',
  purpose TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  submitted_at TIMESTAMPTZ,
  assigned_officer_id UUID,
  priority INTEGER DEFAULT 5,
  notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inspections table
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  officer_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status inspection_status NOT NULL DEFAULT 'scheduled',
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  gps_verified BOOLEAN DEFAULT false,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  overall_score INTEGER,
  checklist_data JSONB DEFAULT '[]'::jsonb,
  findings TEXT,
  recommendations TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  officer_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Inspection checklist templates
CREATE TABLE public.inspection_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_category building_category NOT NULL,
  item_name TEXT NOT NULL,
  item_description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  weight INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deficiencies table
CREATE TABLE public.deficiencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity risk_level NOT NULL DEFAULT 'medium',
  status deficiency_status NOT NULL DEFAULT 'open',
  compliance_deadline DATE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- NOCs table
CREATE TABLE public.nocs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  noc_number TEXT NOT NULL UNIQUE,
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL UNIQUE,
  building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
  issued_to TEXT NOT NULL,
  issued_by UUID NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  qr_code_data TEXT NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit logs table (immutable)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_role app_role,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grievances table
CREATE TABLE public.grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_number TEXT NOT NULL UNIQUE,
  submitted_by UUID NOT NULL,
  application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status grievance_status NOT NULL DEFAULT 'submitted',
  priority INTEGER DEFAULT 5,
  assigned_to UUID,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  rating INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to check if user is staff (officer, senior, or admin)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('fire_officer', 'senior_officer', 'admin')
  )
$$;

-- Profile policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view all profiles" ON public.profiles FOR SELECT USING (public.is_staff(auth.uid()));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Buildings policies
CREATE POLICY "Owners can view their own buildings" ON public.buildings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can manage their own buildings" ON public.buildings FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Staff can view all buildings" ON public.buildings FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update buildings" ON public.buildings FOR UPDATE USING (public.is_staff(auth.uid()));

-- Applications policies
CREATE POLICY "Applicants can view their own applications" ON public.applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Applicants can create applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Applicants can update draft applications" ON public.applications FOR UPDATE USING (auth.uid() = applicant_id AND status = 'draft');
CREATE POLICY "Staff can view all applications" ON public.applications FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can update applications" ON public.applications FOR UPDATE USING (public.is_staff(auth.uid()));

-- Inspections policies
CREATE POLICY "Officers can view assigned inspections" ON public.inspections FOR SELECT USING (auth.uid() = officer_id OR public.is_staff(auth.uid()));
CREATE POLICY "Officers can manage their inspections" ON public.inspections FOR ALL USING (auth.uid() = officer_id);
CREATE POLICY "Staff can create inspections" ON public.inspections FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

-- Inspection checklists policies (public read for templates)
CREATE POLICY "Anyone can view checklists" ON public.inspection_checklists FOR SELECT USING (true);
CREATE POLICY "Admins can manage checklists" ON public.inspection_checklists FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Deficiencies policies
CREATE POLICY "Staff can view all deficiencies" ON public.deficiencies FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage deficiencies" ON public.deficiencies FOR ALL USING (public.is_staff(auth.uid()));
CREATE POLICY "Building owners can view their deficiencies" ON public.deficiencies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.buildings WHERE id = building_id AND owner_id = auth.uid())
);

-- NOCs policies
CREATE POLICY "Anyone can verify NOCs" ON public.nocs FOR SELECT USING (true);
CREATE POLICY "Staff can manage NOCs" ON public.nocs FOR ALL USING (public.is_staff(auth.uid()));

-- Audit logs policies (read-only for admins)
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Grievances policies
CREATE POLICY "Users can view their own grievances" ON public.grievances FOR SELECT USING (auth.uid() = submitted_by);
CREATE POLICY "Users can create grievances" ON public.grievances FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Staff can view all grievances" ON public.grievances FOR SELECT USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can manage grievances" ON public.grievances FOR UPDATE USING (public.is_staff(auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON public.buildings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON public.inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_deficiencies_updated_at BEFORE UPDATE ON public.deficiencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grievances_updated_at BEFORE UPDATE ON public.grievances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate application number
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.application_number := 'APP-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_application_number BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.generate_application_number();

-- Function to generate NOC number
CREATE OR REPLACE FUNCTION public.generate_noc_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.noc_number := 'NOC-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  NEW.qr_code_data := NEW.noc_number || '|' || NEW.building_id || '|' || NEW.valid_until;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_noc_number BEFORE INSERT ON public.nocs FOR EACH ROW EXECUTE FUNCTION public.generate_noc_number();

-- Function to generate grievance number
CREATE OR REPLACE FUNCTION public.generate_grievance_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.grievance_number := 'GRV-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_grievance_number BEFORE INSERT ON public.grievances FOR EACH ROW EXECUTE FUNCTION public.generate_grievance_number();

-- Function to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'applicant');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;