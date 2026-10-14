import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

import dotenv from 'dotenv';
dotenv.config();

import { registerCompatRoutes } from './server/compatRoutes';
import type { Database } from './types/supabase';


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL and Service Role Key are required for server admin operations.');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const app = express();
const PORT = process.env.PORT || 3001;
const SERVER_STARTED_AT = new Date().toISOString();
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Authorization-Customer');

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(isAllowed ? 204 : 403);
  }

  if (!isAllowed) {
    return res.status(403).json({ error: 'Origin non autorisee.' });
  }

  next();
});

// Increase request size limit to support Base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/version', (_req, res) => {
  res.json({
    startedAt: SERVER_STARTED_AT,
    commit:
      process.env.RENDER_GIT_COMMIT ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT ||
      null,
    branch: process.env.RENDER_GIT_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || null,
    service: process.env.RENDER_SERVICE_NAME || null,
    node: process.version,
  });
});

// Compatibility layer that maps the current Supabase schema to the app contract.
registerCompatRoutes(app, supabase, supabaseAdmin);

// VITE MIDDLEWARE INTERPOLATOR Setup
async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: Number(process.env.PORT) || 3001, // Ensure Vite also uses the specified port
        strictPort: true,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Herve_eShop Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
