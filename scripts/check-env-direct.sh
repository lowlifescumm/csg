#!/bin/bash
# Quick script to check OAuth environment variables on Render server
# Run this directly on the Render server

echo "=== OAuth Environment Variables Check ==="
echo ""

echo "NEXTAUTH_URL:"
if [ -z "$NEXTAUTH_URL" ]; then
  echo "  ❌ NOT SET"
else
  echo "  Value: $NEXTAUTH_URL"
  if [ "$NEXTAUTH_URL" = "https://cosmicspiritguide.com" ]; then
    echo "  ✅ Correct"
  else
    echo "  ❌ Should be: https://cosmicspiritguide.com"
  fi
fi
echo ""

echo "GOOGLE_CLIENT_ID:"
if [ -z "$GOOGLE_CLIENT_ID" ]; then
  echo "  ❌ NOT SET"
else
  echo "  Value: ${GOOGLE_CLIENT_ID:0:30}..."
  if [[ "$GOOGLE_CLIENT_ID" == *".apps.googleusercontent.com"* ]]; then
    echo "  ✅ Valid format"
  else
    echo "  ❌ Invalid format (should contain .apps.googleusercontent.com)"
  fi
fi
echo ""

echo "GOOGLE_CLIENT_SECRET:"
if [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "  ❌ NOT SET"
else
  echo "  Value: ${GOOGLE_CLIENT_SECRET:0:10}... (hidden)"
  if [ ${#GOOGLE_CLIENT_SECRET} -lt 20 ]; then
    echo "  ⚠️  Seems too short"
  else
    echo "  ✅ Set"
  fi
fi
echo ""

echo "NEXTAUTH_SECRET:"
if [ -z "$NEXTAUTH_SECRET" ]; then
  echo "  ❌ NOT SET"
else
  echo "  Value: ${NEXTAUTH_SECRET:0:10}... (hidden)"
  if [ ${#NEXTAUTH_SECRET} -lt 32 ]; then
    echo "  ⚠️  Should be at least 32 characters"
  else
    echo "  ✅ Set"
  fi
fi
echo ""

echo "JWT_SECRET:"
if [ -z "$JWT_SECRET" ]; then
  echo "  ❌ NOT SET"
else
  echo "  ✅ Set"
fi
echo ""

echo "=== Expected OAuth Callback URL ==="
if [ -z "$NEXTAUTH_URL" ]; then
  echo "  Cannot determine (NEXTAUTH_URL not set)"
else
  echo "  Expected: https://cosmicspiritguide.com/api/auth/callback/google"
  echo "  Actual:   $NEXTAUTH_URL/api/auth/callback/google"
  if [ "$NEXTAUTH_URL" = "https://cosmicspiritguide.com" ]; then
    echo "  ✅ Matches"
  else
    echo "  ❌ Mismatch"
  fi
fi
echo ""













