
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config(); // Assumes .env is in the project root when run from project root

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for backend operations

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Role Key are required!');
}

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const bucketsToCreate = [
  'products',
  'categories',
  'banners',
  'blog',
  'logos',
  'documents',
  'avatars',
  'site-assets',
];

async function setupStorage() {
  console.log('Starting Supabase Storage setup...');

  for (const bucketName of bucketsToCreate) {
    try {
      // Check if bucket already exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) throw listError;

      const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);

      if (bucketExists) {
        console.log(`Bucket '${bucketName}' already exists. Skipping creation.`);
      } else {
        const { data, error } = await supabase.storage.createBucket(bucketName, {
          public: true, // Default to public, policies will refine this
        });
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`Bucket '${bucketName}' already exists. Skipping creation.`);
          } else {
            throw error;
          }
        } else {
          console.log(`Bucket '${bucketName}' created successfully.`);
        }
      }
    } catch (error) {
      console.error(`Error setting up bucket '${bucketName}':`, error);
      process.exit(1);
    }
  }
  console.log('Supabase Storage setup complete.');
}

setupStorage();
