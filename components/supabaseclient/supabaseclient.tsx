import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://noxahxtkajnilecfgemx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5veGFoeHRrYWpuaWxlY2ZnZW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2NDcxNzMsImV4cCI6MjA2NjIyMzE3M30.vCYDdboTSc5Xlz-CktxfHPuYjeF4HsIL-OQsf79-_z0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);