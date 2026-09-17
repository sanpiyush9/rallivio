#!/bin/bash
set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD)
LOCAL_SHA=$(git rev-parse HEAD)
ALIAS="https://rallivio-git-$(echo "$BRANCH" | tr '/' '-')-san-eca6.vercel.app"

LIVE_SHA=$(curl -fsS "$ALIAS/api/version" | jq -r .sha)
LIVE_BRANCH=$(curl -fsS "$ALIAS/api/version" | jq -r .branch)

echo "Local:  $LOCAL_SHA"
echo "Live:   $LIVE_SHA"
echo "Branch: $LIVE_BRANCH"
echo "URL:    $ALIAS"

[ "$BRANCH" = "$LIVE_BRANCH" ] && [ "$LOCAL_SHA" = "$LIVE_SHA" ] && echo "✓ VERIFIED LIVE" || { echo "✗ NOT LIVE"; exit 1; }
