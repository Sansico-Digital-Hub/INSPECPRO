"""
Flag condition evaluator for detecting abnormal data in inspection responses.
This module contains logic to evaluate if inspection responses meet the flag conditions
defined by administrators for marking abnormal data.
"""

from typing import Dict, Any, Optional, List
from decimal import Decimal
from schemas import FieldType
from .logging_config import get_logger

logger = get_logger(__name__)


class FlagEvaluator:
    """Evaluates flag conditions for inspection responses"""
    
    @staticmethod
    def evaluate_field_response(
        field_type: FieldType,
        response_value: Optional[str],
        measurement_value: Optional[Decimal],
        flag_conditions: Optional[Dict[str, Any]]
    ) -> bool:
        """
        Evaluate if a field response should be flagged as abnormal.
        
        Args:
            field_type: Type of the field (button, dropdown, measurement, etc.)
            response_value: The response value (for buttons, dropdowns, etc.)
            measurement_value: The measurement value (for measurement fields)
            flag_conditions: Flag condition settings from admin
            
        Returns:
            bool: True if the response should be flagged as abnormal, False otherwise
        """
        if not flag_conditions or not flag_conditions.get('enabled', False):
            return False
            
        try:
            if field_type == FieldType.BUTTON:
                return FlagEvaluator._evaluate_button_field(response_value, flag_conditions)
            elif field_type == FieldType.DROPDOWN:
                return FlagEvaluator._evaluate_dropdown_field(response_value, flag_conditions)
            elif field_type == FieldType.SEARCH_DROPDOWN:
                return FlagEvaluator._evaluate_search_dropdown_field(response_value, flag_conditions)
            elif field_type == FieldType.MEASUREMENT:
                return FlagEvaluator._evaluate_measurement_field(measurement_value, flag_conditions)
            else:
                # For other field types, no flag evaluation by default
                return False
                
        except Exception as e:
            # Log error but don't flag on evaluation errors
            logger.error(f"Error evaluating flag condition for field type {field_type}: {e}")
            return False
    
    @staticmethod
    def _evaluate_button_field(response_value: Optional[str], flag_conditions: Dict[str, Any]) -> bool:
        """
        Evaluate button field flag conditions.
        
        Flag conditions format for buttons:
        {
            "enabled": true,
            "abnormal_values": ["button_2", "button_3"],  # Values considered abnormal
            "normal_values": ["button_1"]  # Values considered normal (optional)
        }
        """
        if not response_value:
            return False
            
        abnormal_values = flag_conditions.get('abnormal_values', [])
        normal_values = flag_conditions.get('normal_values', [])
        
        # If abnormal values are specified, check if response is in abnormal list
        if abnormal_values and response_value in abnormal_values:
            return True
            
        # If normal values are specified, flag anything not in normal list
        if normal_values and response_value not in normal_values:
            return True
            
        return False
    
    @staticmethod
    def _evaluate_dropdown_field(response_value: Optional[str], flag_conditions: Dict[str, Any]) -> bool:
        """
        Evaluate dropdown field flag conditions.
        
        Flag conditions format for dropdowns:
        {
            "enabled": true,
            "abnormal_values": ["option_2", "option_3"],  # Values considered abnormal
            "normal_values": ["option_1"]  # Values considered normal (optional)
        }
        """
        if not response_value:
            return False
            
        abnormal_values = flag_conditions.get('abnormal_values', [])
        normal_values = flag_conditions.get('normal_values', [])
        
        # If abnormal values are specified, check if response is in abnormal list
        if abnormal_values and response_value in abnormal_values:
            return True
            
        # If normal values are specified, flag anything not in normal list
        if normal_values and response_value not in normal_values:
            return True
            
        return False
    
    @staticmethod
    def _evaluate_search_dropdown_field(response_value: Optional[str], flag_conditions: Dict[str, Any]) -> bool:
        """
        Evaluate search dropdown field flag conditions.
        Same logic as regular dropdown.
        """
        return FlagEvaluator._evaluate_dropdown_field(response_value, flag_conditions)
    
    @staticmethod
    def _evaluate_measurement_field(measurement_value: Optional[Decimal], flag_conditions: Dict[str, Any]) -> bool:
        """
        Evaluate measurement field flag conditions.
        
        Flag conditions format for measurements:
        {
            "enabled": true,
            "min_value": 10.0,  # Minimum acceptable value
            "max_value": 100.0,  # Maximum acceptable value
            "required": true  # Whether value is required
        }
        """
        required = flag_conditions.get('required', False)
        min_value = flag_conditions.get('min_value')
        max_value = flag_conditions.get('max_value')
        
        # Check if value is required but missing
        if required and measurement_value is None:
            return True
            
        # If no value provided and not required, don't flag
        if measurement_value is None:
            return False
            
        # Check min/max bounds
        if min_value is not None and float(measurement_value) < min_value:
            return True
            
        if max_value is not None and float(measurement_value) > max_value:
            return True
            
        return False
    
    @staticmethod
    def evaluate_inspection_responses(responses: List[Dict[str, Any]], form_fields: List[Dict[str, Any]]) -> List[bool]:
        """
        Evaluate multiple inspection responses for flag conditions.
        
        Args:
            responses: List of inspection response data
            form_fields: List of form field data with flag conditions
            
        Returns:
            List[bool]: List of flag statuses for each response
        """
        # Create a mapping of field_id to flag_conditions
        field_flag_conditions = {}
        field_types = {}
        
        for field in form_fields:
            field_flag_conditions[field['id']] = field.get('flag_conditions')
            field_types[field['id']] = field['field_type']
        
        flag_results = []
        
        for response in responses:
            field_id = response.get('field_id')
            if field_id not in field_flag_conditions:
                flag_results.append(False)
                continue
                
            field_type = field_types.get(field_id)
            flag_conditions = field_flag_conditions.get(field_id)
            
            is_flagged = FlagEvaluator.evaluate_field_response(
                field_type=field_type,
                response_value=response.get('response_value'),
                measurement_value=response.get('measurement_value'),
                flag_conditions=flag_conditions
            )
            
            flag_results.append(is_flagged)
        
        return flag_results


def evaluate_flag_conditions(
    flag_conditions: Optional[Dict[str, Any]],
    field_type: FieldType,
    response_value: Optional[str],
    measurement_value: Optional[Decimal],
    pass_hold_status: Optional[str]
) -> bool:
    """
    Evaluate flag conditions for a single field response.
    This is a convenience function that wraps FlagEvaluator.evaluate_field_response.
    
    Args:
        flag_conditions: Flag condition settings from admin
        field_type: Type of the field (button, dropdown, measurement, etc.)
        response_value: The response value (for buttons, dropdowns, etc.)
        measurement_value: The measurement value (for measurement fields)
        pass_hold_status: Pass/Hold status (currently not used in evaluation)
        
    Returns:
        bool: True if the response should be flagged as abnormal, False otherwise
    """
    return FlagEvaluator.evaluate_field_response(
        field_type=field_type,
        response_value=response_value,
        measurement_value=measurement_value,
        flag_conditions=flag_conditions
    )