# Vercel Deployment Guide

## Environment Variables Setup

The application requires the following environment variables to be set in Vercel:

### Required Variables:
1. `VITE_SUPABASE_URL` = `https://wjpcfsjtjgxvhijczxnj.supabase.co`
2. `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcGNmc2p0amd4dmhpamN6eG5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzMDYxOTcsImV4cCI6MjA2NTg4MjE5N30.TRMV3BrHkCKH-7RYFD6rGLdYq1kxUqZYQr3uD-WaPy0`

## Setup Instructions:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the above variables for Production, Preview, and Development environments
4. Redeploy the application

## Current Issues:
- White screen due to missing Supabase environment variables
- Console errors: "Supabase環境変数が設定されていません"

## Solution:
Set the environment variables in Vercel dashboard and trigger a new deployment.