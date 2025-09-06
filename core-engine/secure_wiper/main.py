#!/usr/bin/env python3
"""
WipeOut - Main CLI Entry Point

NIST SP 800-88 compliant secure data erasure tool with tamper-proof certification.
"""

import sys
import os
import json
import platform
import argparse
from datetime import datetime
from pathlib import Path

import click
from colorama import init, Fore, Style

from .wiper import SecureWiper
from .utils.device_detector import DeviceDetector
from .utils.logger import setup_logger
from .utils.config import Config
from .utils.api_client import APIClient

# Initialize colorama for cross-platform colored output
init(autoreset=True)

def print_banner():
    """Print the application banner."""
    banner = f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════════════╗
║                          WIPEOUT                            ║
║              NIST SP 800-88 Compliant Data Erasure          ║
║                                                              ║
║  {Fore.YELLOW}⚠️  WARNING: This tool will PERMANENTLY destroy data ⚠️{Fore.CYAN}   ║
║              Use with extreme caution!                       ║
╚══════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
"""
    print(banner)

def print_system_info():
    """Print system information."""
    print(f"{Fore.GREEN}System Information:{Style.RESET_ALL}")
    print(f"  OS: {platform.system()} {platform.release()}")
    print(f"  Architecture: {platform.machine()}")
    print(f"  Python: {platform.python_version()}")
    print(f"  User: {os.getenv('USER', os.getenv('USERNAME', 'Unknown'))}")
    print()

@click.group()
@click.version_option(version="1.0.0")
@click.option('--config', '-c', type=click.Path(exists=True), help='Configuration file path')
@click.option('--verbose', '-v', is_flag=True, help='Enable verbose logging')
@click.option('--quiet', '-q', is_flag=True, help='Suppress non-essential output')
@click.pass_context
def cli(ctx, config, verbose, quiet):
    """WipeOut - NIST SP 800-88 Compliant Data Erasure Tool"""
    ctx.ensure_object(dict)
    
    # Setup logging
    log_level = 'DEBUG' if verbose else 'WARNING' if quiet else 'INFO'
    ctx.obj['logger'] = setup_logger(log_level)
    
    # Load configuration
    ctx.obj['config'] = Config(config_file=config)
    
    # Initialize API client
    ctx.obj['api_client'] = APIClient(ctx.obj['config'])

@cli.command()
@click.pass_context
def list_devices(ctx):
    """List available storage devices."""
    print_banner()
    print_system_info()
    
    logger = ctx.obj['logger']
    detector = DeviceDetector(logger)
    
    try:
        devices = detector.get_storage_devices()
        
        if not devices:
            print(f"{Fore.YELLOW}No storage devices found.{Style.RESET_ALL}")
            return
        
        print(f"{Fore.GREEN}Available Storage Devices:{Style.RESET_ALL}")
        print("=" * 80)
        
        for i, device in enumerate(devices, 1):
            status_color = Fore.GREEN if device.get('writable', False) else Fore.RED
            print(f"{i:2d}. {Fore.CYAN}{device['path']}{Style.RESET_ALL}")
            print(f"     Name: {device.get('name', 'Unknown')}")
            print(f"     Size: {device.get('size_human', 'Unknown')}")
            print(f"     Type: {device.get('type', 'Unknown')}")
            print(f"     Status: {status_color}{device.get('status', 'Unknown')}{Style.RESET_ALL}")
            print(f"     Writable: {status_color}{'Yes' if device.get('writable', False) else 'No'}{Style.RESET_ALL}")
            if device.get('mount_points'):
                print(f"     Mounted: {', '.join(device['mount_points'])}")
            print()
            
    except Exception as e:
        logger.error(f"Failed to list devices: {e}")
        print(f"{Fore.RED}Error: Failed to list devices - {e}{Style.RESET_ALL}")
        sys.exit(1)

@cli.command()
@click.argument('device_path', type=click.Path(exists=True))
@click.option('--algorithm', '-a', 
              type=click.Choice(['nist', 'dod', 'gutmann', 'random']), 
              default='nist',
              help='Wiping algorithm to use')
@click.option('--passes', '-p', type=int, help='Number of passes (overrides algorithm default)')
@click.option('--verify', is_flag=True, help='Verify wiping after completion')
@click.option('--force', is_flag=True, help='Skip confirmation prompts')
@click.option('--output', '-o', type=click.Path(), help='Output file for wipe report')
@click.pass_context
def wipe(ctx, device_path, algorithm, passes, verify, force, output):
    """Securely wipe a storage device."""
    print_banner()
    
    logger = ctx.obj['logger']
    config = ctx.obj['config']
    api_client = ctx.obj['api_client']
    
    # Initialize device detector and wiper
    detector = DeviceDetector(logger)
    wiper = SecureWiper(logger, config)
    
    try:
        # Get device information
        device_info = detector.get_device_info(device_path)
        if not device_info:
            print(f"{Fore.RED}Error: Could not get information for device {device_path}{Style.RESET_ALL}")
            sys.exit(1)
        
        # Display device information
        print(f"{Fore.GREEN}Device Information:{Style.RESET_ALL}")
        print(f"  Path: {device_info['path']}")
        print(f"  Name: {device_info.get('name', 'Unknown')}")
        print(f"  Size: {device_info.get('size_human', 'Unknown')} ({device_info.get('size_bytes', 0):,} bytes)")
        print(f"  Type: {device_info.get('type', 'Unknown')}")
        print()
        
        # Check if device is writable
        if not device_info.get('writable', False):
            print(f"{Fore.RED}Error: Device {device_path} is not writable{Style.RESET_ALL}")
            sys.exit(1)
        
        # Check for mounted filesystems
        if device_info.get('mount_points'):
            print(f"{Fore.YELLOW}Warning: Device has mounted filesystems:{Style.RESET_ALL}")
            for mount in device_info['mount_points']:
                print(f"  - {mount}")
            print(f"{Fore.YELLOW}Please unmount all filesystems before wiping.{Style.RESET_ALL}")
            if not force:
                sys.exit(1)
        
        # Display wiping parameters
        actual_passes = passes or wiper.get_algorithm_passes(algorithm)
        print(f"{Fore.GREEN}Wiping Parameters:{Style.RESET_ALL}")
        print(f"  Algorithm: {algorithm.upper()}")
        print(f"  Passes: {actual_passes}")
        print(f"  Verification: {'Enabled' if verify else 'Disabled'}")
        print()
        
        # Confirmation prompt
        if not force:
            print(f"{Fore.RED}⚠️  WARNING: This operation will PERMANENTLY destroy all data on {device_path} ⚠️{Style.RESET_ALL}")
            print(f"{Fore.RED}This action cannot be undone!{Style.RESET_ALL}")
            print()
            
            confirmation = input(f"Type 'WIPE' to confirm: ")
            if confirmation != 'WIPE':
                print("Operation cancelled.")
                sys.exit(0)
        
        # Perform the wipe
        print(f"{Fore.GREEN}Starting secure wipe...{Style.RESET_ALL}")
        
        wipe_result = wiper.wipe_device(
            device_path=device_path,
            algorithm=algorithm,
            passes=actual_passes,
            verify=verify,
            device_info=device_info
        )
        
        # Display results
        if wipe_result['status'] == 'success':
            print(f"\n{Fore.GREEN}✅ Wipe completed successfully!{Style.RESET_ALL}")
        else:
            print(f"\n{Fore.RED}❌ Wipe failed or completed with errors{Style.RESET_ALL}")
        
        print(f"Duration: {wipe_result['duration']}")
        print(f"Status: {wipe_result['status']}")
        
        if wipe_result.get('errors'):
            print(f"Errors: {len(wipe_result['errors'])}")
        
        # Save report
        report_file = output or f"wipe_report_{wipe_result['submission_id']}.json"
        with open(report_file, 'w') as f:
            json.dump(wipe_result, f, indent=2, default=str)
        
        print(f"Report saved to: {report_file}")
        
        # Submit to API if configured
        if config.get('api.enabled', True):
            try:
                print(f"\n{Fore.CYAN}Submitting wipe report to certification service...{Style.RESET_ALL}")
                cert_result = api_client.submit_wipe_data(wipe_result)
                
                if cert_result.get('success'):
                    print(f"{Fore.GREEN}✅ Certificate generated successfully!{Style.RESET_ALL}")
                    if cert_result.get('data', {}).get('certificate', {}).get('downloadUrl'):
                        print(f"Certificate URL: {cert_result['data']['certificate']['downloadUrl']}")
                else:
                    print(f"{Fore.YELLOW}⚠️  Certificate generation failed: {cert_result.get('error', 'Unknown error')}{Style.RESET_ALL}")
                    
            except Exception as e:
                logger.error(f"Failed to submit wipe data: {e}")
                print(f"{Fore.YELLOW}⚠️  Failed to submit to certification service: {e}{Style.RESET_ALL}")
        
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Operation cancelled by user{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Wipe operation failed: {e}")
        print(f"{Fore.RED}Error: {e}{Style.RESET_ALL}")
        sys.exit(1)

@cli.command()
@click.argument('report_file', type=click.Path(exists=True))
@click.pass_context
def verify_report(ctx, report_file):
    """Verify a wipe report file."""
    logger = ctx.obj['logger']
    
    try:
        with open(report_file, 'r') as f:
            report_data = json.load(f)
        
        print(f"{Fore.GREEN}Wipe Report Verification:{Style.RESET_ALL}")
        print(f"  File: {report_file}")
        print(f"  Submission ID: {report_data.get('submission_id', 'Unknown')}")
        print(f"  Device: {report_data.get('device_id', 'Unknown')}")
        print(f"  Status: {report_data.get('status', 'Unknown')}")
        print(f"  Algorithm: {report_data.get('algorithm', 'Unknown')}")
        print(f"  Timestamp: {report_data.get('start_time', 'Unknown')}")
        
        # Basic validation
        required_fields = ['submission_id', 'device_id', 'status', 'algorithm', 'start_time', 'end_time']
        missing_fields = [field for field in required_fields if field not in report_data]
        
        if missing_fields:
            print(f"{Fore.RED}❌ Report validation failed - missing fields: {', '.join(missing_fields)}{Style.RESET_ALL}")
        else:
            print(f"{Fore.GREEN}✅ Report structure is valid{Style.RESET_ALL}")
            
    except Exception as e:
        logger.error(f"Failed to verify report: {e}")
        print(f"{Fore.RED}Error: Failed to verify report - {e}{Style.RESET_ALL}")
        sys.exit(1)

def main():
    """Main entry point."""
    try:
        cli()
    except KeyboardInterrupt:
        print(f"\n{Fore.YELLOW}Operation cancelled by user{Style.RESET_ALL}")
        sys.exit(1)
    except Exception as e:
        print(f"{Fore.RED}Unexpected error: {e}{Style.RESET_ALL}")
        sys.exit(1)

if __name__ == '__main__':
    main()
