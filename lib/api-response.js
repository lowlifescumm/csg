/**
 * Standardized API Response Middleware
 * Provides consistent response formatting and error handling for Next.js 15 API routes
 */

import { NextResponse } from 'next/server';

/**
 * Create a successful response
 * @param {any} data - Response data
 * @param {number} status - HTTP status code (default: 200)
 * @param {object} meta - Additional metadata to include in response
 * @returns {NextResponse} NextResponse with JSON body
 */
export function successResponse(data, status = 200, meta = {}) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...meta
    },
    { status }
  );
}

/**
 * Create an error response
 * @param {string|Error} error - Error message or Error object
 * @param {number} status - HTTP status code (default: 500)
 * @param {string|null} details - Additional error details (only shown in development)
 * @returns {NextResponse} NextResponse with JSON body
 */
export function errorResponse(error, status = 500, details = null) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorDetails = details || (error instanceof Error ? error.message : null);
  
  return NextResponse.json(
    {
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && errorDetails && { details: errorDetails })
    },
    { status }
  );
}

/**
 * Create an unauthorized response
 * @param {string} message - Error message (default: 'Unauthorized')
 * @returns {NextResponse} NextResponse with JSON body and 401 status
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

/**
 * Create a bad request response
 * @param {string} message - Error message
 * @param {string|null} details - Additional error details (only shown in development)
 * @returns {NextResponse} NextResponse with JSON body and 400 status
 */
export function badRequestResponse(message, details = null) {
  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV === 'development' && details && { details })
    },
    { status: 400 }
  );
}

/**
 * Create a not found response
 * @param {string} resource - Resource name (default: 'Resource')
 * @returns {NextResponse} NextResponse with JSON body and 404 status
 */
export function notFoundResponse(resource = 'Resource') {
  return NextResponse.json(
    { error: `${resource} not found` },
    { status: 404 }
  );
}

/**
 * Create a forbidden response
 * @param {string} message - Error message (default: 'Forbidden')
 * @returns {NextResponse} NextResponse with JSON body and 403 status
 */
export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

/**
 * Create a conflict response
 * @param {string} message - Error message (default: 'Conflict')
 * @returns {NextResponse} NextResponse with JSON body and 409 status
 */
export function conflictResponse(message = 'Conflict') {
  return NextResponse.json(
    { error: message },
    { status: 409 }
  );
}

