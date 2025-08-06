# Google Cloud Function BigQuery ML Surf Predictor - Pt Reyes Buoy Offline Issue

## Problem Summary
The CDIP Pt Reyes buoy (station 029) is currently offline for maintenance (as of July 28, 2025) and will be back online within a week. This impacts the surf prediction ML model which may expect Pt Reyes buoy data as input features.

## Current Frontend Behavior  
The frontend surf prediction API (`/api/surf-predictor`) conditionally includes Pt Reyes data:
- When Pt Reyes buoy is **online**: Sends `pt_reyes_height`, `pt_reyes_period`, `pt_reyes_direction` fields
- When Pt Reyes buoy is **offline**: Omits these fields entirely from the conditions object

## Example API Calls

### When Pt Reyes is Online:
```json
{
  "sf_bar_height": "3.08", 
  "sf_bar_period": 14.29,
  "sf_bar_direction": 241,
  "wind_category": "light",
  "size_category": "knee_high", 
  "tide_category": "mid_ebb",
  "pt_reyes_height": "2.85",
  "pt_reyes_period": 12.5,
  "pt_reyes_direction": 255
}
```

### When Pt Reyes is Offline (Current State):
```json
{
  "sf_bar_height": "3.08",
  "sf_bar_period": 14.29, 
  "sf_bar_direction": 241,
  "wind_category": "light",
  "size_category": "knee_high",
  "tide_category": "mid_ebb"
  // No pt_reyes_* fields
}
```

## Required Cloud Function Updates

Please update the BigQuery ML surf predictor Cloud Function to:

1. **Handle Missing Pt Reyes Fields**: Make the `pt_reyes_height`, `pt_reyes_period`, and `pt_reyes_direction` fields optional in the input schema
2. **Provide Default Values**: When Pt Reyes fields are missing, use appropriate defaults or NULL values for the ML model
3. **Maintain Prediction Quality**: Ensure the model can still generate meaningful predictions using only SF Bar buoy data
4. **Error Handling**: Return graceful predictions rather than errors when Pt Reyes data is unavailable
5. **Logging**: Add logging to track when predictions are made with partial data

## Expected Behavior
- The Cloud Function should continue to work normally when Pt Reyes data is missing
- Prediction confidence may be lower but should still be meaningful
- No 500 errors or prediction failures due to missing buoy data
- When Pt Reyes comes back online, it should automatically use the additional data again

## Testing
Test with both payload formats above to ensure:
- Predictions work with complete data (all buoys online)
- Predictions work with partial data (Pt Reyes offline) 
- Response format remains consistent
- Confidence scores reflect data availability

This is a temporary issue lasting approximately one week while the buoy undergoes maintenance.