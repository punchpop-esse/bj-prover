import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabaseUrl = 'https://zjdsuskuifeskybjyudd.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqZHN1c2t1aWZlc2t5Ymp5dWRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMzg2ODYsImV4cCI6MjA2NTYxNDY4Nn0.Fatc2g740vZA8wiEyH7gB_YPxkKAG8bXNbXZ1PqEnfk'
export const supabase = createClient(supabaseUrl, supabaseKey)