"""Demo script to generate an assessment invite using the API.

Usage:
    python demo_invite.py <assessment_id> <candidate_email>

This script calls the local API (via `requests`) to create an invite using the admin token.
"""
import sys
import requests
import os

API_URL = os.environ.get('API_URL', 'http://localhost:8000')
ADMIN_TOKEN = os.environ.get('ADMIN_TOKEN', '')  # Provide a JWT token for admin


def main():
    if len(sys.argv) < 3:
        print('Usage: python demo_invite.py <assessment_id> <candidate_email>')
        return

    assessment_id = sys.argv[1]
    email = sys.argv[2]

    url = f"{API_URL}/api/v1/assessments/{assessment_id}/invite"
    headers = {
        'Authorization': f'Bearer {ADMIN_TOKEN}'
    }
    data = {
        'emails': [email],
        'expires_in_hours': 24,
        'message': 'Please take this assessment.'
    }

    r = requests.post(url, json=data, headers=headers)
    print(r.status_code)
    try:
        print(r.json())
    except Exception:
        print(r.text)


if __name__ == '__main__':
    main()
