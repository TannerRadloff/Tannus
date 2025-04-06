import os
import time
import logging
import asyncio
from functools import wraps
from flask import Flask, request, jsonify, g

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("performance.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("performance_optimizer")

class PerformanceOptimizer:
    """
    Optimizes the performance of the AI agents webapp.
    Provides caching, request throttling, and performance monitoring.
    """
    
    def __init__(self):
        """Initialize the PerformanceOptimizer."""
        self.cache = {}
        self.cache_ttl = {}
        self.request_counts = {}
        self.last_cleanup = time.time()
        self.cleanup_interval = 300  # 5 minutes
        
        # Performance metrics
        self.endpoint_metrics = {}
        
        # Configuration
        self.max_requests_per_minute = 60
        self.default_cache_ttl = 300  # 5 minutes
        self.plan_cache_ttl = 60  # 1 minute
        self.status_cache_ttl = 10  # 10 seconds
    
    def cache_result(self, key, result, ttl=None):
        """
        Cache a result with a time-to-live.
        
        Args:
            key (str): The cache key
            result: The result to cache
            ttl (int, optional): Time-to-live in seconds. Defaults to default_cache_ttl.
        """
        if ttl is None:
            ttl = self.default_cache_ttl
        
        self.cache[key] = result
        self.cache_ttl[key] = time.time() + ttl
    
    def get_cached_result(self, key):
        """
        Get a cached result if it exists and is not expired.
        
        Args:
            key (str): The cache key
            
        Returns:
            The cached result, or None if not found or expired
        """
        if key in self.cache and time.time() < self.cache_ttl.get(key, 0):
            return self.cache[key]
        
        return None
    
    def cleanup_cache(self):
        """Clean up expired cache entries."""
        now = time.time()
        
        # Only clean up every cleanup_interval seconds
        if now - self.last_cleanup < self.cleanup_interval:
            return
        
        self.last_cleanup = now
        
        # Remove expired cache entries
        expired_keys = [k for k, ttl in self.cache_ttl.items() if now > ttl]
        for key in expired_keys:
            if key in self.cache:
                del self.cache[key]
            if key in self.cache_ttl:
                del self.cache_ttl[key]
        
        # Reset request counts older than 1 minute
        expired_request_counts = [k for k, t in self.request_counts.items() 
                                if now - t['timestamp'] > 60]
        for key in expired_request_counts:
            del self.request_counts[key]
    
    def throttle_request(self, ip_address):
        """
        Check if a request should be throttled based on IP address.
        
        Args:
            ip_address (str): The IP address
            
        Returns:
            bool: True if request should be throttled, False otherwise
        """
        now = time.time()
        
        if ip_address not in self.request_counts:
            self.request_counts[ip_address] = {
                'count': 1,
                'timestamp': now
            }
            return False
        
        # Reset count if more than a minute has passed
        if now - self.request_counts[ip_address]['timestamp'] > 60:
            self.request_counts[ip_address] = {
                'count': 1,
                'timestamp': now
            }
            return False
        
        # Increment count
        self.request_counts[ip_address]['count'] += 1
        
        # Throttle if too many requests
        return self.request_counts[ip_address]['count'] > self.max_requests_per_minute
    
    def record_endpoint_metrics(self, endpoint, duration):
        """
        Record performance metrics for an endpoint.
        
        Args:
            endpoint (str): The endpoint
            duration (float): The request duration in seconds
        """
        if endpoint not in self.endpoint_metrics:
            self.endpoint_metrics[endpoint] = {
                'count': 0,
                'total_duration': 0,
                'min_duration': float('inf'),
                'max_duration': 0
            }
        
        metrics = self.endpoint_metrics[endpoint]
        metrics['count'] += 1
        metrics['total_duration'] += duration
        metrics['min_duration'] = min(metrics['min_duration'], duration)
        metrics['max_duration'] = max(metrics['max_duration'], duration)
    
    def get_endpoint_metrics(self):
        """
        Get performance metrics for all endpoints.
        
        Returns:
            dict: The endpoint metrics
        """
        result = {}
        
        for endpoint, metrics in self.endpoint_metrics.items():
            count = metrics['count']
            if count > 0:
                avg_duration = metrics['total_duration'] / count
                result[endpoint] = {
                    'count': count,
                    'avg_duration': avg_duration,
                    'min_duration': metrics['min_duration'],
                    'max_duration': metrics['max_duration']
                }
        
        return result
    
    def optimize_agent_execution(self, agent_runner):
        """
        Optimize the execution of agents by the agent runner.
        
        Args:
            agent_runner: The agent runner to optimize
        """
        # Patch the agent runner's _run_agent_indefinitely method to include performance optimizations
        original_run_agent = agent_runner._run_agent_indefinitely
        
        @wraps(original_run_agent)
        async def optimized_run_agent(session_id):
            # Log the start of agent execution
            logger.info(f"Starting agent execution for session {session_id}")
            start_time = time.time()
            
            # Call the original method
            result = await original_run_agent(session_id)
            
            # Log the end of agent execution
            duration = time.time() - start_time
            logger.info(f"Completed agent execution for session {session_id} in {duration:.2f} seconds")
            
            return result
        
        # Replace the original method with the optimized one
        agent_runner._run_agent_indefinitely = optimized_run_agent
    
    def optimize_plan_updates(self, plan_updater):
        """
        Optimize plan updates by the plan updater.
        
        Args:
            plan_updater: The plan updater to optimize
        """
        # Patch the plan updater's update_plan_content method to include caching
        original_update_plan = plan_updater.update_plan_content
        
        @wraps(original_update_plan)
        def optimized_update_plan(plan_id, new_content):
            # Invalidate any cached plan content for this plan ID
            cache_key = f"plan_content_{plan_id}"
            if cache_key in self.cache:
                del self.cache[cache_key]
            
            # Call the original method
            return original_update_plan(plan_id, new_content)
        
        # Replace the original method with the optimized one
        plan_updater.update_plan_content = optimized_update_plan
    
    def optimize_flask_app(self, app):
        """
        Optimize a Flask application with caching, throttling, and performance monitoring.
        
        Args:
            app: The Flask application to optimize
        """
        # Add before_request handler for throttling and performance monitoring
        @app.before_request
        def before_request():
            # Clean up cache
            self.cleanup_cache()
            
            # Check for throttling
            ip_address = request.remote_addr
            if self.throttle_request(ip_address):
                return jsonify({
                    'status': 'error',
                    'message': 'Too many requests. Please try again later.'
                }), 429
            
            # Record start time for performance monitoring
            g.start_time = time.time()
        
        # Add after_request handler for performance monitoring
        @app.after_request
        def after_request(response):
            # Skip if start_time not set (e.g., for throttled requests)
            if not hasattr(g, 'start_time'):
                return response
            
            # Calculate request duration
            duration = time.time() - g.start_time
            
            # Record metrics
            endpoint = request.endpoint or 'unknown'
            self.record_endpoint_metrics(endpoint, duration)
            
            # Add performance headers
            response.headers['X-Response-Time'] = str(duration)
            
            return response
        
        # Add endpoint for performance metrics
        @app.route('/api/performance')
        def performance_metrics():
            return jsonify({
                'status': 'success',
                'metrics': self.get_endpoint_metrics()
            })
        
        # Optimize specific endpoints with caching
        self._optimize_get_plan_endpoint(app)
        self._optimize_get_status_endpoint(app)
    
    def _optimize_get_plan_endpoint(self, app):
        """
        Optimize the get plan endpoint with caching.
        
        Args:
            app: The Flask application
        """
        # Find the get_plan view function
        for rule in app.url_map.iter_rules():
            if rule.endpoint == 'planning.get_plan':
                view_func = app.view_functions[rule.endpoint]
                
                # Create an optimized version with caching
                @wraps(view_func)
                def optimized_get_plan(plan_id):
                    # Check cache
                    cache_key = f"plan_content_{plan_id}"
                    cached_result = self.get_cached_result(cache_key)
                    
                    if cached_result is not None:
                        return cached_result
                    
                    # Call original function
                    result = view_func(plan_id)
                    
                    # Cache the result
                    self.cache_result(cache_key, result, self.plan_cache_ttl)
                    
                    return result
                
                # Replace the original view function
                app.view_functions[rule.endpoint] = optimized_get_plan
                break
    
    def _optimize_get_status_endpoint(self, app):
        """
        Optimize the get agent status endpoint with caching.
        
        Args:
            app: The Flask application
        """
        # Find the get_agent_status view function
        for rule in app.url_map.iter_rules():
            if rule.endpoint == 'indefinite.get_agent_status':
                view_func = app.view_functions[rule.endpoint]
                
                # Create an optimized version with caching
                @wraps(view_func)
                def optimized_get_status(session_id):
                    # Check cache
                    cache_key = f"agent_status_{session_id}"
                    cached_result = self.get_cached_result(cache_key)
                    
                    if cached_result is not None:
                        return cached_result
                    
                    # Call original function
                    result = view_func(session_id)
                    
                    # Cache the result
                    self.cache_result(cache_key, result, self.status_cache_ttl)
                    
                    return result
                
                # Replace the original view function
                app.view_functions[rule.endpoint] = optimized_get_status
                break
