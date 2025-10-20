"""
Logging configuration for InsPecPro application
"""
import logging
import logging.config
import os
from datetime import datetime

def setup_logging():
    """Setup logging configuration for the application"""
    
    # Create logs directory if it doesn't exist
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    
    # Get environment
    environment = os.getenv("ENVIRONMENT", "development")
    
    # Configure logging based on environment
    if environment == "production":
        log_level = "INFO"
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    else:
        log_level = "DEBUG"
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"
    
    # Logging configuration
    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'standard': {
                'format': log_format,
                'datefmt': '%Y-%m-%d %H:%M:%S'
            },
            'detailed': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(module)s - %(funcName)s:%(lineno)d - %(message)s',
                'datefmt': '%Y-%m-%d %H:%M:%S'
            }
        },
        'handlers': {
            'console': {
                'level': log_level,
                'class': 'logging.StreamHandler',
                'formatter': 'standard',
                'stream': 'ext://sys.stdout'
            },
            'file': {
                'level': 'INFO',
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'detailed',
                'filename': os.path.join(log_dir, 'sanalyze.log'),
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'encoding': 'utf8'
            },
            'error_file': {
                'level': 'ERROR',
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'detailed',
                'filename': os.path.join(log_dir, 'errors.log'),
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'encoding': 'utf8'
            },
            'security_file': {
                'level': 'WARNING',
                'class': 'logging.handlers.RotatingFileHandler',
                'formatter': 'detailed',
                'filename': os.path.join(log_dir, 'security.log'),
                'maxBytes': 10485760,  # 10MB
                'backupCount': 10,  # Keep more security logs
                'encoding': 'utf8'
            }
        },
        'loggers': {
            '': {  # Root logger
                'handlers': ['console', 'file'],
                'level': log_level,
                'propagate': False
            },
            'sanalyze': {
                'handlers': ['console', 'file'],
                'level': log_level,
                'propagate': False
            },
            'sanalyze.security': {
                'handlers': ['console', 'security_file', 'error_file'],
                'level': 'WARNING',
                'propagate': False
            },
            'sanalyze.auth': {
                'handlers': ['console', 'file', 'security_file'],
                'level': 'INFO',
                'propagate': False
            },
            'sanalyze.file_upload': {
                'handlers': ['console', 'file', 'security_file'],
                'level': 'INFO',
                'propagate': False
            },
            'uvicorn': {
                'handlers': ['console', 'file'],
                'level': 'INFO',
                'propagate': False
            },
            'uvicorn.error': {
                'handlers': ['console', 'error_file'],
                'level': 'INFO',
                'propagate': False
            },
            'uvicorn.access': {
                'handlers': ['file'],
                'level': 'INFO',
                'propagate': False
            }
        }
    }
    
    # Apply logging configuration
    logging.config.dictConfig(logging_config)
    
    # Log startup message
    logger = logging.getLogger('sanalyze')
    logger.info(f"Logging system initialized for environment: {environment}")
    logger.info(f"Log files location: {os.path.abspath(log_dir)}")

def get_logger(name: str = None):
    """Get a logger instance"""
    if name:
        return logging.getLogger(f'sanalyze.{name}')
    return logging.getLogger('sanalyze')

def log_security_event(event_type: str, details: str, user_id: int = None, ip_address: str = None):
    """Log security-related events"""
    security_logger = logging.getLogger('sanalyze.security')
    
    log_message = f"SECURITY_EVENT: {event_type} - {details}"
    if user_id:
        log_message += f" - User ID: {user_id}"
    if ip_address:
        log_message += f" - IP: {ip_address}"
    
    security_logger.warning(log_message)

def log_auth_event(event_type: str, username: str, success: bool, ip_address: str = None):
    """Log authentication events"""
    auth_logger = logging.getLogger('inspecpro.auth')
    
    status = "SUCCESS" if success else "FAILED"
    log_message = f"AUTH_{event_type}_{status}: {username}"
    if ip_address:
        log_message += f" - IP: {ip_address}"
    
    if success:
        auth_logger.info(log_message)
    else:
        auth_logger.warning(log_message)

def log_file_upload_event(filename: str, file_size: int, user_id: int, success: bool, error: str = None):
    """Log file upload events"""
    upload_logger = logging.getLogger('inspecpro.file_upload')
    
    status = "SUCCESS" if success else "FAILED"
    log_message = f"FILE_UPLOAD_{status}: {filename} ({file_size} bytes) - User ID: {user_id}"
    
    if error:
        log_message += f" - Error: {error}"
    
    if success:
        upload_logger.info(log_message)
    else:
        upload_logger.warning(log_message)