"""
Base Algorithm Class

Defines the interface for all wiping algorithms.
"""

from abc import ABC, abstractmethod


class BaseAlgorithm(ABC):
    """Base class for all wiping algorithms."""
    
    DEFAULT_PASSES = 1
    ALGORITHM_NAME = "Base"
    DESCRIPTION = "Base algorithm class"
    
    def __init__(self, logger):
        """Initialize the algorithm.
        
        Args:
            logger: Logger instance
        """
        self.logger = logger
    
    @abstractmethod
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            bytes or str: The pattern to write, or 'random' for random data
        """
        pass
    
    def get_passes(self):
        """Get the number of passes for this algorithm.
        
        Returns:
            int: Number of passes
        """
        return self.DEFAULT_PASSES
    
    def get_name(self):
        """Get the algorithm name.
        
        Returns:
            str: Algorithm name
        """
        return self.ALGORITHM_NAME
    
    def get_description(self):
        """Get the algorithm description.
        
        Returns:
            str: Algorithm description
        """
        return self.DESCRIPTION
    
    def validate_pass_number(self, pass_number):
        """Validate that the pass number is valid for this algorithm.
        
        Args:
            pass_number: The pass number to validate
            
        Raises:
            ValueError: If pass number is invalid
        """
        if pass_number < 0 or pass_number >= self.DEFAULT_PASSES:
            raise ValueError(f"Invalid pass number {pass_number} for {self.ALGORITHM_NAME} algorithm")
    
    def get_pattern_description(self, pass_number):
        """Get a human-readable description of the pattern for a pass.
        
        Args:
            pass_number: The pass number
            
        Returns:
            str: Description of the pattern
        """
        return f"Pass {pass_number + 1} pattern"
