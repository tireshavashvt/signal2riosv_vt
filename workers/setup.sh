#!/bin/bash
# Setup script for Signal RIOSV Cloudflare Worker
# Run from the workers/ directory

set -e

echo "==================================="
echo "Signal RIOSV Worker Setup"
echo "==================================="
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Installing wrangler..."
    npm install -g wrangler
fi

# Login to Cloudflare
echo "Step 1: Login to Cloudflare"
echo "-----------------------------------"
wrangler login

# Create KV namespace
echo ""
echo "Step 2: Creating KV namespace..."
echo "-----------------------------------"
KV_OUTPUT=$(wrangler kv:namespace create "PENDING_SIGNALS" 2>&1)
echo "$KV_OUTPUT"

# Extract KV ID from output
KV_ID=$(echo "$KV_OUTPUT" | grep -oP 'id = "\K[^"]+' || true)

if [ -n "$KV_ID" ]; then
    echo ""
    echo "KV namespace created with ID: $KV_ID"
    echo ""
    echo "Updating wrangler.toml with KV ID..."
    sed -i "s/YOUR_KV_NAMESPACE_ID/$KV_ID/g" wrangler.toml
    echo "Done!"
else
    echo ""
    echo "Could not extract KV ID automatically."
    echo "Please manually update wrangler.toml with the ID shown above."
fi

# Create preview KV namespace (for local development)
echo ""
echo "Step 3: Creating preview KV namespace..."
echo "-----------------------------------"
PREVIEW_OUTPUT=$(wrangler kv:namespace create "PENDING_SIGNALS" --preview 2>&1)
echo "$PREVIEW_OUTPUT"

PREVIEW_ID=$(echo "$PREVIEW_OUTPUT" | grep -oP 'id = "\K[^"]+' || true)

if [ -n "$PREVIEW_ID" ]; then
    sed -i "s/YOUR_KV_PREVIEW_ID/$PREVIEW_ID/g" wrangler.toml
    echo "Preview KV ID updated!"
fi

# Set secrets
echo ""
echo "Step 4: Setting secrets..."
echo "-----------------------------------"
echo ""
echo "You'll need to enter your Turnstile Secret Key."
echo "(Get it from: https://dash.cloudflare.com → Turnstile → Your site → Settings)"
echo ""
wrangler secret put TURNSTILE_SECRET_KEY

echo ""
echo "Now enter your Postal API Key."
echo "(Get it from your Postal server admin panel)"
echo ""
wrangler secret put POSTAL_API_KEY

# Deploy
echo ""
echo "Step 5: Deploying worker..."
echo "-----------------------------------"
wrangler deploy

echo ""
echo "==================================="
echo "Setup complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Go to Cloudflare Dashboard → Turnstile"
echo "2. Create a new site and copy the Site Key"
echo "3. Update YOUR_TURNSTILE_SITE_KEY in index.html"
echo "4. Update POSTAL_API_URL in wrangler.toml"
echo "5. Set up a route in Cloudflare to point /api/* to your worker"
echo ""
