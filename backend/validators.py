"""
Custom validators untuk memastikan data integrity, khususnya untuk subform handling.
"""

from typing import Dict, List, Any, Optional
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)

class SubformValidationError(Exception):
    """Custom exception untuk subform validation errors"""
    pass

def validate_subform_field_structure(subfield: Dict[str, Any], parent_field_name: str = "") -> Dict[str, Any]:
    """
    Validate dan normalize struktur subform field.
    
    Args:
        subfield: Dictionary representing a subform field
        parent_field_name: Name of parent field for error context
        
    Returns:
        Normalized subfield dictionary
        
    Raises:
        SubformValidationError: If validation fails
    """
    
    # Ensure field_name exists
    if not subfield.get('field_name'):
        raise SubformValidationError(
            f"Subform field in '{parent_field_name}' missing required 'field_name'"
        )
    
    field_name = subfield['field_name']
    field_type = subfield.get('field_type')
    
    # Validate field_type
    valid_field_types = [
        'text', 'dropdown', 'search_dropdown', 'button', 'photo', 
        'signature', 'measurement', 'notes', 'date', 'datetime', 'time'
    ]
    
    if not field_type:
        # Auto-assign field_type based on field name patterns
        field_name_lower = field_name.lower()
        
        if any(keyword in field_name_lower for keyword in ["reject", "kode", "status", "category", "type"]):
            subfield["field_type"] = "dropdown"
            logger.info(f"Auto-assigned field_type 'dropdown' for subfield '{field_name}' based on name pattern")
        else:
            subfield["field_type"] = "text"
            logger.info(f"Auto-assigned field_type 'text' for subfield '{field_name}' (default)")
            
        field_type = subfield["field_type"]
    
    elif field_type not in valid_field_types:
        raise SubformValidationError(
            f"Invalid field_type '{field_type}' for subfield '{field_name}' in '{parent_field_name}'. "
            f"Valid types: {', '.join(valid_field_types)}"
        )
    
    # Validate dropdown fields have options
    if field_type in ["dropdown", "search_dropdown"]:
        field_options = subfield.get("field_options", {})
        options = field_options.get("options", [])
        
        if not options:
            # Auto-generate default options based on field name
            field_name_lower = field_name.lower()
            
            if "reject" in field_name_lower or "kode" in field_name_lower:
                default_options = [
                    "QBK 134 - Scratch",
                    "QBK 132 - Cetakan Bergaris", 
                    "QBK 133 - Salah Pisau",
                    "QBK 131 - Salah Material",
                    "Lainnya"
                ]
                logger.info(f"Auto-generated reject code options for subfield '{field_name}'")
            elif "status" in field_name_lower:
                default_options = ["Pass", "Hold", "Reject"]
                logger.info(f"Auto-generated status options for subfield '{field_name}'")
            elif "category" in field_name_lower:
                default_options = ["Category A", "Category B", "Category C", "Other"]
                logger.info(f"Auto-generated category options for subfield '{field_name}'")
            else:
                default_options = ["Option 1", "Option 2", "Option 3"]
                logger.info(f"Auto-generated default options for subfield '{field_name}'")
            
            subfield["field_options"] = {"options": default_options}
    
    # Validate measurement fields
    if field_type == "measurement":
        measurement_type = subfield.get("measurement_type")
        if not measurement_type:
            subfield["measurement_type"] = "between"
            measurement_type = "between"  # Update the variable after assignment
            logger.info(f"Auto-assigned measurement_type 'between' for subfield '{field_name}'")
        
        # Ensure min/max values for measurement
        if measurement_type in ["between", "higher", "lower"]:
            if subfield.get("measurement_min") is None:
                subfield["measurement_min"] = 0
            if subfield.get("measurement_max") is None:
                subfield["measurement_max"] = 100
    
    # Ensure is_required is boolean
    if "is_required" not in subfield:
        subfield["is_required"] = False
    elif not isinstance(subfield["is_required"], bool):
        subfield["is_required"] = bool(subfield["is_required"])
    
    return subfield

