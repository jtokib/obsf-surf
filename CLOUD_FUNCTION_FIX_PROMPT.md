# Google Cloud Function BigQuery ML Surf Predictor - Complete Fix Prompt

## 🚨 Critical Issue
The surf-predictor Cloud Function at `https://us-central1-jtokib.cloudfunctions.net/surf-predictor` is currently broken and the website is using local fallback logic. The error message shows: **"Using fallback logic - Cloud Function needs repair"**.

## Current Problem Analysis

### Issues Identified:
1. **Cloud Function Failure**: The BigQuery ML prediction service is returning errors
2. **Missing Pt. Reyes Buoy Handling**: The function likely fails when Pt. Reyes buoy data is missing
3. **Input Schema Validation**: Rigid input requirements causing failures with variable buoy availability
4. **Error Handling**: Poor error responses leading to complete service failures

### Current Fallback Behavior:
The local Next.js API route (`/pages/api/surf-predictor.js`) contains comprehensive fallback surf scoring logic that works well, but users see the concerning message about needing repairs.

## 🛠️ Complete Cloud Function Fix Requirements

### 1. Input Schema Flexibility
**Problem**: Function expects fixed input schema but buoy availability varies
**Solution**: Make Pt. Reyes buoy fields optional

```python
# Handle variable input schema
def process_surf_conditions(conditions):
    # Required fields (SF Bar Buoy)
    sf_bar_height = float(conditions.get('sf_bar_height', 0))
    sf_bar_period = float(conditions.get('sf_bar_period', 0))
    sf_bar_direction = int(conditions.get('sf_bar_direction', 0))
    wind_category = conditions.get('wind_category', 'unknown')
    size_category = conditions.get('size_category', 'unknown')
    tide_category = conditions.get('tide_category', 'unknown')
    
    # Optional fields (Pt. Reyes Buoy - may be offline)
    pt_reyes_height = float(conditions.get('pt_reyes_height', 0)) if 'pt_reyes_height' in conditions else None
    pt_reyes_period = float(conditions.get('pt_reyes_period', 0)) if 'pt_reyes_period' in conditions else None
    pt_reyes_direction = int(conditions.get('pt_reyes_direction', 0)) if 'pt_reyes_direction' in conditions else None
    
    return {
        'sf_bar_height': sf_bar_height,
        'sf_bar_period': sf_bar_period,
        'sf_bar_direction': sf_bar_direction,
        'wind_category': wind_category,
        'size_category': size_category,
        'tide_category': tide_category,
        'pt_reyes_height': pt_reyes_height,
        'pt_reyes_period': pt_reyes_period,
        'pt_reyes_direction': pt_reyes_direction,
        'has_pt_reyes_data': pt_reyes_height is not None
    }
```

### 2. BigQuery ML Model Adaptation
**Problem**: ML model fails with missing features
**Solution**: Handle NULL values gracefully in BigQuery

```sql
-- Update BigQuery ML prediction query to handle NULLs
SELECT
  predicted_surf_quality,
  prediction_confidence,
  CASE 
    WHEN pt_reyes_height IS NULL THEN prediction_confidence * 0.85
    ELSE prediction_confidence
  END as adjusted_confidence
FROM
  ML.PREDICT(MODEL `your-project.surf_model.prediction_model`,
    (
      SELECT
        sf_bar_height,
        sf_bar_period,
        sf_bar_direction,
        wind_category,
        size_category,
        tide_category,
        -- Handle missing Pt. Reyes data
        IFNULL(pt_reyes_height, 0.0) as pt_reyes_height,
        IFNULL(pt_reyes_period, 0.0) as pt_reyes_period,  
        IFNULL(pt_reyes_direction, 270) as pt_reyes_direction,
        -- Add flag for data completeness
        CASE WHEN pt_reyes_height IS NOT NULL THEN 1 ELSE 0 END as has_complete_buoy_data
      FROM
        UNNEST([STRUCT<
          sf_bar_height FLOAT64,
          sf_bar_period FLOAT64,
          sf_bar_direction INT64,
          wind_category STRING,
          size_category STRING,
          tide_category STRING,
          pt_reyes_height FLOAT64,
          pt_reyes_period FLOAT64,
          pt_reyes_direction INT64
        >(?, ?, ?, ?, ?, ?, ?, ?, ?)])
    )
  )
```

### 3. Enhanced Error Handling
**Problem**: Function crashes on invalid inputs or missing data
**Solution**: Comprehensive error handling with graceful degradation

