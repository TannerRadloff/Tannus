import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ApiResponseHandler, HttpStatus } from '../utils/ApiResponseHandler';

describe('ApiResponseHandler', () => {
  let mockResponse: any;
  
  beforeEach(() => {
    // Create a mock Express response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis()
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('success', () => {
    it('should return a success response with the provided data', () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      
      // Act
      ApiResponseHandler.success(mockResponse, data);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data,
          meta: expect.objectContaining({
            timestamp: expect.any(String)
          })
        })
      );
    });
    
    it('should use the provided status code', () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      
      // Act
      ApiResponseHandler.success(mockResponse, data, HttpStatus.CREATED);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
    });
    
    it('should include additional metadata if provided', () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      const meta = { requestId: 'test-request-id' };
      
      // Act
      ApiResponseHandler.success(mockResponse, data, HttpStatus.OK, meta);
      
      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            timestamp: expect.any(String),
            requestId: 'test-request-id'
          })
        })
      );
    });
  });
  
  describe('error', () => {
    it('should return an error response with the provided message', () => {
      // Arrange
      const message = 'Test error message';
      
      // Act
      ApiResponseHandler.error(mockResponse, message);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: HttpStatus.INTERNAL_SERVER_ERROR,
            message
          }),
          meta: expect.objectContaining({
            timestamp: expect.any(String)
          })
        })
      );
    });
    
    it('should use the provided status code', () => {
      // Arrange
      const message = 'Test error message';
      
      // Act
      ApiResponseHandler.error(mockResponse, message, HttpStatus.BAD_REQUEST);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: HttpStatus.BAD_REQUEST
          })
        })
      );
    });
    
    it('should include error details if provided', () => {
      // Arrange
      const message = 'Test error message';
      const details = { field: 'name', issue: 'required' };
      
      // Act
      ApiResponseHandler.error(mockResponse, message, HttpStatus.BAD_REQUEST, details);
      
      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details
          })
        })
      );
    });
    
    it('should include stack trace in development mode', () => {
      // Arrange
      const message = 'Test error message';
      const error = new Error('Original error');
      
      // Mock config.isDevelopment to return true
      jest.mock('../config/Config', () => ({
        config: {
          isDevelopment: () => true
        }
      }));
      
      // Act
      ApiResponseHandler.error(mockResponse, message, HttpStatus.INTERNAL_SERVER_ERROR, undefined, error);
      
      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String)
          })
        })
      );
    });
  });
  
  describe('validationError', () => {
    it('should return a validation error response with the provided errors', () => {
      // Arrange
      const errors = [
        { field: 'name', message: 'Name is required' },
        { field: 'email', message: 'Email is invalid' }
      ];
      
      // Act
      ApiResponseHandler.validationError(mockResponse, errors);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: HttpStatus.UNPROCESSABLE_ENTITY,
            message: 'Validation failed',
            details: { errors }
          })
        })
      );
    });
  });
  
  describe('notFound', () => {
    it('should return a not found error response with the resource name', () => {
      // Arrange
      const resource = 'User';
      
      // Act
      ApiResponseHandler.notFound(mockResponse, resource);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          error: expect.objectContaining({
            code: HttpStatus.NOT_FOUND,
            message: 'User not found'
          })
        })
      );
    });
    
    it('should include the resource ID if provided', () => {
      // Arrange
      const resource = 'User';
      const id = 123;
      
      // Act
      ApiResponseHandler.notFound(mockResponse, resource, id);
      
      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'User with ID 123 not found'
          })
        })
      );
    });
  });
  
  describe('paginated', () => {
    it('should return a paginated success response', () => {
      // Arrange
      const data = [{ id: 1, name: 'Test 1' }, { id: 2, name: 'Test 2' }];
      const page = 1;
      const pageSize = 10;
      const total = 20;
      
      // Act
      ApiResponseHandler.paginated(mockResponse, data, page, pageSize, total);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data,
          meta: expect.objectContaining({
            timestamp: expect.any(String),
            pagination: {
              page,
              pageSize,
              total,
              totalPages: 2
            }
          })
        })
      );
    });
    
    it('should include additional metadata if provided', () => {
      // Arrange
      const data = [{ id: 1, name: 'Test 1' }, { id: 2, name: 'Test 2' }];
      const page = 1;
      const pageSize = 10;
      const total = 20;
      const meta = { requestId: 'test-request-id' };
      
      // Act
      ApiResponseHandler.paginated(mockResponse, data, page, pageSize, total, meta);
      
      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          meta: expect.objectContaining({
            timestamp: expect.any(String),
            requestId: 'test-request-id',
            pagination: expect.any(Object)
          })
        })
      );
    });
  });
  
  describe('noContent', () => {
    it('should return a no content response', () => {
      // Act
      ApiResponseHandler.noContent(mockResponse);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NO_CONTENT);
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });
  
  describe('created', () => {
    it('should return a created success response', () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      
      // Act
      ApiResponseHandler.created(mockResponse, data);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data
        })
      );
    });
  });
  
  describe('accepted', () => {
    it('should return an accepted success response', () => {
      // Arrange
      const data = { id: 1, name: 'Test' };
      
      // Act
      ApiResponseHandler.accepted(mockResponse, data);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data
        })
      );
    });
    
    it('should work without data', () => {
      // Act
      ApiResponseHandler.accepted(mockResponse);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.ACCEPTED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: undefined
        })
      );
    });
  });
});
