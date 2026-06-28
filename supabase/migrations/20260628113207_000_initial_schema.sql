-- Create enum types
CREATE TYPE user_role AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN');

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  username TEXT UNIQUE,
  role user_role DEFAULT 'WORKER',
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  image TEXT DEFAULT '',
  is_verified BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'en',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE,
  preferred_countries TEXT[] DEFAULT '{}',
  preferred_cities TEXT[] DEFAULT '{}',
  date_of_birth DATE,
  address TEXT,
  id_type TEXT DEFAULT 'national',
  id_number TEXT,
  id_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Worker Profiles table
CREATE TABLE IF NOT EXISTS worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  category TEXT,
  experience_years INTEGER DEFAULT 0,
  expected_salary FLOAT DEFAULT 0,
  availability TEXT DEFAULT 'available',
  work_type TEXT DEFAULT 'full-time',
  bio_ar TEXT,
  bio_en TEXT,
  skills TEXT[] DEFAULT '{}',
  profile_photo_url TEXT,
  doc_status TEXT DEFAULT 'pending',
  rating_avg FLOAT DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  tasks_completed INTEGER DEFAULT 0,
  tasks_received INTEGER DEFAULT 0,
  tasks_declined INTEGER DEFAULT 0,
  performance_rating FLOAT DEFAULT 0,
  trustworthiness_rating FLOAT DEFAULT 0,
  speed_rating FLOAT DEFAULT 0,
  accuracy_rating FLOAT DEFAULT 0,
  preferred_work_locations TEXT[] DEFAULT '{}',
  available_hours TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Employer Profiles table
CREATE TABLE IF NOT EXISTS employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  company_logo TEXT,
  company_photos TEXT[] DEFAULT '{}',
  company_website TEXT,
  company_size TEXT,
  industry TEXT,
  description TEXT,
  address TEXT,
  is_verified BOOLEAN DEFAULT false,
  rating_avg FLOAT DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  response_rate FLOAT DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  id_type TEXT DEFAULT 'national',
  id_number TEXT,
  id_document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Experiences table
CREATE TABLE IF NOT EXISTS experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  employer_name TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Hires table
CREATE TABLE IF NOT EXISTS hires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agreed_salary FLOAT NOT NULL,
  commission_amount FLOAT DEFAULT 0,
  vat_amount FLOAT DEFAULT 0,
  total_due FLOAT DEFAULT 0,
  payment_method TEXT,
  payment_reference TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_proof_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'offer_sent',
  rejection_reason TEXT,
  rejected_by TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hire_id UUID REFERENCES hires(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hire_id UUID REFERENCES hires(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES worker_profiles(id) ON DELETE CASCADE,
  employer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
  trustworthiness_rating INTEGER CHECK (trustworthiness_rating >= 1 AND trustworthiness_rating <= 5),
  speed_rating INTEGER CHECK (speed_rating >= 1 AND speed_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complainant_id UUID NOT NULL,
  complainant_type TEXT NOT NULL CHECK (complainant_type IN ('WORKER', 'EMPLOYER')),
  complainant_name TEXT NOT NULL,
  complainant_phone TEXT,
  against_id UUID,
  against_type TEXT CHECK (against_type IN ('WORKER', 'EMPLOYER')),
  against_name TEXT,
  against_phone TEXT,
  against_id_number TEXT,
  complaint_text TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'resolved', 'rejected')),
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Payment Settings table
CREATE TABLE IF NOT EXISTS payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment settings
INSERT INTO payment_settings (setting_key, setting_value, description) VALUES
  ('vodafone_cash_number', '', 'Vodafone Cash Number'),
  ('bank_account_1', '', 'Bank Account 1'),
  ('bank_account_2', '', 'Bank Account 2'),
  ('instapay_number', '', 'Instapay Number'),
  ('commission_rate', '10', 'Commission Rate (%)')
ON CONFLICT (setting_key) DO NOTHING;

-- Create Job Categories table
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  name_ar TEXT,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default job categories
INSERT INTO job_categories (name, name_ar, icon, sort_order) VALUES
  ('Nanny', 'جليسة أطفال', '👶', 1),
  ('Babysitter', 'مربية أطفال', '🍼', 2),
  ('Elderly Caregiver', 'مُرافِق كبار السن', '👴', 3),
  ('Driver', 'سائق', '🚗', 4),
  ('Cook', 'طباخ', '🍳', 5),
  ('House Manager', 'مدير منزل', '🏠', 6),
  ('Gardener', 'بستاني', '🌿', 7),
  ('Nurse', 'ممرض/ة', '💉', 8)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hires ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for users
CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- RLS policies for worker_profiles
CREATE POLICY "worker_profiles_select_all" ON worker_profiles FOR SELECT
  TO authenticated USING (is_visible = true OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "worker_profiles_insert_own" ON worker_profiles FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "worker_profiles_update_own" ON worker_profiles FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- RLS policies for employer_profiles
CREATE POLICY "employer_profiles_select_all" ON employer_profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "employer_profiles_insert_own" ON employer_profiles FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "employer_profiles_update_own" ON employer_profiles FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- RLS policies for documents
CREATE POLICY "documents_select_own" ON documents FOR SELECT
  TO authenticated USING (worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "documents_insert_own" ON documents FOR INSERT
  TO authenticated WITH CHECK (worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()));

-- RLS policies for experiences
CREATE POLICY "experiences_select_own" ON experiences FOR SELECT
  TO authenticated USING (worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "experiences_insert_own" ON experiences FOR INSERT
  TO authenticated WITH CHECK (worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()));

-- RLS policies for hires
CREATE POLICY "hires_select_own" ON hires FOR SELECT
  TO authenticated USING (employer_id = auth.uid() OR worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "hires_insert_employer" ON hires FOR INSERT
  TO authenticated WITH CHECK (employer_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "hires_update_own" ON hires FOR UPDATE
  TO authenticated USING (employer_id = auth.uid() OR worker_id IN (SELECT id FROM worker_profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- RLS policies for messages
CREATE POLICY "messages_select_own" ON messages FOR SELECT
  TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_insert_own" ON messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  TO authenticated USING (receiver_id = auth.uid());

-- RLS policies for reviews
CREATE POLICY "reviews_select_all" ON reviews FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "reviews_insert_employer" ON reviews FOR INSERT
  TO authenticated WITH CHECK (employer_id = auth.uid());

-- RLS policies for notifications
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (user_id = auth.uid());

-- RLS policies for complaints
CREATE POLICY "complaints_select_own" ON complaints FOR SELECT
  TO authenticated USING (complainant_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

CREATE POLICY "complaints_insert_authenticated" ON complaints FOR INSERT
  TO authenticated WITH CHECK (complainant_id = auth.uid());

CREATE POLICY "complaints_update_admin" ON complaints FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- RLS policies for payment_settings
CREATE POLICY "payment_settings_select_all" ON payment_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "payment_settings_modify_admin" ON payment_settings FOR ALL
  TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- RLS policies for job_categories
CREATE POLICY "job_categories_select_all" ON job_categories FOR SELECT
  TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_category ON worker_profiles(category);
CREATE INDEX IF NOT EXISTS idx_hires_employer ON hires(employer_id);
CREATE INDEX IF NOT EXISTS idx_hires_worker ON hires(worker_id);
CREATE INDEX IF NOT EXISTS idx_hires_status ON hires(status);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);