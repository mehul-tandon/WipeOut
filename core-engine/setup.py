from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="wipeout",
    version="1.0.0",
    author="Secure Data Solutions",
    author_email="support@securedatasolutions.com",
    description="NIST SP 800-88 compliant secure data wiping tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/secure-data-solutions/secure-wiper",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: System Administrators",
        "Intended Audience :: Information Technology",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Security",
        "Topic :: System :: Systems Administration",
        "Topic :: Utilities",
    ],
    python_requires=">=3.8",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "wipeout=secure_wiper.main:main",
        ],
    },
    include_package_data=True,
    package_data={
        "secure_wiper": ["config/*.yaml", "templates/*.json"],
    },
)
