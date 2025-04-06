import { injectable } from 'inversify';
import 'reflect-metadata';
import { AsyncResult } from './ApiResponse';

/**
 * Type definition for a validation error
 */
export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Utility class for validating input data
 */
@injectable()
export class Validator {
  /**
   * Validates that required fields are present
   * 
   * @param data - The data object to validate
   * @param requiredFields - Array of required field names
   * @returns Array of validation errors or empty array if valid
   */
  static validateRequired(data: Record<string, any>, requiredFields: string[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push({
          field,
          message: `${field} is required`
        });
      }
    }
    
    return errors;
  }

  /**
   * Validates that fields match specified types
   * 
   * @param data - The data object to validate
   * @param typeValidations - Object mapping field names to expected types
   * @returns Array of validation errors or empty array if valid
   */
  static validateTypes(
    data: Record<string, any>, 
    typeValidations: Record<string, 'string' | 'number' | 'boolean' | 'object' | 'array'>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const [field, expectedType] of Object.entries(typeValidations)) {
      if (data[field] !== undefined && data[field] !== null) {
        let isValid = false;
        
        switch (expectedType) {
          case 'string':
            isValid = typeof data[field] === 'string';
            break;
          case 'number':
            isValid = typeof data[field] === 'number' && !isNaN(data[field]);
            break;
          case 'boolean':
            isValid = typeof data[field] === 'boolean';
            break;
          case 'object':
            isValid = typeof data[field] === 'object' && !Array.isArray(data[field]) && data[field] !== null;
            break;
          case 'array':
            isValid = Array.isArray(data[field]);
            break;
        }
        
        if (!isValid) {
          errors.push({
            field,
            message: `${field} must be a ${expectedType}`
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Validates that string fields meet length requirements
   * 
   * @param data - The data object to validate
   * @param lengthValidations - Object mapping field names to min/max length requirements
   * @returns Array of validation errors or empty array if valid
   */
  static validateStringLengths(
    data: Record<string, any>,
    lengthValidations: Record<string, { min?: number; max?: number }>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const [field, requirements] of Object.entries(lengthValidations)) {
      if (typeof data[field] === 'string') {
        const { min, max } = requirements;
        const length = data[field].length;
        
        if (min !== undefined && length < min) {
          errors.push({
            field,
            message: `${field} must be at least ${min} characters`
          });
        }
        
        if (max !== undefined && length > max) {
          errors.push({
            field,
            message: `${field} must be at most ${max} characters`
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Validates that numeric fields meet range requirements
   * 
   * @param data - The data object to validate
   * @param rangeValidations - Object mapping field names to min/max range requirements
   * @returns Array of validation errors or empty array if valid
   */
  static validateNumericRanges(
    data: Record<string, any>,
    rangeValidations: Record<string, { min?: number; max?: number }>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const [field, requirements] of Object.entries(rangeValidations)) {
      if (typeof data[field] === 'number') {
        const { min, max } = requirements;
        const value = data[field];
        
        if (min !== undefined && value < min) {
          errors.push({
            field,
            message: `${field} must be at least ${min}`
          });
        }
        
        if (max !== undefined && value > max) {
          errors.push({
            field,
            message: `${field} must be at most ${max}`
          });
        }
      }
    }
    
    return errors;
  }

  /**
   * Validates data against a custom validation function
   * 
   * @param data - The data object to validate
   * @param validationFn - Custom validation function
   * @returns Array of validation errors or empty array if valid
   */
  static validateCustom(
    data: Record<string, any>,
    validationFn: (data: Record<string, any>) => ValidationError[]
  ): ValidationError[] {
    return validationFn(data);
  }

  /**
   * Combines multiple validation results
   * 
   * @param validationResults - Array of validation error arrays
   * @returns Combined array of validation errors
   */
  static combineValidations(...validationResults: ValidationError[][]): ValidationError[] {
    return validationResults.flat();
  }

  /**
   * Validates data and returns an AsyncResult
   * 
   * @param data - The data object to validate
   * @param validations - Array of validation functions
   * @returns AsyncResult with validated data or validation error
   */
  static validate<T>(
    data: T,
    validations: ((data: T) => ValidationError[])[]
  ): AsyncResult<T> {
    const errors: ValidationError[] = [];
    
    for (const validation of validations) {
      const validationErrors = validation(data);
      errors.push(...validationErrors);
    }
    
    if (errors.length > 0) {
      return [null, new Error(`Validation failed: ${JSON.stringify(errors)}`)];
    }
    
    return [data, null];
  }
}
