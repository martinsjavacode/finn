import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

export const supabase = createClient<Database>(
  'https://vostvqmciovjyiilzhuq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvc3R2cW1jaW92anlpaWx6aHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NDIzNTQsImV4cCI6MjA5NTIxODM1NH0.kWPeRQ7svlQU_6Q37jIGTUfIb77nVfWSwM8-h_DEw1o'
)