def validate_subform_fields_complete(field_options: Dict[str, Any], field_name: str = "") -> Dict[str, Any]:
    """
    Comprehensive validation untuk semua subform fields dalam field_options.
    
    Args:
        field_options: Field options dictionary containing subform_fields
        field_name: Name of parent field for error context
        
    Returns:
        Validated and normalized field_options
        
    Raises:
        SubformValidationError: If validation fails
    """
    
    if not isinstance(field_options, dict):
        raise SubformValidationError(f"field_options must be a dictionary for field '{field_name}'")
    
    subform_fields = field_options.get('subform_fields', [])
    
    if not isinstance(subform_fields, list):
        raise SubformValidationError(f"subform_fields must be a list for field '{field_name}'")
    
    if not subform_fields:
        logger.warning(f"Subform field '{field_name}' has no subform_fields defined")
        return field_options
    
    # Validate each subform field
    validated_subfields = []
    field_names_seen = set()
    
    for i, subfield in enumerate(subform_fields):
        if not isinstance(subfield, dict):
            raise SubformValidationError(
                f"Subform field at index {i} in '{field_name}' must be a dictionary"
            )
        
        # Validate and normalize the subfield
        validated_subfield = validate_subform_field_structure(subfield, field_name)
        
        # Check for duplicate field names
        subfield_name = validated_subfield['field_name']
        if subfield_name in field_names_seen:
            raise SubformValidationError(
                f"Duplicate subfield name '{subfield_name}' in subform '{field_name}'"
            )
        field_names_seen.add(subfield_name)
        
        validated_subfields.append(validated_subfield)
    
    # Update field_options with validated subfields
    field_options['subform_fields'] = validated_subfields
    
    logger.info(f"Successfully validated {len(validated_subfields)} subform fields for '{field_name}'")
    
    return field_options

def validate_form_field_before_save(field_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate form field data sebelum disimpan ke database.
    
    Args:
        field_data: Dictionary containing field data
        
    Returns:
        Validated and normalized field data
        
    Raises:
        HTTPException: If validation fails
    """
    
    try:
        field_type = field_data.get('field_type')
        field_name = field_data.get('field_name', 'Unknown')
        
        # Special validation for subform fields
        if field_type == 'subform':
            field_options = field_data.get('field_options', {})
            validated_options = validate_subform_fields_complete(field_options, field_name)
            field_data['field_options'] = validated_options
        
        # Validate dropdown fields at top level
        elif field_type in ['dropdown', 'search_dropdown']:
            field_options = field_data.get('field_options', {})
            if not field_options.get('options'):
                raise SubformValidationError(
                    f"Dropdown field '{field_name}' must have options defined"
                )
        
        return field_data
        
    except SubformValidationError as e:
        logger.error(f"Subform validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

def validate_inspection_response_for_subform(response_data: Dict[str, Any], field_options: Dict[str, Any]) -> bool:
    """
    Validate inspection response untuk subform fields.
    
    Args:
        response_data: Response data from inspection
        field_options: Field options containing subform_fields definition
        
    Returns:
        True if valid, raises exception if invalid
        
    Raises:
        HTTPException: If validation fails
    """
    
    try:
        subform_fields = field_options.get('subform_fields', [])
        
        if not subform_fields:
            return True
        
        # Validate response structure
        if not isinstance(response_data, dict):
            raise SubformValidationError("Subform response must be a dictionary")
        
        # Check required fields
        for subfield in subform_fields:
            field_name = subfield.get('field_name')
            is_required = subfield.get('is_required', False)
            field_type = subfield.get('field_type')
            
            if is_required and field_name not in response_data:
                raise SubformValidationError(f"Required subform field '{field_name}' is missing")
            
            if field_name in response_data:
                value = response_data[field_name]
                
                # Validate dropdown values
                if field_type in ['dropdown', 'search_dropdown'] and value:
                    valid_options = subfield.get('field_options', {}).get('options', [])
                    if valid_options and value not in valid_options:
                        raise SubformValidationError(
                            f"Invalid value '{value}' for dropdown field '{field_name}'. "
                            f"Valid options: {', '.join(valid_options)}"
                        )
        
        return True
        
    except SubformValidationError as e:
        logger.error(f"Subform response validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected response validation error: {e}")
        raise HTTPException(status_code=500, detail=f"Response validation error: {str(e)}")