```python
import logging
from google.cloud import bigquery
import functions_framework

@functions_framework.http
def surf_predictor(request):
    # Enable CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return ('', 200, headers)
        
    if request.method != 'POST':
        return ({'error': 'Method not allowed'}, 405, headers)
    
    try:
        # Parse and validate input
        conditions = request.get_json(force=True)
        if not conditions:
            raise ValueError("No conditions data provided")
            
        # Process conditions with flexibility
        processed_conditions = process_surf_conditions(conditions)
        
        # Generate prediction
        prediction_result = get_ml_prediction(processed_conditions)
        
        # Format response
        response = format_prediction_response(prediction_result, processed_conditions)
        
        logging.info(f"Successful prediction generated. Has Pt Reyes: {processed_conditions['has_pt_reyes_data']}")
        
        return (response, 200, headers)
        
    except Exception as e:
        logging.error(f"Prediction error: {str(e)}")
        
        # Fallback prediction using rule-based logic
        try:
            fallback_response = generate_fallback_prediction(conditions)
            fallback_response['note'] = 'Using fallback prediction due to ML service error'
            return (fallback_response, 200, headers)
        except:
            return ({
                'error': 'Prediction service unavailable',
                'timestamp': datetime.utcnow().isoformat(),
                'message': 'Unable to generate surf prediction'
            }, 503, headers)

def get_ml_prediction(conditions):
    """Get prediction from BigQuery ML with error handling"""
    client = bigquery.Client()
    
    # Prepare query parameters
    query = """
    SELECT
      predicted_surf_quality,
      prediction_confidence,
      CASE 
        WHEN @has_pt_reyes_data = false THEN prediction_confidence * 0.85
        ELSE prediction_confidence
      END as adjusted_confidence
    FROM
      ML.PREDICT(MODEL `your-project.surf_model.prediction_model`,
        (
          SELECT
            @sf_bar_height as sf_bar_height,
            @sf_bar_period as sf_bar_period,
            @sf_bar_direction as sf_bar_direction,
            @wind_category as wind_category,
            @size_category as size_category,
            @tide_category as tide_category,
            @pt_reyes_height as pt_reyes_height,
            @pt_reyes_period as pt_reyes_period,
            @pt_reyes_direction as pt_reyes_direction,
            @has_pt_reyes_data as has_complete_buoy_data
        )
      )
    """
    
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("sf_bar_height", "FLOAT", conditions['sf_bar_height']),
            bigquery.ScalarQueryParameter("sf_bar_period", "FLOAT", conditions['sf_bar_period']),
            bigquery.ScalarQueryParameter("sf_bar_direction", "INT64", conditions['sf_bar_direction']),
            bigquery.ScalarQueryParameter("wind_category", "STRING", conditions['wind_category']),
            bigquery.ScalarQueryParameter("size_category", "STRING", conditions['size_category']),
            bigquery.ScalarQueryParameter("tide_category", "STRING", conditions['tide_category']),
            bigquery.ScalarQueryParameter("pt_reyes_height", "FLOAT", conditions['pt_reyes_height'] or 0.0),
            bigquery.ScalarQueryParameter("pt_reyes_period", "FLOAT", conditions['pt_reyes_period'] or 0.0),
            bigquery.ScalarQueryParameter("pt_reyes_direction", "INT64", conditions['pt_reyes_direction'] or 270),
            bigquery.ScalarQueryParameter("has_pt_reyes_data", "BOOL", conditions['has_pt_reyes_data'])
        ]
    )
    
    query_job = client.query(query, job_config=job_config)
    results = query_job.result()
    
    for row in results:
        return {
            'predicted_quality': float(row.predicted_surf_quality),
            'confidence': float(row.adjusted_confidence),
            'has_complete_data': conditions['has_pt_reyes_data']
        }
        
    raise Exception("No prediction results returned from BigQuery ML")

def format_prediction_response(ml_result, conditions):
    """Format response to match expected frontend format"""
    confidence = ml_result['confidence']
    should_go = ml_result['predicted_quality'] > 0.6
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'target_datetime': datetime.utcnow().isoformat(),
        'conditions': conditions,
        'prediction': {
            'prediction': 1 if should_go else 0,
            'confidence': confidence,
            'recommendation': 'GO SURF!' if should_go else 'Poor conditions - skip this session'
        },
        'summary': {
            'should_go': should_go,
            'confidence_level': 'High' if confidence >= 0.7 else 'Medium' if confidence >= 0.4 else 'Low',
            'recommendation': 'GO SURF!' if should_go else 'Poor conditions - skip this session'
        },
        'data_completeness': {
            'has_sf_bar_data': True,
            'has_pt_reyes_data': ml_result['has_complete_data'],
            'note': 'Pt. Reyes buoy offline - using SF Bar data only' if not ml_result['has_complete_data'] else 'Complete buoy data available'
        }
    }
```

