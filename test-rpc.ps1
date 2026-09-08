$legacyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcGxid2NtY2ZidmVobndibm13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjIwMzIsImV4cCI6MjEwMjY5ODAzMn0.JU6dOWxNuxYvuxJTo7jM2bQdhE3-NZUsRekdJJr-DC0'
$serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcGxid2NtY2ZidmVobndibm13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzEyMjAzMiwiZXhwIjoyMTAyNjk4MDMyfQ.VPBdeOCrBdTPDRsn-YG8kbDImRBlKreMyPJzidR-gcY'
$base = 'https://dqplbwcmcfbvehnwbnmw.supabase.co'

Write-Output "=== businesses (service role, bypass RLS) ==="
$biz = Invoke-RestMethod -Uri "$base/rest/v1/businesses?select=id,slug,plan,trial_ends_at,nom&limit=10" -Headers @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey" }
$biz | ConvertTo-Json

Write-Output "=== services for first business ==="
if ($biz.Count -gt 0) {
  $svc = Invoke-RestMethod -Uri "$base/rest/v1/services?select=id,nom,actif,date_fin&business_id=eq.$($biz[0].id)&limit=5" -Headers @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey" }
  $svc | ConvertTo-Json
}

function Test-Booking($label, $slug, $serviceId) {
  Write-Output "=== creer_reservation_publique anon: $label ($slug) ==="
  $body = @{
    p_slug = $slug
    p_service_id = $serviceId
    p_date = "2026-09-10"
    p_heure = "10:00:00"
    p_client_nom = "Test Audit"
    p_client_telephone = "+243900000000"
  } | ConvertTo-Json
  $tmpFile = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmpFile, $body)
  curl.exe -s -w "`nHTTP_STATUS:%{http_code}`n" -X POST "$base/rest/v1/rpc/creer_reservation_publique" -H "apikey: $legacyKey" -H "Authorization: Bearer $legacyKey" -H "Content-Type: application/json" --data-binary "@$tmpFile"
  Remove-Item $tmpFile
}

Test-Booking "jengatech" "jengatech" $svc.id

$rj = Invoke-RestMethod -Uri "$base/rest/v1/services?select=id,nom,actif,date_fin&business_id=eq.ca319aa6-412f-4961-b3b1-290b5308806b&limit=5" -Headers @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey" }
$rj | ConvertTo-Json
if ($rj) { Test-Booking "rj-square" "rj-square" $rj[0].id

Write-Output "=== reminder_logs actual columns (OpenAPI schema via service_role) ==="
$schema = Invoke-RestMethod -Uri "$base/rest/v1/" -Headers @{ apikey = $serviceKey; Authorization = "Bearer $serviceKey" }
$schema.definitions.reminder_logs.properties.PSObject.Properties.Name -join ", "
Write-Output "=== full reminder_logs schema definition ==="
$schema.definitions.reminder_logs.properties | ConvertTo-Json -Depth 10
 }


