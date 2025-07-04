import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gqtxqenhwfmqfrpyhwaq.supabase.co'; // Thay bằng URL thật
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxdHhxZW5od2ZtcWZycHlod2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NTY2NTEsImV4cCI6MjA2NzAzMjY1MX0.fY4xpEUXGWITWaCCqBYuuZbMtXYtdXNpwCK4ZBPhTKU'; // Thay bằng anon key thật

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 