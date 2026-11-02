-- Minimal Auth dependency stub for testing the October 3 core schema only.
-- NEVER deploy this stub to Supabase or production.
create schema auth;
create table auth.users (id uuid primary key);
