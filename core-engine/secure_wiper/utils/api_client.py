"""
API Client for Secure Wiper

Handles communication with the backend API for certificate generation.
"""

import json
import time
import requests
from datetime import datetime, timezone
from pathlib import Path


class APIClient:
    """Client for communicating with the secure wiper backend API."""
    
    def __init__(self, config):
        """Initialize API client.
        
        Args:
            config: Configuration object
        """
        self.config = config
        self.base_url = config.get('api.base_url', 'http://localhost:3001')
        self.timeout = config.get('api.timeout', 30)
        self.retry_attempts = config.get('api.retry_attempts', 3)
        self.retry_delay = config.get('api.retry_delay', 1.0)
        
        # Create session with default headers
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'SecureWiper/1.0.0'
        })
    
    def submit_wipe_data(self, wipe_data):
        """Submit wipe data to the API for certificate generation.
        
        Args:
            wipe_data: Dictionary containing wipe operation results
            
        Returns:
            dict: API response
        """
        endpoint = f"{self.base_url}/api/wipe/submit"
        
        # Prepare data for submission
        submission_data = self._prepare_wipe_data(wipe_data)
        
        return self._make_request('POST', endpoint, json=submission_data)
    
    def upload_wipe_report(self, report_file_path):
        """Upload a wipe report file to the API.
        
        Args:
            report_file_path: Path to the wipe report JSON file
            
        Returns:
            dict: API response
        """
        endpoint = f"{self.base_url}/api/wipe/upload"
        
        try:
            with open(report_file_path, 'rb') as f:
                files = {'wipeReport': f}
                response = self.session.post(
                    endpoint,
                    files=files,
                    timeout=self.timeout
                )
                return response.json()
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to upload report: {e}'
            }
    
    def get_wipe_status(self, submission_id):
        """Get the status of a wipe submission.
        
        Args:
            submission_id: Unique submission ID
            
        Returns:
            dict: API response with status information
        """
        endpoint = f"{self.base_url}/api/wipe/status/{submission_id}"
        return self._make_request('GET', endpoint)
    
    def verify_certificate(self, certificate_id):
        """Verify a certificate by ID.
        
        Args:
            certificate_id: Certificate ID to verify
            
        Returns:
            dict: API response with verification results
        """
        endpoint = f"{self.base_url}/api/certificate/verify/{certificate_id}"
        return self._make_request('GET', endpoint)
    
    def download_certificate(self, certificate_id, output_path=None):
        """Download a certificate PDF.
        
        Args:
            certificate_id: Certificate ID to download
            output_path: Path to save the certificate (optional)
            
        Returns:
            dict: Download result
        """
        endpoint = f"{self.base_url}/api/certificate/download/{certificate_id}"
        
        try:
            response = self.session.get(endpoint, timeout=self.timeout)
            response.raise_for_status()
            
            # Determine output path
            if not output_path:
                output_path = f"certificate_{certificate_id[:8]}.pdf"
            
            # Save file
            output_file = Path(output_path)
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, 'wb') as f:
                f.write(response.content)
            
            return {
                'success': True,
                'file_path': str(output_file),
                'size': len(response.content)
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to download certificate: {e}'
            }
    
    def health_check(self):
        """Check API health status.
        
        Returns:
            dict: Health check response
        """
        endpoint = f"{self.base_url}/health"
        return self._make_request('GET', endpoint)
    
    def _prepare_wipe_data(self, wipe_data):
        """Prepare wipe data for API submission.
        
        Args:
            wipe_data: Raw wipe data dictionary
            
        Returns:
            dict: Prepared data for API submission
        """
        # Create a clean copy for submission
        submission_data = {
            'deviceId': wipe_data.get('device_id', ''),
            'serialNumber': wipe_data.get('serial_number', 'Unknown'),
            'algorithm': wipe_data.get('algorithm', 'unknown'),
            'passes': wipe_data.get('passes', 1),
            'startTime': wipe_data.get('start_time', ''),
            'endTime': wipe_data.get('end_time', ''),
            'status': wipe_data.get('status', 'unknown'),
            'verification': wipe_data.get('verification', False),
        }
        
        # Add optional fields if present
        if 'device_info' in wipe_data:
            submission_data['deviceInfo'] = wipe_data['device_info']
        
        if 'wipe_details' in wipe_data:
            submission_data['wipeDetails'] = wipe_data['wipe_details']
        
        if 'environment' in wipe_data:
            submission_data['environment'] = wipe_data['environment']
        
        if 'verification_result' in wipe_data:
            submission_data['verificationResult'] = wipe_data['verification_result']
        
        return submission_data
    
    def _make_request(self, method, url, **kwargs):
        """Make an HTTP request with retry logic.
        
        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            **kwargs: Additional request arguments
            
        Returns:
            dict: Response data or error information
        """
        last_error = None
        
        for attempt in range(self.retry_attempts):
            try:
                response = self.session.request(
                    method=method,
                    url=url,
                    timeout=self.timeout,
                    **kwargs
                )
                
                # Check if response is JSON
                try:
                    return response.json()
                except ValueError:
                    # Not JSON, return basic info
                    return {
                        'success': response.status_code < 400,
                        'status_code': response.status_code,
                        'content': response.text[:1000]  # Limit content size
                    }
                    
            except requests.exceptions.RequestException as e:
                last_error = e
                
                # Don't retry on client errors (4xx)
                if hasattr(e, 'response') and e.response is not None:
                    if 400 <= e.response.status_code < 500:
                        break
                
                # Wait before retry (except on last attempt)
                if attempt < self.retry_attempts - 1:
                    time.sleep(self.retry_delay * (attempt + 1))
        
        # All attempts failed
        return {
            'success': False,
            'error': f'Request failed after {self.retry_attempts} attempts: {last_error}'
        }
    
    def is_api_available(self):
        """Check if the API is available.
        
        Returns:
            bool: True if API is available
        """
        try:
            response = self.health_check()
            return response.get('success', False) or response.get('status') == 'OK'
        except Exception:
            return False
    
    def get_api_info(self):
        """Get API information.
        
        Returns:
            dict: API information
        """
        return {
            'base_url': self.base_url,
            'timeout': self.timeout,
            'retry_attempts': self.retry_attempts,
            'available': self.is_api_available()
        }
