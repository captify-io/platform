"""
B-52 Data Processor Lambda Function
Processes incoming B-52 aircraft data and loads it into Neptune graph database
"""

import json
import boto3
import os
from typing import Dict, List, Any
from datetime import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS Clients
s3_client = boto3.client('s3')
neptune_client = boto3.client('neptunedata')

# Environment variables
NEPTUNE_ENDPOINT = os.environ['NEPTUNE_ENDPOINT']
GLUE_DATABASE = os.environ['GLUE_DATABASE']
PROCESSED_BUCKET = os.environ['PROCESSED_BUCKET']

def handler(event, context):
    """
    Lambda handler for processing B-52 data uploads
    Triggered by S3 ObjectCreated events
    """
    try:
        logger.info(f"Processing event: {json.dumps(event)}")
        
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            logger.info(f"Processing file: s3://{bucket}/{key}")
            
            # Download and process the file
            response = s3_client.get_object(Bucket=bucket, Key=key)
            data = json.loads(response['Body'].read())
            
            # Determine data type and process accordingly
            if 'aircraft_id' in data:
                process_aircraft_data(data, bucket, key)
            elif 'maintenance_records' in data:
                process_maintenance_data(data, bucket, key)
            elif 'failure_predictions' in data:
                process_prediction_data(data, bucket, key)
            else:
                logger.warning(f"Unknown data type in file: {key}")
                
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Data processed successfully'})
        }
        
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def process_aircraft_data(data: Dict, bucket: str, key: str):
    """Process aircraft hierarchy data and create graph relationships"""
    
    aircraft_id = data['aircraft_id']
    tail_number = data['tail_number']
    
    logger.info(f"Processing aircraft: {aircraft_id}")
    
    # Create aircraft vertex
    aircraft_vertex = {
        'id': aircraft_id,
        'label': 'Aircraft',
        'properties': {
            'tail_number': tail_number,
            'model': data['model'],
            'serial_number': data['serial_number'],
            'flight_hours': data['flight_hours'],
            'status': data['status'],
            'location': data['location'],
            'mission_capable': data['mission_capable']
        }
    }
    
    create_neptune_vertex(aircraft_vertex)
    
    # Process structure level components
    if 'components' in data and 'structure' in data['components']:
        for component in data['components']['structure']:
            process_component_hierarchy(component, aircraft_id, 'STRUCTURE')
    
    # Process LRU components
    if 'components' in data and 'lru' in data['components']:
        for component in data['components']['lru']:
            process_component_hierarchy(component, aircraft_id, 'LRU')
    
    # Process SRU components
    if 'components' in data and 'sru' in data['components']:
        for component in data['components']['sru']:
            process_component_hierarchy(component, aircraft_id, 'SRU')
    
    # Process individual parts (sample for performance)
    if 'components' in data and 'parts' in data['components']:
        # Process only a sample of parts to avoid overwhelming Neptune
        parts_sample = data['components']['parts'][:1000]  # Process first 1000 parts
        for component in parts_sample:
            process_component_hierarchy(component, aircraft_id, 'PART')
    
    # Save processed data to S3
    processed_key = key.replace('raw-data/', 'processed-data/')
    save_processed_data(data, processed_key)

def process_component_hierarchy(component: Dict, parent_id: str, component_type: str):
    """Create component vertex and relationship to parent"""
    
    # Create component vertex
    component_vertex = {
        'id': component['id'],
        'label': component_type,
        'properties': {
            'name': component['name'],
            'part_number': component['part_number'],
            'serial_number': component['serial_number'],
            'wuc': component['wuc'],
            'nsn': component['nsn'],
            'manufacturer': component['manufacturer'],
            'condition': component['condition'],
            'mtbf_hours': component['mtbf_hours'],
            'operating_hours': component['operating_hours'],
            'cost': component['cost'],
            'criticality': component['criticality'],
            'install_date': component['install_date'],
            'last_maintenance': component['last_maintenance'],
            'next_maintenance': component['next_maintenance']
        }
    }
    
    create_neptune_vertex(component_vertex)
    
    # Create parent-child relationship
    create_neptune_edge(parent_id, component['id'], 'CONTAINS')

