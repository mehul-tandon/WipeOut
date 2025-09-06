"""
Gutmann Algorithm Implementation

Implements Peter Gutmann's 35-pass secure deletion algorithm.
"""

from .base import BaseAlgorithm


class GutmannAlgorithm(BaseAlgorithm):
    """Gutmann 35-pass secure deletion algorithm.
    
    Peter Gutmann's algorithm uses 35 passes with specific patterns designed
    to defeat magnetic force microscopy and other advanced data recovery techniques.
    
    The algorithm includes:
    - 4 random passes
    - 27 specific patterns targeting magnetic media characteristics
    - 4 more random passes
    """
    
    DEFAULT_PASSES = 35
    ALGORITHM_NAME = "Gutmann"
    DESCRIPTION = "Peter Gutmann's 35-pass secure deletion algorithm"
    
    # Gutmann's specific patterns (passes 5-31)
    GUTMANN_PATTERNS = [
        b'\x55\x55\x55',  # Pattern 1
        b'\xAA\xAA\xAA',  # Pattern 2
        b'\x92\x49\x24',  # Pattern 3
        b'\x49\x24\x92',  # Pattern 4
        b'\x24\x92\x49',  # Pattern 5
        b'\x00\x00\x00',  # Pattern 6
        b'\x11\x11\x11',  # Pattern 7
        b'\x22\x22\x22',  # Pattern 8
        b'\x33\x33\x33',  # Pattern 9
        b'\x44\x44\x44',  # Pattern 10
        b'\x55\x55\x55',  # Pattern 11
        b'\x66\x66\x66',  # Pattern 12
        b'\x77\x77\x77',  # Pattern 13
        b'\x88\x88\x88',  # Pattern 14
        b'\x99\x99\x99',  # Pattern 15
        b'\xAA\xAA\xAA',  # Pattern 16
        b'\xBB\xBB\xBB',  # Pattern 17
        b'\xCC\xCC\xCC',  # Pattern 18
        b'\xDD\xDD\xDD',  # Pattern 19
        b'\xEE\xEE\xEE',  # Pattern 20
        b'\xFF\xFF\xFF',  # Pattern 21
        b'\x92\x49\x24',  # Pattern 22
        b'\x49\x24\x92',  # Pattern 23
        b'\x24\x92\x49',  # Pattern 24
        b'\x6D\xB6\xDB',  # Pattern 25
        b'\xB6\xDB\x6D',  # Pattern 26
        b'\xDB\x6D\xB6',  # Pattern 27
    ]
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            bytes or str: The pattern to write
        """
        self.validate_pass_number(pass_number)
        
        # Passes 1-4: Random
        if pass_number < 4:
            self.logger.debug(f"Gutmann pass {pass_number + 1}: Random data")
            return 'random'
        
        # Passes 5-31: Specific patterns
        elif pass_number < 31:
            pattern_index = pass_number - 4
            pattern = self.GUTMANN_PATTERNS[pattern_index]
            self.logger.debug(f"Gutmann pass {pass_number + 1}: Pattern {pattern.hex()}")
            return pattern
        
        # Passes 32-35: Random
        else:
            self.logger.debug(f"Gutmann pass {pass_number + 1}: Random data")
            return 'random'
    
    def get_pattern_description(self, pass_number):
        """Get a human-readable description of the pattern for a pass.
        
        Args:
            pass_number: The pass number
            
        Returns:
            str: Description of the pattern
        """
        if pass_number < 4:
            return f"Random data (initial pass {pass_number + 1})"
        elif pass_number < 31:
            pattern_index = pass_number - 4
            pattern = self.GUTMANN_PATTERNS[pattern_index]
            return f"Specific pattern {pattern_index + 1}: {pattern.hex()}"
        else:
            return f"Random data (final pass {pass_number - 30})"


class GutmannReducedAlgorithm(BaseAlgorithm):
    """Reduced Gutmann algorithm with key patterns only.
    
    A simplified version of Gutmann's algorithm using only the most
    important patterns. This provides good security with fewer passes.
    """
    
    DEFAULT_PASSES = 10
    ALGORITHM_NAME = "Gutmann Reduced"
    DESCRIPTION = "Reduced Gutmann algorithm with key patterns (10 passes)"
    
    def get_pattern(self, pass_number):
        """Get the pattern for a specific pass.
        
        Args:
            pass_number: The pass number (0-based)
            
        Returns:
            bytes or str: The pattern to write
        """
        self.validate_pass_number(pass_number)
        
        patterns = [
            'random',         # Pass 1: Random
            b'\x00',         # Pass 2: Zeros
            b'\xFF',         # Pass 3: Ones
            b'\x55\x55\x55', # Pass 4: 0x555555
            b'\xAA\xAA\xAA', # Pass 5: 0xAAAAAA
            b'\x92\x49\x24', # Pass 6: 0x924924
            b'\x49\x24\x92', # Pass 7: 0x492492
            b'\x6D\xB6\xDB', # Pass 8: 0x6DB6DB
            'random',         # Pass 9: Random
            'random'          # Pass 10: Random
        ]
        
        pattern = patterns[pass_number]
        self.logger.debug(f"Gutmann Reduced pass {pass_number + 1}: {self.get_pattern_description(pass_number)}")
        
        return pattern
    
    def get_pattern_description(self, pass_number):
        """Get a human-readable description of the pattern for a pass.
        
        Args:
            pass_number: The pass number
            
        Returns:
            str: Description of the pattern
        """
        descriptions = [
            "Random data",
            "Write zeros (0x00)",
            "Write ones (0xFF)",
            "Pattern 0x555555",
            "Pattern 0xAAAAAA",
            "Pattern 0x924924",
            "Pattern 0x492492",
            "Pattern 0x6DB6DB",
            "Random data",
            "Random data"
        ]
        
        if 0 <= pass_number < len(descriptions):
            return descriptions[pass_number]
        return f"Pass {pass_number + 1} pattern"
