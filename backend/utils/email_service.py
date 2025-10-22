"""
Email Service Module for InsPecPro

This module provides email functionality for the InsPecPro application,
including password reset emails, notifications, and system alerts.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time

from .logging_config import get_logger

logger = get_logger(__name__)

class EmailConfig:
    """Email configuration class."""
    
    def __init__(self):
        self.smtp_server = os.getenv('SMTP_SERVER')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        self.smtp_use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        self.from_email = os.getenv('FROM_EMAIL')
        self.from_name = os.getenv('FROM_NAME', 'Sanalyze System')
        self.admin_email = os.getenv('ADMIN_EMAIL')
        
        # Rate limiting settings
        self.rate_limit = int(os.getenv('EMAIL_RATE_LIMIT', 10))  # emails per minute
        self.max_retries = int(os.getenv('EMAIL_MAX_RETRIES', 3))
        self.retry_delay = int(os.getenv('EMAIL_RETRY_DELAY', 5))  # seconds
        
        # Validation
        self._validate_config()
    
    def _validate_config(self):
        """Validate email configuration."""
        required_fields = ['smtp_server', 'smtp_username', 'smtp_password', 'from_email']
        missing_fields = [field for field in required_fields if not getattr(self, field)]
        
        if missing_fields:
            logger.error(f"Missing email configuration: {', '.join(missing_fields)}")
            raise ValueError(f"Missing required email configuration: {', '.join(missing_fields)}")
        
        logger.info("Email configuration validated successfully")
    
    @property
    def is_configured(self) -> bool:
        """Check if email is properly configured."""
        try:
            self._validate_config()
            return True
        except ValueError:
            return False

class EmailService:
    """Email service for sending various types of emails."""
    
    def __init__(self):
        self.config = EmailConfig()
        self._last_send_times = []  # For rate limiting
        self._executor = ThreadPoolExecutor(max_workers=3)
    
    def _check_rate_limit(self):
        """Check if we're within rate limits."""
        now = time.time()
        # Remove timestamps older than 1 minute
        self._last_send_times = [t for t in self._last_send_times if now - t < 60]
        
        if len(self._last_send_times) >= self.config.rate_limit:
            logger.warning("Email rate limit exceeded")
            raise Exception("Email rate limit exceeded. Please try again later.")
        
        self._last_send_times.append(now)
    
    def _create_smtp_connection(self):
        """Create and return SMTP connection."""
        try:
            server = smtplib.SMTP(self.config.smtp_server, self.config.smtp_port)
            
            if self.config.smtp_use_tls:
                server.starttls()
            
            server.login(self.config.smtp_username, self.config.smtp_password)
            return server
            
        except Exception as e:
            logger.error(f"Failed to create SMTP connection: {e}")
            raise
    
    def _send_email_with_retry(self, msg: MIMEMultipart) -> bool:
        """Send email with retry logic."""
        for attempt in range(self.config.max_retries):
            try:
                server = self._create_smtp_connection()
                server.send_message(msg)
                server.quit()
                
                logger.info(f"Email sent successfully to {msg['To']} (attempt {attempt + 1})")
                return True
                
            except Exception as e:
                logger.warning(f"Email send attempt {attempt + 1} failed: {e}")
                if attempt < self.config.max_retries - 1:
                    time.sleep(self.config.retry_delay)
                else:
                    logger.error(f"Failed to send email after {self.config.max_retries} attempts")
                    return False
        
        return False
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Send an email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: HTML body (optional)
            attachments: List of attachments (optional)
            cc: CC recipients (optional)
            bcc: BCC recipients (optional)
        
        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Check rate limiting
            self._check_rate_limit()
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.config.from_name} <{self.config.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            if bcc:
                msg['Bcc'] = ', '.join(bcc)
            
            # Add body
            msg.attach(MIMEText(body, 'plain'))
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))
            
            # Add attachments
            if attachments:
                for attachment in attachments:
                    self._add_attachment(msg, attachment)
            
            # Send email
            return self._send_email_with_retry(msg)
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def _add_attachment(self, msg: MIMEMultipart, attachment: Dict[str, Any]):
        """Add attachment to email message."""
        try:
            with open(attachment['path'], 'rb') as f:
                part = MIMEBase('application', 'octet-stream')
                part.set_payload(f.read())
            
            encoders.encode_base64(part)
            part.add_header(
                'Content-Disposition',
                f'attachment; filename= {attachment.get("filename", os.path.basename(attachment["path"]))}'
            )
            msg.attach(part)
            
        except Exception as e:
            logger.error(f"Failed to add attachment {attachment.get('path')}: {e}")
    
    async def send_email_async(self, *args, **kwargs) -> bool:
        """Send email asynchronously."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self._executor, self.send_email, *args, **kwargs)
    
    def send_password_reset_email(self, to_email: str, reset_token: str, user_name: str = None) -> bool:
        """Send password reset email."""
        try:
            # Create reset URL (you may need to adjust this based on your frontend URL)
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3002')
            reset_url = f"{frontend_url}/reset-password?token={reset_token}"
            
            subject = "Sanalyze - Password Reset Request"
            
            # Plain text body
            body = f"""
