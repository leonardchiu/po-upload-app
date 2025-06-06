import { createClient } from './supabase'

// This script helps set up storage policies for the purchase-orders bucket
// Run this once to configure your Supabase storage

export async function setupStoragePolicies() {
  const supabase = createClient()
  
  console.log('Setting up storage policies for purchase-orders bucket...')
  
  // Note: These policies need to be created through the Supabase dashboard
  // This file documents the required policies:
  
  const policies = {
    allowAnonUploads: {
      name: 'Allow anonymous uploads',
      operation: 'INSERT',
      roles: ['anon'],
      definition: 'true',
      check: 'true'
    },
    allowAnonRead: {
      name: 'Allow anonymous reads',
      operation: 'SELECT', 
      roles: ['anon'],
      definition: 'true'
    },
    allowAnonDelete: {
      name: 'Allow anonymous deletes',
      operation: 'DELETE',
      roles: ['anon'],
      definition: 'true'
    }
  }
  
  console.log(`
To set up your storage bucket properly:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to Storage in the left sidebar
4. Create a new bucket called "purchase-orders" if it doesn't exist
5. Click on the bucket name to view details
6. Go to the "Policies" tab
7. If RLS is enabled, either:
   
   Option A (Easier for development):
   - Click "Disable RLS" to allow all operations
   
   Option B (More secure):
   - Click "New Policy"
   - Use the "For full customization" template
   - Add these policies:
   
   ${JSON.stringify(policies, null, 2)}
   
8. Make sure the bucket is set to "Public" if you want to access files via URL
`)
}

// SQL commands to run in Supabase SQL editor (optional):
export const storagePolicySQL = `
-- Allow anonymous users to upload files
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'purchase-orders');

-- Allow anonymous users to view files  
CREATE POLICY "Allow anonymous downloads" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'purchase-orders');

-- Allow anonymous users to delete their own files (optional)
CREATE POLICY "Allow anonymous deletes" ON storage.objects
FOR DELETE TO anon
USING (bucket_id = 'purchase-orders');
`