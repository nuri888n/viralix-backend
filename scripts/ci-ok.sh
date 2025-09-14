gh run list \
  --repo nuri888n/viralix-backend \
  --branch main \
  --workflow "CI Smoke + E2E" \
  --json databaseId,headSha,status,conclusion,createdAt \
  --jq '.[] | select(.conclusion=="success") | "\(.createdAt) ✅ \(.headSha)"' \
  | head -n 5
