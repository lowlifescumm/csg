#!/bin/bash

# Test Script for Template Engine (curl-based)
# 
# Usage:
#   ./scripts/test-template-curl.sh <templateId> <baseUrl>
#
# Or set environment variables:
#   TEMPLATE_ID=<id> BASE_URL=<url> ./scripts/test-template-curl.sh

set -e

TEMPLATE_ID=${TEMPLATE_ID:-${1}}
BASE_URL=${BASE_URL:-${2:-"http://localhost:5000"}}

if [ -z "$TEMPLATE_ID" ]; then
  echo "❌ Error: Template ID required"
  echo "Usage: ./scripts/test-template-curl.sh <templateId> [baseUrl]"
  echo "Or set: TEMPLATE_ID=<id> BASE_URL=<url> ./scripts/test-template-curl.sh"
  exit 1
fi

echo "🧪 Template Engine Test Suite (curl)"
echo "═══════════════════════════════════════════════════════════"
echo "Base URL: $BASE_URL"
echo "Template ID: $TEMPLATE_ID"
echo "═══════════════════════════════════════════════════════════"

# Sample payload
PAYLOAD='{
  "name": "Test User",
  "birthDate": "1990-01-01",
  "birthTime": "12:00",
  "location": "New York, NY",
  "report_type": "ESSENTIAL",
  "data": {
    "birth_chart_data": {
      "birth_date": "1990-01-01",
      "birth_time": "12:00",
      "location": "New York, NY"
    }
  }
}'

# Test 1: Single Report
echo ""
echo "📋 Test 1: Single Report Generation"
echo "───────────────────────────────────────────────────────────"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${BASE_URL}/api/admin/test-report?engine=template&templateId=${TEMPLATE_ID}" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  PDF_URL=$(echo "$BODY" | jq -r '.pdfUrl // empty')
  if [ -n "$PDF_URL" ] && [ "$PDF_URL" != "null" ]; then
    echo "✅ Success"
    echo "   PDF URL: $PDF_URL"
    echo "   Engine: $(echo "$BODY" | jq -r '.metadata.engine // "template"')"
    TEST1_SUCCESS=true
  else
    echo "❌ Failed: No PDF URL in response"
    echo "   Response: $BODY"
    TEST1_SUCCESS=false
  fi
else
  echo "❌ Failed: HTTP $HTTP_CODE"
  echo "   Response: $BODY"
  TEST1_SUCCESS=false
fi

# Test 2: Puppeteer Engine
echo ""
echo "📋 Test 2: Puppeteer Engine (Backward Compatibility)"
echo "───────────────────────────────────────────────────────────"
RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST \
  "${BASE_URL}/api/admin/test-report?engine=puppeteer" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | sed '$d')

if [ "$HTTP_CODE2" -eq 200 ]; then
  PDF_URL2=$(echo "$BODY2" | jq -r '.pdfUrl // empty')
  if [ -n "$PDF_URL2" ] && [ "$PDF_URL2" != "null" ]; then
    echo "✅ Success"
    echo "   PDF URL: $PDF_URL2"
    echo "   Engine: $(echo "$BODY2" | jq -r '.metadata.engine // "puppeteer"')"
    TEST2_SUCCESS=true
  else
    echo "❌ Failed: No PDF URL in response"
    echo "   Response: $BODY2"
    TEST2_SUCCESS=false
  fi
else
  echo "❌ Failed: HTTP $HTTP_CODE2"
  echo "   Response: $BODY2"
  TEST2_SUCCESS=false
fi

# Test 3: Performance Test (5 reports)
echo ""
echo "📋 Test 3: Performance Test (5 Reports)"
echo "───────────────────────────────────────────────────────────"
START_TIME=$(date +%s)
SUCCESS_COUNT=0

for i in {1..5}; do
  echo -n "   Generating report $i/5... "
  
  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
    "${BASE_URL}/api/admin/test-report?engine=template&templateId=${TEMPLATE_ID}" \
    -H "Content-Type: application/json" \
    -d "$(echo "$PAYLOAD" | jq --arg name "Test User $i" '.name = $name')")
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" -eq 200 ]; then
    PDF_URL=$(echo "$BODY" | jq -r '.pdfUrl // empty')
    if [ -n "$PDF_URL" ] && [ "$PDF_URL" != "null" ]; then
      echo "✅"
      SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
      echo "❌ (No PDF URL)"
    fi
  else
    echo "❌ (HTTP $HTTP_CODE)"
  fi
  
  # Small delay between requests
  if [ $i -lt 5 ]; then
    sleep 0.5
  fi
done

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo "   Summary:"
echo "   - Total: 5 reports"
echo "   - Successful: $SUCCESS_COUNT"
echo "   - Failed: $((5 - SUCCESS_COUNT))"
echo "   - Duration: ${DURATION}s"
echo "   - Average: $(echo "scale=2; $DURATION / 5" | bc)s per report"

if [ $SUCCESS_COUNT -eq 5 ]; then
  TEST3_SUCCESS=true
else
  TEST3_SUCCESS=false
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "═══════════════════════════════════════════════════════════"

if [ "$TEST1_SUCCESS" = true ]; then
  echo "✅ PASS - Single Report Generation"
else
  echo "❌ FAIL - Single Report Generation"
fi

if [ "$TEST2_SUCCESS" = true ]; then
  echo "✅ PASS - Puppeteer Engine (Backward Compatibility)"
else
  echo "❌ FAIL - Puppeteer Engine (Backward Compatibility)"
fi

if [ "$TEST3_SUCCESS" = true ]; then
  echo "✅ PASS - Performance Test (5 reports)"
else
  echo "❌ FAIL - Performance Test (5 reports)"
fi

echo "═══════════════════════════════════════════════════════════"

if [ "$TEST1_SUCCESS" = true ] && [ "$TEST2_SUCCESS" = true ] && [ "$TEST3_SUCCESS" = true ]; then
  echo "🎉 All tests passed!"
  exit 0
else
  echo "⚠️  Some tests failed. Please review the output above."
  exit 1
fi








