#!/bin/bash
# Verify CSP script-src hashes match the inline scripts in built HTML
# Usage: npm run build && ./scripts/verify-csp-hashes.sh

set -e

BUILD_DIR="dist"
HEADERS_FILE="public/_headers"

if [ ! -d "$BUILD_DIR" ]; then
  echo "Error: Build directory '$BUILD_DIR' not found. Run 'npm run build' first."
  exit 1
fi

if [ ! -f "$HEADERS_FILE" ]; then
  echo "Error: Headers file '$HEADERS_FILE' not found."
  exit 1
fi

echo "Extracting inline script hashes from built HTML..."

# Use Python to extract scripts and compute hashes
ACTUAL_HASHES=$(python3 << 'EOF'
import re
import hashlib
import base64
import glob

# Find the first HTML file in dist
html_files = glob.glob('dist/**/*.html', recursive=True)
if not html_files:
    print("ERROR: No HTML files found in dist/", file=sys.stderr)
    exit(1)

html_file = html_files[0]

with open(html_file, 'r') as f:
    html = f.read()

# Find all inline scripts
scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)

# Compute SHA-256 hashes
for script in scripts:
    sha256 = hashlib.sha256(script.encode('utf-8')).digest()
    hash_b64 = base64.b64encode(sha256).decode('utf-8')
    print(f"sha256-{hash_b64}")
EOF
)

if [ -z "$ACTUAL_HASHES" ]; then
  echo "Error: Failed to extract script hashes"
  exit 1
fi

echo "Actual script hashes from HTML:"
echo "$ACTUAL_HASHES"
echo ""

# Extract CSP hashes from _headers
CSP_HASHES=$(grep -oP "'sha256-[^']+'" "$HEADERS_FILE" | grep -v cloudflare || true)

echo "CSP hashes from $HEADERS_FILE:"
echo "$CSP_HASHES" | tr -d "'"
echo ""

# Compare
ACTUAL_COUNT=$(echo "$ACTUAL_HASHES" | wc -l)
CSP_COUNT=$(echo "$CSP_HASHES" | wc -l)

if [ "$ACTUAL_COUNT" -ne "$CSP_COUNT" ]; then
  echo "❌ Hash count mismatch: $ACTUAL_COUNT actual vs $CSP_COUNT in CSP"
  exit 1
fi

# Check if all actual hashes are in CSP
MISSING=0
while IFS= read -r hash; do
  if ! echo "$CSP_HASHES" | grep -q "$hash"; then
    echo "❌ Missing hash in CSP: $hash"
    MISSING=1
  fi
done <<< "$ACTUAL_HASHES"

if [ "$MISSING" -eq 1 ]; then
  echo ""
  echo "To fix, update the script-src hashes in $HEADERS_FILE with:"
  echo "$ACTUAL_HASHES"
  exit 1
fi

echo "✅ All CSP hashes match inline scripts!"