### 4. Fallback Prediction Logic
**Problem**: When ML completely fails, users get errors
**Solution**: Include rule-based fallback within the Cloud Function

```python
def generate_fallback_prediction(conditions):
    """Generate rule-based prediction when ML fails"""
    # Use the same logic as the Next.js fallback but in Python
    sf_bar_height = float(conditions.get('sf_bar_height', 0))
    sf_bar_period = float(conditions.get('sf_bar_period', 0))
    sf_bar_direction = int(conditions.get('sf_bar_direction', 0))
    wind_category = conditions.get('wind_category', 'unknown')
    
    score = 0
    issues = []
    
    # Wave size scoring
    if sf_bar_height < 1:
        score += 0.0
        issues.append("Too small")
    elif sf_bar_height < 2:
        score += 0.1
    elif sf_bar_height < 4:
        score += 0.25
    elif sf_bar_height < 7:
        score += 0.3
    else:
        score += 0.15
        issues.append("Very large")
    
    # Period scoring
    if sf_bar_period < 8:
        score += 0.05
        issues.append("Short period")
    elif sf_bar_period < 12:
        score += 0.15
    elif sf_bar_period < 18:
        score += 0.25
    else:
        score += 0.2
    
    # Direction scoring (WSW to WNW optimal for Ocean Beach)
    if 225 <= sf_bar_direction <= 315:
        score += 0.2
    elif 200 <= sf_bar_direction <= 350:
        score += 0.1
    else:
        issues.append("Poor wave direction")
    
    # Wind impact
    if wind_category == 'offshore':
        score += 0.25
    elif wind_category == 'light':
        score += 0.15
    elif wind_category == 'moderate':
        score += 0.05
        issues.append("Moderate wind")
    else:
        score = min(score, 0.2)
        issues.append("Strong onshore wind")
    
    score = max(0, min(1, score))
    should_go = score > 0.6
    
    return {
        'timestamp': datetime.utcnow().isoformat(),
        'target_datetime': datetime.utcnow().isoformat(),
        'conditions': conditions,
        'prediction': {
            'prediction': 1 if should_go else 0,
            'confidence': 0.7,
            'recommendation': 'GO SURF!' if should_go else f"Poor conditions: {', '.join(issues)}"
        },
        'summary': {
            'should_go': should_go,
            'confidence_level': 'Medium',
            'recommendation': 'GO SURF!' if should_go else f"Poor conditions: {', '.join(issues)}"
        },
        'note': 'Generated using rule-based fallback logic'
    }
```

### 5. Deployment Configuration
**Update `requirements.txt`:**
```
google-cloud-bigquery>=3.0.0
functions-framework>=3.0.0
```

**Update `main.py`:** Include all the code above

### 6. Testing Checklist

Test with these exact payloads:

**Complete Data (Both Buoys Online):**
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

**Partial Data (Pt. Reyes Offline):**
```json
{
  "sf_bar_height": "3.08",
  "sf_bar_period": 14.29,
  "sf_bar_direction": 241,
  "wind_category": "light",
  "size_category": "knee_high",
  "tide_category": "mid_ebb"
}
```

**Invalid Data:**
```json
{
  "sf_bar_height": "invalid",
  "wind_category": "unknown"
}
```

### 7. Success Criteria

✅ **Function responds successfully to all test cases**  
✅ **No 500 errors or crashes with missing Pt. Reyes data**  
✅ **Response format matches existing frontend expectations**  
✅ **Confidence scores adjust appropriately for incomplete data**  
✅ **Fallback logic works when ML model fails**  
✅ **Logs track data completeness and prediction method used**  
✅ **Performance remains under 5 seconds response time**

### 8. Post-Deployment Verification

After deployment, test the function directly:
```bash
curl -X POST https://us-central1-jtokib.cloudfunctions.net/surf-predictor \
  -H "Content-Type: application/json" \
  -d '{"sf_bar_height": "3.08", "sf_bar_period": 14.29, "sf_bar_direction": 241, "wind_category": "light", "size_category": "knee_high", "tide_category": "mid_ebb"}'
```

Once the Cloud Function is fixed and responds correctly, the frontend will automatically stop using fallback logic and the "Cloud Function needs repair" message will disappear.

## Priority: CRITICAL 🚨
This affects user experience by showing error messages and using suboptimal prediction logic. The Cloud Function should be the primary prediction source, not the local fallback.