"""
WipeOut - NIST SP 800-88 Compliant Data Erasure Tool

A professional-grade secure data erasure solution with tamper-proof certification.
"""

__version__ = "1.0.0"
__author__ = "Secure Data Solutions"
__email__ = "support@securedatasolutions.com"
__license__ = "MIT"

from .main import main
from .wiper import SecureWiper
from .algorithms import *
from .utils import *

__all__ = [
    "main",
    "SecureWiper",
    "__version__",
    "__author__",
    "__email__",
    "__license__",
]
