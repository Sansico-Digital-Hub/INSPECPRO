"""
File validation utilities for secure file uploads
"""
import os
import magic
from typing import List, Optional
from fastapi import HTTPException, status, UploadFile
import hashlib

# Configuration
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
    'document': ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    'spreadsheet': ['.xls', '.xlsx', '.csv'],
    'archive': ['.zip', '.rar', '.7z']
}

ALLOWED_MIME_TYPES = {
    # Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/bmp': ['.bmp'],
    'image/webp': ['.webp'],
    
    # Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'application/rtf': ['.rtf'],
    
    # Spreadsheets
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv'],
    
    # Archives
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z']
}

# Dangerous file extensions that should never be allowed
DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.php', '.asp', '.aspx', '.jsp', '.py', '.pl', '.sh', '.ps1', '.msi'
]

class FileValidator:
    """Secure file validation class"""
    
    @staticmethod
    def validate_file_size(file: UploadFile, max_size: int = MAX_FILE_SIZE) -> None:
        """Validate file size"""
        if hasattr(file, 'size') and file.size and file.size > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {max_size / (1024*1024):.1f}MB"
            )
    
    @staticmethod
    def validate_file_extension(filename: str, allowed_types: List[str] = None) -> None:
        """Validate file extension"""
        if not filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Filename is required"
            )
        
        file_ext = os.path.splitext(filename)[1].lower()
        
        # Check for dangerous extensions
        if file_ext in DANGEROUS_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type '{file_ext}' is not allowed for security reasons"
            )
        
        # If specific types are allowed, check against them
        if allowed_types:
            allowed_extensions = []
            for file_type in allowed_types:
                if file_type in ALLOWED_EXTENSIONS:
                    allowed_extensions.extend(ALLOWED_EXTENSIONS[file_type])
            
            if file_ext not in allowed_extensions:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type '{file_ext}' is not allowed. Allowed types: {', '.join(allowed_extensions)}"
                )
        else:
            # Check against all allowed extensions
            all_allowed = []
            for extensions in ALLOWED_EXTENSIONS.values():
                all_allowed.extend(extensions)
            
            if file_ext not in all_allowed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type '{file_ext}' is not allowed"
                )
    
    @staticmethod
    async def validate_mime_type(file: UploadFile) -> None:
        """Validate MIME type using python-magic"""
        try:
            # Read first 2048 bytes to determine MIME type
            content = await file.read(2048)
            await file.seek(0)  # Reset file pointer
            
            # Get MIME type
            mime_type = magic.from_buffer(content, mime=True)
            
            # Check if MIME type is allowed
            if mime_type not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"MIME type '{mime_type}' is not allowed"
                )
            
            # Verify extension matches MIME type
            file_ext = os.path.splitext(file.filename)[1].lower()
            expected_extensions = ALLOWED_MIME_TYPES[mime_type]
            
            if file_ext not in expected_extensions:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File extension '{file_ext}' does not match MIME type '{mime_type}'"
                )
                
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to validate file type"
            )
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal attacks"""
        # Remove path components
        filename = os.path.basename(filename)
        
        # Remove or replace dangerous characters
        dangerous_chars = ['..', '/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in dangerous_chars:
            filename = filename.replace(char, '_')
        
        # Limit filename length
        name, ext = os.path.splitext(filename)
        if len(name) > 100:
            name = name[:100]
        
        return f"{name}{ext}"
    
    @staticmethod
    async def calculate_file_hash(file: UploadFile) -> str:
        """Calculate SHA-256 hash of file content"""
        hasher = hashlib.sha256()
        
        # Read file in chunks to handle large files
        chunk_size = 8192
        while chunk := await file.read(chunk_size):
            hasher.update(chunk)
        
        await file.seek(0)  # Reset file pointer
        return hasher.hexdigest()
    
    @classmethod
    async def validate_upload_file(
        cls, 
        file: UploadFile, 
        allowed_types: List[str] = None,
        max_size: int = MAX_FILE_SIZE
    ) -> dict:
        """
        Comprehensive file validation
        Returns file metadata if validation passes
        """
        # Basic validations
        cls.validate_file_size(file, max_size)
        cls.validate_file_extension(file.filename, allowed_types)
        
        # MIME type validation (requires python-magic)
        try:
            await cls.validate_mime_type(file)
        except ImportError:
            # python-magic not available, skip MIME validation
            pass
        
        # Calculate file hash for integrity
        file_hash = await cls.calculate_file_hash(file)
        
        # Sanitize filename
        safe_filename = cls.sanitize_filename(file.filename)
        
        return {
            'original_filename': file.filename,
            'safe_filename': safe_filename,
            'content_type': file.content_type,
            'size': file.size if hasattr(file, 'size') else None,
            'hash': file_hash
        }