Hello{' ' + user_name if user_name else ''},

You have requested to reset your password for your Sanalyze account.

Please click the following link to reset your password:
{reset_url}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please ignore this email.

Best regards,
Sanalyze Team
"""
            
            # HTML body
            html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - Sanalyze</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; }}
        .content {{ padding: 20px; background-color: #f9f9f9; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Sanalyze</h1>
            <h2>Password Reset Request</h2>
        </div>
        <div class="content">
            <p>Hello{' ' + user_name if user_name else ''},</p>
            <p>You have requested to reset your password for your Sanalyze account.</p>
            <p>Please click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="{reset_url}" class="button">Reset Password</a>
            </p>
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            <p>If you did not request this password reset, please ignore this email.</p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all;">{reset_url}</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>Sanalyze Team</p>
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
"""
            
            success = self.send_email(to_email, subject, body, html_body)
            
            if success:
                logger.info(f"Password reset email sent to {to_email}")
            else:
                logger.error(f"Failed to send password reset email to {to_email}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error sending password reset email to {to_email}: {e}")
            return False
    
    def send_notification_email(self, to_email: str, title: str, message: str, priority: str = "normal") -> bool:
        """Send notification email."""
        try:
            subject = f"Sanalyze Notification - {title}"
            
            body = f"""
Hello,

You have received a new notification from Sanalyze:

Title: {title}
Priority: {priority.upper()}

Message:
{message}

Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Best regards,
Sanalyze System
"""
            
            return self.send_email(to_email, subject, body)
            
        except Exception as e:
            logger.error(f"Error sending notification email to {to_email}: {e}")
            return False
    
    def send_admin_alert(self, title: str, message: str, severity: str = "info") -> bool:
        """Send alert email to admin."""
        if not self.config.admin_email:
            logger.warning("Admin email not configured, cannot send admin alert")
            return False
        
        try:
            subject = f"Sanalyze Admin Alert - {title} [{severity.upper()}]"
            
            body = f"""
Sanalyze System Alert

Title: {title}
Severity: {severity.upper()}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Details:
{message}

This is an automated alert from the Sanalyze system.
"""
            
            return self.send_email(self.config.admin_email, subject, body)
            
        except Exception as e:
            logger.error(f"Error sending admin alert: {e}")
            return False

# Global email service instance
_email_service = None

def get_email_service() -> EmailService:
    """Get the global email service instance."""
    global _email_service
    if _email_service is None:
        _email_service = EmailService()
    return _email_service

def is_email_configured() -> bool:
    """Check if email is properly configured."""
    try:
        config = EmailConfig()
        return config.is_configured
    except Exception:
        return False