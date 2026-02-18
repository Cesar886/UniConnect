env.local 

 NEXT_PUBLIC_SUPABASE_URL=https://euvzuxmgiirdulceedfz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dnp1eG1naWlyZHVsY2VlZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODA3NzgsImV4cCI6MjA4Njg1Njc3OH0.m3imMkZirVOJ9yWxN61PCSF0RdIXB24BPptAACreXx4


-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.matches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  user_1 uuid NOT NULL,
  user_2 uuid NOT NULL,
  CONSTRAINT matches_pkey PRIMARY KEY (id),
  CONSTRAINT matches_user_1_fkey FOREIGN KEY (user_1) REFERENCES public.profiles(id),
  CONSTRAINT matches_user_2_fkey FOREIGN KEY (user_2) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  match_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_match_id_fkey FOREIGN KEY (match_id) REFERENCES public.matches(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  bio text,
  carrera text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.swipes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  swiper_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  is_like boolean NOT NULL,
  CONSTRAINT swipes_pkey PRIMARY KEY (id),
  CONSTRAINT swipes_swiper_id_fkey FOREIGN KEY (swiper_id) REFERENCES public.profiles(id),
  CONSTRAINT swipes_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id)
);