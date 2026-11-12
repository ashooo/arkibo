$ErrorActionPreference = 'Stop'

$now = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(8))
$nextRun = [DateTimeOffset]::new($now.Year, $now.Month, $now.Day, 7, 0, 0, $now.Offset)
if ($nextRun -le $now) { $nextRun = $nextRun.AddDays(1) }

$node = (Get-Command node.exe).Source
$project = Split-Path -Parent $PSScriptRoot
$script = Join-Path $PSScriptRoot 'import-announcements.mjs'
$logDir = Join-Path $project 'data/announcement-import'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$log = Join-Path $logDir 'sync.log'
$command = "& '" + $node.Replace("'", "''") + "' --use-system-ca '" + $script.Replace("'", "''") +
  "' *>> '" + $log.Replace("'", "''") + "'; exit " + '$LASTEXITCODE'
$encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -EncodedCommand $encoded" -WorkingDirectory $project
$trigger = New-ScheduledTaskTrigger -Daily -At $nextRun.LocalDateTime
$trigger.StartBoundary = $nextRun.ToString('yyyy-MM-ddTHH:mm:sszzz')
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName 'ScholarReady Announcement Import' -Action $action -Trigger $trigger -Settings $settings |
  Out-Null
Write-Output "Scheduled daily at 7:00 AM Philippine time. Log: $log"
