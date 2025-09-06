"""
NIST SP 800-88 Algorithm Implementation

Implements the NIST Special Publication 800-88 Rev. 1 guidelines for media sanitization.
"""

from .base import BaseAlgorithm


class NISTAlgorithm(BaseAlgorithm):
    """NIST SP 800-88 Rev. 1 compliant wiping algorithm.
    
    NIST SP 800-88 defines three levels of sanitization:
    - Clear: Logical techniques to sanitize data (1 pass)
    - Purge: Physical techniques to sanitize data (3 passes)
    - Destroy: Physical destruction of the media
    
    This implementation uses the Purge method with 3 passes:
    1. Write zeros (0x00)
    2. Write ones (0xFF) 
    3. Write random data
    """
    
    DEFAULT_PASSES = 3
    ALGORITHM_NAME = "NIST SP 800-88"
    DESCRIPTION = "NIST Special Publication 800-88 Rev. 1 Purge method (3 passes)"
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            bytes or str: The pattern to write
        """
        self.validate_pass_number(pass_number)
        
        patterns = [
            b'\x00',  # Pass 1: All zeros
            b'\xFF',  # Pass 2: All ones
            'random'  # Pass 3: Random data
        ]
        
        pattern = patterns[pass_number]
        self.logger.debug(f"NIST pass {pass_number + 1}: {self.get_pattern_description(pass_number)}")
        
        return pattern
    
    def get_pattern_description(self, pass_number):
        """Get a human-readable description of the pattern for a pass.
        
        Args:
            pass_number: The pass number
            
        Returns:
            str: Description of the pattern
        """
        descriptions = [
            "Write zeros (0x00)",
            "Write ones (0xFF)",
            "Write random data"
        ]
        
        if 0 <= pass_number < len(descriptions):
            return descriptions[pass_number]
        return f"Pass {pass_number + 1} pattern"


class NISTClearAlgorithm(BaseAlgorithm):
    """NIST SP 800-88 Clear method (single pass).
    
    The Clear method uses logical techniques to sanitize data.
    This is suitable for data that will be reused in the same environment.
    """
    
    DEFAULT_PASSES = 1
    ALGORITHM_NAME = "NIST SP 800-88 Clear"
    DESCRIPTION = "NIST Special Publication 800-88 Rev. 1 Clear method (1 pass)"
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            bytes: The pattern to write
        """
        self.validate_pass_number(pass_number)
        
        # Single pass with zeros
        self.logger.debug(f"NIST Clear pass {pass_number + 1}: Write zeros")
        return b'\x00'
    
    def get_pattern_description(self, pass_number):
        """Get a human-readable description of the pattern for a pass.
        
        Args:
            pass_number: The pass number
            
        Returns:
            str: Description of the pattern
        """
        return "Write zeros (0x00)"
