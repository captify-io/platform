"""
B-52 Advanced Forecasting Engine Lambda Function
Implements predictive analytics for identifying problem parts before failure
"""

import json
import boto3
import os
from typing import Dict, List, Any, Tuple
from datetime import datetime, timedelta
import logging
import numpy as np
from statistics import mean, median

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Clients
s3_client = boto3.client('s3')
neptune_client = boto3.client('neptunedata')
athena_client = boto3.client('athena')
sagemaker_runtime = boto3.client('sagemaker-runtime')

# Environment variables
NEPTUNE_ENDPOINT = os.environ['NEPTUNE_ENDPOINT']
ATHENA_DATABASE = os.environ['ATHENA_DATABASE']
RESULTS_BUCKET = os.environ['RESULTS_BUCKET']
SAGEMAKER_ENDPOINT = os.environ['SAGEMAKER_ENDPOINT']

def handler(event, context):
    """
    Lambda handler for advanced forecasting analysis
    Analyzes B-52 fleet data to predict maintenance needs and part failures
    """
    try:
        logger.info("Starting B-52 Advanced Forecasting Analysis")
        
        # Get current fleet status
        fleet_data = get_fleet_status()
        
        # Perform predictive analysis
        predictions = perform_predictive_analysis(fleet_data)
        
        # Identify high-risk components
        high_risk_components = identify_high_risk_components(predictions)
        
        # Generate MICAP prevention recommendations
        micap_prevention = generate_micap_prevention_strategy(high_risk_components)
        
        # Create forecasting report
        report = create_forecasting_report(predictions, high_risk_components, micap_prevention)
        
        # Save results
        save_forecasting_results(report)
        
        logger.info("Forecasting analysis completed successfully")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Forecasting analysis completed',
                'predictions_generated': len(predictions),
                'high_risk_components': len(high_risk_components),
                'report_location': f"s3://{RESULTS_BUCKET}/forecasting-reports/"
            })
        }
        
    except Exception as e:
        logger.error(f"Error in forecasting analysis: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def get_fleet_status() -> Dict:
    """Query Neptune for current B-52 fleet status"""
    
    logger.info("Retrieving B-52 fleet status from Neptune")
    
    # Query for all aircraft and their components
    gremlin_query = """
    g.V().hasLabel('Aircraft')
    .project('aircraft', 'components', 'maintenance', 'predictions')
    .by(valueMap(true))
    .by(out('CONTAINS').hasLabel('LRU', 'SRU').valueMap(true).fold())
    .by(out('AIRCRAFT_MAINTENANCE').hasLabel('MaintenanceRecord').valueMap(true).fold())
    .by(out('HAS_PREDICTION').hasLabel('FailurePrediction').valueMap(true).fold())
    """
    
    try:
        response = neptune_client.execute_gremlin_query(gremlinQuery=gremlin_query)
        fleet_data = response.get('result', {}).get('data', [])
        
        logger.info(f"Retrieved data for {len(fleet_data)} aircraft")
        return {'aircraft': fleet_data, 'query_timestamp': datetime.now().isoformat()}
        
    except Exception as e:
        logger.error(f"Error querying Neptune: {str(e)}")
        raise

def perform_predictive_analysis(fleet_data: Dict) -> List[Dict]:
    """Perform advanced predictive analysis on fleet data"""
    
    logger.info("Performing predictive analysis")
    predictions = []
    
    for aircraft_data in fleet_data['aircraft']:
        aircraft_id = aircraft_data['aircraft']['id'][0]
        components = aircraft_data.get('components', [])
        maintenance_history = aircraft_data.get('maintenance', [])
        
        logger.info(f"Analyzing aircraft: {aircraft_id}")
        
        # Analyze each component
        for component in components:
            try:
                prediction = analyze_component_risk(component, maintenance_history)
                if prediction:
                    prediction['aircraft_id'] = aircraft_id
                    predictions.append(prediction)
                    
            except Exception as e:
                logger.error(f"Error analyzing component {component.get('id', 'unknown')}: {str(e)}")
                continue
    
    logger.info(f"Generated {len(predictions)} component predictions")
    return predictions

def analyze_component_risk(component: Dict, maintenance_history: List[Dict]) -> Dict:
    """Analyze individual component failure risk using multiple factors"""
    
    component_id = component.get('id', ['unknown'])[0]
    
    # Extract component properties
    operating_hours = float(component.get('operating_hours', [0])[0])
    mtbf_hours = float(component.get('mtbf_hours', [1000])[0])
    condition = component.get('condition', ['UNKNOWN'])[0]
    criticality = component.get('criticality', ['STANDARD'])[0]
    install_date = component.get('install_date', ['2024-01-01'])[0]
    
    # Calculate age in days
    install_datetime = datetime.strptime(install_date, '%Y-%m-%d')
    age_days = (datetime.now() - install_datetime).days
    
    # Risk factors analysis
    risk_factors = []
    
    # 1. Operating hours vs MTBF ratio
    mtbf_ratio = operating_hours / mtbf_hours if mtbf_hours > 0 else 1.0
    if mtbf_ratio > 0.8:
        risk_factors.append({
            'factor': 'High MTBF ratio',
            'value': mtbf_ratio,
            'weight': 0.3,
            'description': f'Operating hours ({operating_hours}) approaching MTBF limit ({mtbf_hours})'
        })
    
    # 2. Component age
    if age_days > 1095:  # 3 years
        age_risk = min(age_days / 1825, 1.0)  # Max risk at 5 years
        risk_factors.append({
            'factor': 'Component age',
            'value': age_risk,
            'weight': 0.2,
            'description': f'Component age: {age_days} days'
        })
    
    # 3. Condition status
    condition_risk = {
        'FAILED': 1.0,
        'DEGRADED': 0.7,
        'READY': 0.1
    }.get(condition, 0.5)
    
    if condition_risk > 0.1:
        risk_factors.append({
            'factor': 'Current condition',
            'value': condition_risk,
            'weight': 0.4,
            'description': f'Current condition: {condition}'
        })
    
    # 4. Maintenance frequency analysis
    component_maintenance = [m for m in maintenance_history if m.get('component_id', [''])[0] == component_id]
    if len(component_maintenance) > 0:
        # High maintenance frequency indicates potential problems
        recent_maintenance = [m for m in component_maintenance 
                            if datetime.fromisoformat(m.get('start_time', ['2024-01-01T00:00:00'])[0]) > datetime.now() - timedelta(days=180)]
        
        if len(recent_maintenance) > 3:  # More than 3 maintenance actions in 6 months
            maintenance_risk = min(len(recent_maintenance) / 10, 1.0)
            risk_factors.append({
                'factor': 'High maintenance frequency',
                'value': maintenance_risk,
                'weight': 0.1,
                'description': f'{len(recent_maintenance)} maintenance actions in last 180 days'
            })
    
    # Calculate overall risk score
    if not risk_factors:
        return None
    
    total_weighted_risk = sum(factor['value'] * factor['weight'] for factor in risk_factors)
    total_weight = sum(factor['weight'] for factor in risk_factors)
    overall_risk = total_weighted_risk / total_weight if total_weight > 0 else 0
    
    # Apply criticality multiplier
    criticality_multiplier = {
        'CRITICAL': 1.5,
        'ESSENTIAL': 1.2,
        'STANDARD': 1.0
    }.get(criticality, 1.0)
    
    final_risk_score = min(overall_risk * criticality_multiplier, 1.0)
    
    # Generate prediction if risk is significant
    if final_risk_score > 0.3:  # Only predict for components with >30% risk
        
        # Estimate failure timeframe
        days_to_failure = estimate_failure_timeframe(final_risk_score, mtbf_hours, operating_hours)
        predicted_failure_date = (datetime.now() + timedelta(days=days_to_failure)).strftime('%Y-%m-%d')
        
        # Determine risk level
        if final_risk_score > 0.8:
            risk_level = 'HIGH'
        elif final_risk_score > 0.5:
            risk_level = 'MEDIUM' 
        else:
            risk_level = 'LOW'
        
        return {
            'component_id': component_id,
            'risk_score': final_risk_score,
            'risk_level': risk_level,
            'predicted_failure_date': predicted_failure_date,
            'confidence': min(0.95, 0.6 + (final_risk_score * 0.3)),  # Higher risk = higher confidence
            'risk_factors': risk_factors,
            'failure_mode': predict_failure_mode(component, risk_factors),
            'recommended_action': generate_recommendation(final_risk_score, criticality, days_to_failure),
            'cost_impact': estimate_cost_impact(component, criticality, final_risk_score),
            'analysis_timestamp': datetime.now().isoformat()
        }
    
    return None

def estimate_failure_timeframe(risk_score: float, mtbf_hours: float, operating_hours: float) -> int:
    """Estimate days until component failure based on risk score"""
    
    # Base calculation using MTBF
    remaining_mtbf_hours = max(mtbf_hours - operating_hours, 0)
    
    # Assume 8 hours flight time per day average
    base_days = remaining_mtbf_hours / 8 if remaining_mtbf_hours > 0 else 30
    
    # Adjust based on risk score (higher risk = sooner failure)
    risk_multiplier = 1 - risk_score  # High risk reduces time to failure
    
    estimated_days = max(int(base_days * risk_multiplier), 1)
    
    # Add some randomness within reasonable bounds
    min_days = max(1, estimated_days - 30)
    max_days = estimated_days + 60
    
    return min(max_days, max(min_days, estimated_days))

def predict_failure_mode(component: Dict, risk_factors: List[Dict]) -> str:
    """Predict most likely failure mode based on component type and risk factors"""
    
    component_name = component.get('name', ['unknown'])[0].lower()
    condition = component.get('condition', ['READY'])[0]
    
    # Common failure modes by component type
    if 'engine' in component_name:
        return 'Bearing wear or fuel system failure'
    elif 'hydraulic' in component_name:
        return 'Seal degradation or pressure loss'
    elif 'electrical' in component_name or 'power' in component_name:
        return 'Circuit degradation or connector corrosion'
    elif 'navigation' in component_name or 'radar' in component_name:
        return 'Sensor drift or software corruption'
    elif 'fuel' in component_name:
        return 'Pump failure or filter clogging'
    elif 'landing' in component_name:
        return 'Actuator failure or structural fatigue'
    else:
        # General failure modes based on risk factors
        dominant_factor = max(risk_factors, key=lambda x: x['value'] * x['weight'])
        
        if dominant_factor['factor'] == 'Component age':
            return 'Age-related material degradation'
        elif dominant_factor['factor'] == 'High MTBF ratio':
            return 'End-of-life wear failure'
        elif dominant_factor['factor'] == 'Current condition':
            return 'Progressive condition deterioration'
        else:
            return 'General component failure'

def generate_recommendation(risk_score: float, criticality: str, days_to_failure: int) -> str:
    """Generate maintenance recommendation based on risk analysis"""
    
    if risk_score > 0.8:
        if days_to_failure < 30:
            return f"URGENT: Schedule immediate replacement within {days_to_failure} days"
        else:
            return f"HIGH PRIORITY: Schedule replacement within {days_to_failure} days"
    elif risk_score > 0.5:
        return f"MEDIUM PRIORITY: Schedule inspection and potential replacement within {days_to_failure} days"
    else:
        return f"LOW PRIORITY: Monitor condition and schedule maintenance within {days_to_failure} days"

def estimate_cost_impact(component: Dict, criticality: str, risk_score: float) -> Dict:
    """Estimate financial impact of component failure vs prevention"""
    
    base_cost = float(component.get('cost', [1000])[0])
    
    # Cost multipliers for unplanned failure
    failure_multipliers = {
        'CRITICAL': 10.0,  # Mission abort, extensive downtime
        'ESSENTIAL': 5.0,  # Significant operational impact
        'STANDARD': 2.0    # Limited impact
    }
    
    prevention_multiplier = 1.2  # Slightly higher cost for planned maintenance
    
    cost_if_failed = base_cost * failure_multipliers.get(criticality, 2.0) * (1 + risk_score)
    cost_if_prevented = base_cost * prevention_multiplier
    
    return {
        'cost_if_failed': round(cost_if_failed, 2),
        'cost_if_prevented': round(cost_if_prevented, 2),
        'potential_savings': round(cost_if_failed - cost_if_prevented, 2),
        'roi_prevention': round((cost_if_failed - cost_if_prevented) / cost_if_prevented * 100, 1)
    }

def identify_high_risk_components(predictions: List[Dict]) -> List[Dict]:
    """Identify components with highest failure risk across the fleet"""
    
    # Filter high-risk predictions
    high_risk = [p for p in predictions if p['risk_level'] in ['HIGH', 'MEDIUM']]
    
    # Sort by risk score and criticality
    high_risk.sort(key=lambda x: (x['risk_score'], x.get('cost_impact', {}).get('cost_if_failed', 0)), reverse=True)
    
    logger.info(f"Identified {len(high_risk)} high-risk components")
    
    return high_risk[:100]  # Return top 100 highest risk

def generate_micap_prevention_strategy(high_risk_components: List[Dict]) -> Dict:
    """Generate MICAP (Mission Impacting Capability) prevention strategy"""
    
    logger.info("Generating MICAP prevention strategy")
    
    # Group by aircraft for coordinated maintenance
    aircraft_groups = {}
    for component in high_risk_components:
        aircraft_id = component['aircraft_id']
        if aircraft_id not in aircraft_groups:
            aircraft_groups[aircraft_id] = []
        aircraft_groups[aircraft_id].append(component)
    
    # Generate maintenance scheduling recommendations
    maintenance_schedule = []
    
    for aircraft_id, components in aircraft_groups.items():
        # Sort components by urgency (risk score and days to failure)
        components.sort(key=lambda x: (x['risk_score'], -int((datetime.strptime(x['predicted_failure_date'], '%Y-%m-%d') - datetime.now()).days)))
        
        # Group maintenance actions by time windows
        urgent_actions = [c for c in components if c['risk_score'] > 0.8]
        priority_actions = [c for c in components if 0.5 < c['risk_score'] <= 0.8]
        
        if urgent_actions or priority_actions:
            maintenance_schedule.append({
                'aircraft_id': aircraft_id,
                'urgent_components': len(urgent_actions),
                'priority_components': len(priority_actions),
                'estimated_downtime_hours': estimate_maintenance_downtime(urgent_actions + priority_actions),
                'total_cost_savings': sum(c.get('cost_impact', {}).get('potential_savings', 0) for c in components),
                'recommended_start_date': min(c['predicted_failure_date'] for c in urgent_actions) if urgent_actions else min(c['predicted_failure_date'] for c in priority_actions),
                'components': components
            })
    
    # Calculate fleet-wide impact
    total_potential_savings = sum(c.get('cost_impact', {}).get('potential_savings', 0) for c in high_risk_components)
    total_prevention_cost = sum(c.get('cost_impact', {}).get('cost_if_prevented', 0) for c in high_risk_components)
    
    return {
        'strategy_date': datetime.now().isoformat(),
        'aircraft_requiring_maintenance': len(aircraft_groups),
        'total_high_risk_components': len(high_risk_components),
        'total_potential_savings': round(total_potential_savings, 2),
        'total_prevention_cost': round(total_prevention_cost, 2),
        'fleet_roi': round(total_potential_savings / total_prevention_cost * 100, 1) if total_prevention_cost > 0 else 0,
        'maintenance_schedule': maintenance_schedule,
        'critical_actions_next_30_days': len([c for c in high_risk_components if (datetime.strptime(c['predicted_failure_date'], '%Y-%m-%d') - datetime.now()).days <= 30]),
        'summary': f"Proactive maintenance of {len(high_risk_components)} components could prevent ${total_potential_savings:,.0f} in failure costs"
    }

def estimate_maintenance_downtime(components: List[Dict]) -> float:
    """Estimate maintenance downtime hours for component replacements"""
    
    # Base downtime estimates by component type
    downtime_hours = 0
    
    for component in components:
        component_name = component.get('name', '').lower()
        
        if 'engine' in component_name:
            downtime_hours += 24  # Engine work requires significant time
        elif 'navigation' in component_name or 'radar' in component_name:
            downtime_hours += 8   # Avionics replacement
        elif 'hydraulic' in component_name:
            downtime_hours += 12  # Hydraulic system work
        elif 'electrical' in component_name:
            downtime_hours += 6   # Electrical component replacement
        else:
            downtime_hours += 4   # General component replacement
    
    # Add overhead for coordination and testing
    total_downtime = downtime_hours * 1.3  # 30% overhead
    
    return round(total_downtime, 1)

def create_forecasting_report(predictions: List[Dict], high_risk_components: List[Dict], micap_prevention: Dict) -> Dict:
    """Create comprehensive forecasting report"""
    
    logger.info("Creating forecasting report")
    
    # Calculate summary statistics
    total_predictions = len(predictions)
    high_risk_count = len([p for p in predictions if p['risk_level'] == 'HIGH'])
    medium_risk_count = len([p for p in predictions if p['risk_level'] == 'MEDIUM'])
    low_risk_count = len([p for p in predictions if p['risk_level'] == 'LOW'])
    
    avg_risk_score = mean([p['risk_score'] for p in predictions]) if predictions else 0
    avg_confidence = mean([p['confidence'] for p in predictions]) if predictions else 0
    
    # Fleet readiness impact
    aircraft_with_high_risk = len(set(p['aircraft_id'] for p in predictions if p['risk_level'] == 'HIGH'))
    
    report = {
        'report_metadata': {
            'report_id': f"B52_FORECAST_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            'generation_timestamp': datetime.now().isoformat(),
            'analysis_period': '2025-2026',
            'fleet_size': 75,
            'components_analyzed': total_predictions
        },
        'executive_summary': {
            'total_predictions': total_predictions,
            'high_risk_components': high_risk_count,
            'medium_risk_components': medium_risk_count,
            'low_risk_components': low_risk_count,
            'average_risk_score': round(avg_risk_score, 3),
            'average_confidence': round(avg_confidence, 3),
            'aircraft_requiring_urgent_attention': aircraft_with_high_risk,
            'potential_cost_savings': micap_prevention.get('total_potential_savings', 0),
            'recommended_actions': len(high_risk_components)
        },
        'fleet_readiness_impact': {
            'aircraft_at_risk': aircraft_with_high_risk,
            'mission_capability_impact': f"{round(aircraft_with_high_risk/75*100, 1)}% of fleet has high-risk components",
            'estimated_maintenance_hours': sum(schedule.get('estimated_downtime_hours', 0) for schedule in micap_prevention.get('maintenance_schedule', [])),
            'critical_maintenance_window': micap_prevention.get('critical_actions_next_30_days', 0)
        },
        'detailed_predictions': predictions,
        'high_risk_analysis': high_risk_components,
        'micap_prevention_strategy': micap_prevention,
        'recommendations': {
            'immediate_actions': [
                f"Schedule urgent maintenance for {high_risk_count} high-risk components",
                f"Prepare maintenance schedules for {len(micap_prevention.get('maintenance_schedule', []))} aircraft",
                "Coordinate parts procurement for predicted failures",
                "Implement enhanced monitoring for medium-risk components"
            ],
            'strategic_initiatives': [
                "Develop component-specific MTBF improvement programs",
                "Implement predictive maintenance protocols",
                "Enhance supply chain responsiveness for critical components",
                "Establish proactive maintenance scheduling based on risk scores"
            ]
        }
    }
    
    return report

def save_forecasting_results(report: Dict):
    """Save forecasting results to S3"""
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Save main report
    report_key = f"forecasting-reports/b52_forecast_report_{timestamp}.json"
    s3_client.put_object(
        Bucket=RESULTS_BUCKET,
        Key=report_key,
        Body=json.dumps(report, indent=2),
        ContentType='application/json'
    )
    
    # Save high-risk components as separate file for quick access
    high_risk_key = f"forecasting-reports/high_risk_components_{timestamp}.json"
    s3_client.put_object(
        Bucket=RESULTS_BUCKET,
        Key=high_risk_key,
        Body=json.dumps(report['high_risk_analysis'], indent=2),
        ContentType='application/json'
    )
    
    # Save maintenance schedule
    schedule_key = f"forecasting-reports/maintenance_schedule_{timestamp}.json"
    s3_client.put_object(
        Bucket=RESULTS_BUCKET,
        Key=schedule_key,
        Body=json.dumps(report['micap_prevention_strategy'], indent=2),
        ContentType='application/json'
    )
    
    logger.info(f"Forecasting results saved to S3:")
    logger.info(f"  Main report: s3://{RESULTS_BUCKET}/{report_key}")
    logger.info(f"  High-risk components: s3://{RESULTS_BUCKET}/{high_risk_key}")
    logger.info(f"  Maintenance schedule: s3://{RESULTS_BUCKET}/{schedule_key}")
