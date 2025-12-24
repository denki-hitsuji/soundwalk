-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.act_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  act_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  created_by_profile_id uuid NOT NULL,
  role text,
  grant_admin boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  is_revoked boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT act_invites_pkey PRIMARY KEY (id),
  CONSTRAINT act_invites_act_id_fkey FOREIGN KEY (act_id) REFERENCES public.acts(id),
  CONSTRAINT act_invites_created_by_profile_id_fkey FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.act_members (
  act_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  role text,
  is_admin boolean NOT NULL DEFAULT false,
  status text DEFAULT 'active'::text,
  CONSTRAINT act_members_pkey PRIMARY KEY (act_id, profile_id),
  CONSTRAINT act_members_act_id_fkey FOREIGN KEY (act_id) REFERENCES public.acts(id),
  CONSTRAINT act_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.act_songs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  act_id uuid NOT NULL,
  title text NOT NULL,
  memo text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT act_songs_pkey PRIMARY KEY (id),
  CONSTRAINT act_songs_act_id_fkey FOREIGN KEY (act_id) REFERENCES public.acts(id)
);
CREATE TABLE public.acts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  act_type text NOT NULL DEFAULT 'solo'::text,
  owner_profile_id uuid NOT NULL,
  description text,
  icon_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_temporary boolean NOT NULL DEFAULT false,
  photo_url text,
  profile_link_url text,
  CONSTRAINT acts_pkey PRIMARY KEY (id),
  CONSTRAINT acts_owner_profile_id_fkey FOREIGN KEY (owner_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  musician_id uuid NOT NULL,
  venue_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'upcoming'::booking_status,
  fee integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT bookings_musician_id_fkey FOREIGN KEY (musician_id) REFERENCES public.musicians(id),
  CONSTRAINT bookings_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.event_acts (
  event_id uuid NOT NULL,
  act_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'invited'::text,
  sort_order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT event_acts_pkey PRIMARY KEY (event_id, act_id),
  CONSTRAINT event_acts_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_acts_act_id_fkey FOREIGN KEY (act_id) REFERENCES public.acts(id)
);
CREATE TABLE public.event_organizers (
  event_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  role_label text,
  is_primary boolean NOT NULL DEFAULT false,
  CONSTRAINT event_organizers_pkey PRIMARY KEY (event_id, profile_id),
  CONSTRAINT event_organizers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_organizers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL,
  title text NOT NULL,
  event_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'open'::event_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  max_artists integer NOT NULL DEFAULT 1,
  organizer_profile_id uuid NOT NULL,
  open_time time without time zone,
  charge integer,
  conditions text,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id),
  CONSTRAINT events_organizer_profile_id_fkey FOREIGN KEY (organizer_profile_id) REFERENCES auth.users(id)
);
CREATE TABLE public.musician_performances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  act_id uuid,
  event_date date NOT NULL,
  open_time time without time zone,
  start_time time without time zone,
  venue_name text,
  venue_id uuid,
  memo text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT musician_performances_pkey PRIMARY KEY (id),
  CONSTRAINT musician_performances_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT musician_performances_act_id_fkey FOREIGN KEY (act_id) REFERENCES public.acts(id),
  CONSTRAINT musician_performances_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id)
);
CREATE TABLE public.musicians (
  id uuid NOT NULL,
  genre text,
  volume USER-DEFINED,
  area text,
  min_fee integer,
  sample_video_url text,
  bio text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT musicians_pkey PRIMARY KEY (id),
  CONSTRAINT musicians_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  act_id uuid NOT NULL,
  from_profile_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT offers_act_id_fkey FOREIGN KEY (act_id) REFERENCES public.acts(id),
  CONSTRAINT offers_from_profile_id_fkey FOREIGN KEY (from_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.performance_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  performance_id uuid NOT NULL,
  file_url text NOT NULL,
  file_path text,
  file_type text NOT NULL DEFAULT 'flyer'::text,
  caption text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT performance_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT performance_attachments_performance_id_fkey FOREIGN KEY (performance_id) REFERENCES public.musician_performances(id)
);
CREATE TABLE public.performance_details (
  performance_id uuid NOT NULL,
  load_in_time time without time zone,
  set_start_time time without time zone,
  set_end_time time without time zone,
  set_minutes integer,
  customer_charge_yen integer,
  one_drink_required boolean,
  notes text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT performance_details_pkey PRIMARY KEY (performance_id),
  CONSTRAINT performance_details_performance_id_fkey FOREIGN KEY (performance_id) REFERENCES public.musician_performances(id)
);
CREATE TABLE public.performance_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  performance_id uuid NOT NULL,
  body text NOT NULL,
  source text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT performance_messages_pkey PRIMARY KEY (id),
  CONSTRAINT performance_messages_performance_id_fkey FOREIGN KEY (performance_id) REFERENCES public.musician_performances(id)
);
CREATE TABLE public.performance_prep_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  performance_id uuid NOT NULL,
  task_key text NOT NULL,
  act_id uuid,
  due_date date NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  done_at timestamp with time zone,
  done_by_profile_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT performance_prep_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT performance_prep_tasks_performance_id_fkey FOREIGN KEY (performance_id) REFERENCES public.musician_performances(id),
  CONSTRAINT performance_prep_tasks_act_id_fkey FOREIGN KEY (act_id) REFERENCES public.acts(id),
  CONSTRAINT performance_prep_tasks_done_by_profile_id_fkey FOREIGN KEY (done_by_profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED DEFAULT 'musician'::user_role,
  display_name text NOT NULL DEFAULT '（未設定）'::text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.venue_admins (
  venue_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  role text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_admins_pkey PRIMARY KEY (venue_id, profile_id),
  CONSTRAINT venue_admins_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id),
  CONSTRAINT venue_admins_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.venue_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  act_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT venue_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT venue_bookings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT venue_bookings_act_id_fkey FOREIGN KEY (act_id) REFERENCES public.acts(id)
);
CREATE TABLE public.venue_collaborators (
  venue_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  can_create_events boolean NOT NULL DEFAULT true,
  can_edit_events boolean NOT NULL DEFAULT true,
  CONSTRAINT venue_collaborators_pkey PRIMARY KEY (venue_id, profile_id),
  CONSTRAINT venue_collaborators_venue_id_fkey FOREIGN KEY (venue_id) REFERENCES public.venues(id),
  CONSTRAINT venue_collaborators_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  capacity integer,
  volume_preference USER-DEFINED,
  has_pa boolean DEFAULT false,
  photo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  short_name text,
  city text,
  prefecture text,
  url text,
  notes text,
  latitude double precision,
  longitude double precision,
  zip_code character varying,
  CONSTRAINT venues_pkey PRIMARY KEY (id)
);