# AI Agents Webapp - Integration Test

import os
import sys
import unittest
import json
from flask import Flask
from app import app as flask_app

class IntegrationTest(unittest.TestCase):
    """Integration tests for the AI Agents Webapp."""
    
    def setUp(self):
        """Set up the test client."""
        self.app = flask_app.test_client()
        self.app.testing = True
    
    def test_health_check(self):
        """Test the health check endpoint."""
        response = self.app.get('/api/health')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'healthy')
        self.assertEqual(len(data['components']), 7)  # Check all 7 components are present
    
    def test_index_page(self):
        """Test the index page loads correctly."""
        response = self.app.get('/')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<!DOCTYPE html>', response.data)
        self.assertIn(b'AI Agents Webapp', response.data)
    
    def test_planning_api(self):
        """Test the planning API endpoints."""
        # Create a plan
        response = self.app.post('/api/planning/create', 
                                json={'task': 'Test task for integration testing'})
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'success')
        self.assertIn('plan_id', data)
        
        plan_id = data['plan_id']
        
        # Get the plan
        response = self.app.get(f'/api/planning/get/{plan_id}')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'success')
        self.assertIn('plan', data)
        self.assertEqual(data['plan']['task'], 'Test task for integration testing')
    
    def test_tracking_api(self):
        """Test the tracking API endpoints."""
        # Create a plan first
        response = self.app.post('/api/planning/create', 
                                json={'task': 'Test task for tracking API'})
        plan_data = json.loads(response.data)
        plan_id = plan_data['plan_id']
        
        # Get the plan content
        response = self.app.get(f'/api/tracking/get/{plan_id}')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'success')
        self.assertIn('plan', data)
        self.assertIn('content', data['plan'])
        self.assertIn('steps', data['plan'])
    
    def test_indefinite_api(self):
        """Test the indefinite runner API endpoints."""
        # Create a plan first
        response = self.app.post('/api/planning/create', 
                                json={'task': 'Test task for indefinite API'})
        plan_data = json.loads(response.data)
        plan_id = plan_data['plan_id']
        
        # Start an indefinite agent
        response = self.app.post('/api/indefinite/start', 
                                json={
                                    'task': 'Test task for indefinite API',
                                    'plan_id': plan_id,
                                    'session_id': 'test_session_123'
                                })
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'success')
        
        # Get the agent status
        response = self.app.get('/api/indefinite/status/test_session_123')
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'success')
        self.assertIn('agent_status', data)
    
    def test_input_api(self):
        """Test the input handling API endpoints."""
        # Submit a task
        response = self.app.post('/api/input/submit-task', 
                                json={'task': 'Test task for input API'})
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data['status'], 'success')
        self.assertIn('plan_id', data)
        self.assertIn('session_id', data)

if __name__ == '__main__':
    unittest.main()
