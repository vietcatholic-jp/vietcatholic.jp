#!/bin/bash

# Script to apply the registration status migration
# Run this from the project root directory

echo "🚀 Applying registration status migration..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in a supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run from project root."
    exit 1
fi

echo "📊 Current migration status:"
supabase migration list

echo ""
echo "🔄 Applying new migration..."
supabase db push

echo ""
echo "✅ Migration completed!"
echo ""
echo "🔍 You can verify the changes by:"
echo "  1. Checking the registrations table: supabase db inspect"
echo "  2. Or running: supabase sql --db-url 'SELECT unnest(enum_range(NULL::registration_status)) as status;'"
echo ""
echo "📝 The old 'paid' status has been automatically migrated to 'confirm_paid'"
