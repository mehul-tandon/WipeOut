"""
Random Algorithm Implementation

Implements random data wiping algorithms with configurable passes.
"""

from .base import BaseAlgorithm


class RandomAlgorithm(BaseAlgorithm):
    """Random data wiping algorithm.
    
    Uses cryptographically secure random data for all passes.
    The number of passes can be configured (default 3).
    """
    
    DEFAULT_PASSES = 3
    ALGORITHM_NAME = "Random"
    DESCRIPTION = "Cryptographically secure random data (configurable passes)"
    
    def __init__(self, logger, passes=None):
        """Initialize the random algorithm.
        
        Args:
            logger: Logger instance
            passes: Number of passes (None for default)
        """
        super().__init__(logger)
        if passes is not None:
            self.DEFAULT_PASSES = passes
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            str: Always returns 'random' for random data
        """
        self.validate_pass_number(pass_number)
        
        self.logger.debug(f"Random pass {pass_number + 1}: Cryptographically secure random data")
        return 'random'
    
    def get_pattern_description(self, pass_number):
        """Get a human-readable description of the pattern for a pass.
        
        Args:
            pass_number: The pass number
            
        Returns:
            str: Description of the pattern
        """
        return f"Cryptographically secure random data (pass {pass_number + 1})"


class SingleRandomAlgorithm(BaseAlgorithm):
    """Single pass random data algorithm.
    
    Uses one pass of cryptographically secure random data.
    Fast but provides less security than multi-pass algorithms.
    """
    
    DEFAULT_PASSES = 1
    ALGORITHM_NAME = "Single Random"
    DESCRIPTION = "Single pass cryptographically secure random data"
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            str: Always returns 'random' for random data
        """
        self.validate_pass_number(pass_number)
        
        self.logger.debug("Single Random pass: Cryptographically secure random data")
        return 'random'
    
    def get_pattern_description(self, pass_number):
        """Get a human-readable description of the pattern for a pass.
        
        Args:
            pass_number: The pass number
            
        Returns:
            str: Description of the pattern
        """
        return "Cryptographically secure random data"


class ZeroRandomAlgorithm(BaseAlgorithm):
    """Zero then random algorithm.
    
    Two-pass algorithm:
    1. Write zeros
    2. Write random data
    
    Good balance between speed and security.
    """
    
    DEFAULT_PASSES = 2
    ALGORITHM_NAME = "Zero-Random"
    DESCRIPTION = "Two-pass algorithm: zeros then random data"
    
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
            'random'  # Pass 2: Write random data
        ]
        
        pattern = patterns[pass_number]
        self.logger.debug(f"Zero-Random pass {pass_number + 1}: {self.get_pattern_description(pass_number)}")
        
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
            "Cryptographically secure random data"
        ]
        
        if 0 <= pass_number < len(descriptions):
            return descriptions[pass_number]
        return f"Pass {pass_number + 1} pattern"


class CustomPatternAlgorithm(BaseAlgorithm):
    """Custom pattern algorithm.
    
    Allows specification of custom patterns for wiping.
    Useful for specific compliance requirements or testing.
    """
    
    def __init__(self, logger, patterns):
        """Initialize the custom pattern algorithm.
        
        Args:
            logger: Logger instance
            patterns: List of patterns (bytes or 'random')
        """
        super().__init__(logger)
        self.patterns = patterns
        self.DEFAULT_PASSES = len(patterns)
        self.ALGORITHM_NAME = "Custom Pattern"
        self.DESCRIPTION = f"Custom pattern algorithm ({len(patterns)} passes)"
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            bytes or str: The pattern to write
        """
        self.validate_pass_number(pass_number)
        
        pattern = self.patterns[pass_number]
        self.logger.debug(f"Custom pass {pass_number + 1}: {self.get_pattern_description(pass_number)}")
        
        return pattern
    
    def get_pattern_description(self, pass_number):
        """Get a human-readable description of the pattern for a pass.
        
        Args:
            pass_number: The pass number
            
        Returns:
            str: Description of the pattern
        """
        if 0 <= pass_number < len(self.patterns):
            pattern = self.patterns[pass_number]
            if pattern == 'random':
                return "Random data"
            elif isinstance(pattern, bytes):
                return f"Pattern: {pattern.hex()}"
            else:
                return f"Pattern: {pattern}"
        return f"Pass {pass_number + 1} pattern"