def process_maintenance_data(data: Dict, bucket: str, key: str):
    """Process maintenance records and create relationships"""
    
    logger.info(f"Processing maintenance data from: {key}")
    
    # Process each maintenance record
    for record in data.get('maintenance_records', []):
        maintenance_vertex = {
            'id': record['id'],
            'label': 'MaintenanceRecord',
            'properties': {
                'action_type': record['action_type'],
                'work_unit_code': record['work_unit_code'],
                'description': record['description'],
                'technician': record['technician'],
                'start_time': record['start_time'],
                'end_time': record['end_time'],
                'labor_hours': record['labor_hours'],
                'cost': record['cost'],
                'next_action_due': record['next_action_due']
            }
        }
        
        create_neptune_vertex(maintenance_vertex)
        
        # Create relationships
        create_neptune_edge(record['component_id'], record['id'], 'HAS_MAINTENANCE')
        create_neptune_edge(record['aircraft_tail'], record['id'], 'AIRCRAFT_MAINTENANCE')

def process_prediction_data(data: Dict, bucket: str, key: str):
    """Process failure predictions and create relationships"""
    
    logger.info(f"Processing prediction data from: {key}")
    
    # Process each prediction
    for prediction in data.get('failure_predictions', []):
        prediction_vertex = {
            'id': f"PRED_{prediction['component_id']}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            'label': 'FailurePrediction',
            'properties': {
                'predicted_failure_date': prediction['predicted_failure_date'],
                'confidence': prediction['confidence'],
                'failure_mode': prediction['failure_mode'],
                'recommended_action': prediction['recommended_action'],
                'risk_level': prediction['risk_level'],
                'cost_if_failed': prediction['cost_if_failed'],
                'cost_if_prevented': prediction['cost_if_prevented'],
                'prediction_date': datetime.now().isoformat()
            }
        }
        
        create_neptune_vertex(prediction_vertex)
        
        # Create relationships
        create_neptune_edge(prediction['component_id'], prediction_vertex['id'], 'HAS_PREDICTION')

def create_neptune_vertex(vertex: Dict):
    """Create vertex in Neptune graph database"""
    try:
        gremlin_query = f"""
        g.addV('{vertex['label']}').property('id', '{vertex['id']}')
        """
        
        # Add properties
        for key, value in vertex['properties'].items():
            if isinstance(value, str):
                gremlin_query += f".property('{key}', '{value}')"
            else:
                gremlin_query += f".property('{key}', {value})"
        
        execute_gremlin_query(gremlin_query)
        logger.info(f"Created vertex: {vertex['id']}")
        
    except Exception as e:
        logger.error(f"Error creating vertex {vertex['id']}: {str(e)}")

def create_neptune_edge(from_id: str, to_id: str, relationship: str):
    """Create edge between vertices in Neptune"""
    try:
        gremlin_query = f"""
        g.V().has('id', '{from_id}').addE('{relationship}').to(g.V().has('id', '{to_id}'))
        """
        
        execute_gremlin_query(gremlin_query)
        logger.info(f"Created edge: {from_id} -{relationship}-> {to_id}")
        
    except Exception as e:
        logger.error(f"Error creating edge {from_id} -> {to_id}: {str(e)}")

def execute_gremlin_query(query: str):
    """Execute Gremlin query against Neptune"""
    try:
        response = neptune_client.execute_gremlin_query(
            gremlinQuery=query
        )
        return response
        
    except Exception as e:
        logger.error(f"Error executing Gremlin query: {str(e)}")
        raise

def save_processed_data(data: Dict, key: str):
    """Save processed data to S3 processed bucket"""
    try:
        processed_data = {
            'original_data': data,
            'processing_timestamp': datetime.now().isoformat(),
            'processor_version': '1.0'
        }
        
        s3_client.put_object(
            Bucket=PROCESSED_BUCKET,
            Key=key,
            Body=json.dumps(processed_data, indent=2),
            ContentType='application/json'
        )
        
        logger.info(f"Saved processed data to: s3://{PROCESSED_BUCKET}/{key}")
        
    except Exception as e:
        logger.error(f"Error saving processed data: {str(e)}")
        raise
