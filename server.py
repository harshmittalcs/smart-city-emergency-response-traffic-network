"""
Smart City Emergency Response System - Python Web Runner
Standard library only (Zero dependencies required).
Runs the frontend web dashboard and serves static files + API.
"""

import os
import sys
import json
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.request

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class SmartCityHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

def run_server():
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, SmartCityHandler)
    url = f"http://localhost:{PORT}"
    
    print("=" * 60)
    print("  SMART CITY EMERGENCY RESPONSE SYSTEM - FRONTEND SERVER")
    print("=" * 60)
    print(f"  * Web Dashboard URL: {url}")
    print("  * Serving index.html, style.css, app.js")
    print("  * Press Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        webbrowser.open(url)
    except Exception:
        pass

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == '__main__':
    run_server()
