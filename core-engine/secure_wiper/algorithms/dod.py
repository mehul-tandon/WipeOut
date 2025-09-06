"""
DoD 5220.22-M Algorithm Implementation

Implements the US Department of Defense 5220.22-M standard for data sanitization.
"""

from .base import BaseAlgorithm


class DoDAlgorithm(BaseAlgorithm):
    """DoD 5220.22-M compliant wiping algorithm.
    
    The DoD 5220.22-M standard specifies a 3-pass overwrite:
    1. Write a character (0x00)
    2. Write the complement of the character (0xFF)
    3. Write a random character and verify
    
    This is one of the most widely recognized standards for secure data erasure.
    """
    
    DEFAULT_PASSES = 3
    ALGORITHM_NAME = "DoD 5220.22-M"
    DESCRIPTION = "US Department of Defense 5220.22-M standard (3 passes)"
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            bytes or str: The pattern to write
        """
        self.validate_pass_number(pass_number)
        
        patterns = [
            b'\x00',  # Pass 1: Write zeros
            b'\xFF',  # Pass 2: Write ones (complement)
            'random'  # Pass 3: Write random data
        ]
        
        pattern = patterns[pass_number]
        self.logger.debug(f"DoD 5220.22-M pass {pass_number + 1}: {self.get_pattern_description(pass_number)}")
        
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
            "Write ones/complement (0xFF)",
            "Write random data with verification"
        ]
        
        if 0 <= pass_number < len(descriptions):
            return descriptions[pass_number]
        return f"Pass {pass_number + 1} pattern"


class DoDExtendedAlgorithm(BaseAlgorithm):
    """Extended DoD algorithm with 7 passes.
    
    Some interpretations of DoD 5220.22-M specify 7 passes:
    1. 0x00
    2. 0xFF
    3. Random
    4. 0x00
    5. 0xFF
    6. Random
    7. 0x00
    """
    
    DEFAULT_PASSES = 7
    ALGORITHM_NAME = "DoD 5220.22-M Extended"
    DESCRIPTION = "Extended DoD 5220.22-M standard (7 passes)"
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            bytes or str: The pattern to write
        """
        self.validate_pass_number(pass_number)
        
        patterns = [
            b'\x00',  # Pass 1: Write zeros
            b'\xFF',  # Pass 2: Write ones
            'random', # Pass 3: Write random
            b'\x00',  # Pass 4: Write zeros
            b'\xFF',  # Pass 5: Write ones
            'random', # Pass 6: Write random
            b'\x00'   # Pass 7: Write zeros
        ]
        
        pattern = patterns[pass_number]
        self.logger.debug(f"DoD Extended pass {pass_number + 1}: {self.get_pattern_description(pass_number)}")
        
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
            "Write random data",
            "Write zeros (0x00)",
            "Write ones (0xFF)",
            "Write random data",
            "Write zeros (0x00)"
        ]
        
        if 0 <= pass_number < len(descriptions):
            return descriptions[pass_number]
        return f"Pass {pass_number + 1} pattern"
