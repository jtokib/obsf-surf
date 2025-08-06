# Prompts for External Projects

This folder contains documentation and prompts for fixing issues in related external projects.

## Files:

### `cloud-function-fix-prompt.md`
Prompt for the Google Cloud Functions team to handle Pt Reyes buoy offline scenarios in the BigQuery ML surf predictor. This addresses temporary buoy outages and ensures graceful handling of missing data.

### `surf-predictor-critical-bug-report.md` 
Critical bug report documenting that the Google Cloud Function completely ignores input data and returns hardcoded predictions. This needs immediate attention as all surf recommendations are currently meaningless.

## Usage:
Share these documents with the appropriate teams to resolve issues in the external surf prediction infrastructure.