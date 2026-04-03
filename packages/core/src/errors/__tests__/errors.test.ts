import { describe, it, expect } from 'vitest';
import {
  InxtoneError,
  EntityNotFoundError,
  ValidationError,
  DuplicateEntityError,
  InvalidOperationError,
  ReferenceNotFoundError,
  SelfReferenceError,
  DatabaseError,
  TransactionError,
  AIProviderError,
  isInxtoneError,
  isEntityNotFound,
  isValidationError,
  isDuplicateEntity,
  wrapError,
  getStatusCode,
  getErrorCode,
} from '../index';

// ============================================
// Error Classes
// ============================================

describe('EntityNotFoundError', () => {
  it('has correct status code, error code, and message', () => {
    const err = new EntityNotFoundError('Character', 'C001');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Character C001 not found');
    expect(err.entityType).toBe('Character');
    expect(err.entityId).toBe('C001');
  });

  it('accepts numeric entity IDs', () => {
    const err = new EntityNotFoundError('Chapter', 42);
    expect(err.entityId).toBe(42);
    expect(err.message).toBe('Chapter 42 not found');
  });

  it('serializes via toJSON()', () => {
    const json = new EntityNotFoundError('Character', 'C001').toJSON();
    expect(json.code).toBe('NOT_FOUND');
    expect(json.message).toBe('Character C001 not found');
    expect(json.context).toEqual({ entityType: 'Character', entityId: 'C001' });
  });

  it('is instanceof InxtoneError', () => {
    expect(new EntityNotFoundError('X', 1) instanceof InxtoneError).toBe(true);
    expect(new EntityNotFoundError('X', 1) instanceof Error).toBe(true);
  });
});

describe('ValidationError', () => {
  it('has correct status code and message', () => {
    const err = new ValidationError('Name is required');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Name is required');
    expect(err.field).toBeUndefined();
  });

  it('includes field info when provided', () => {
    const err = new ValidationError('Invalid role', 'role', { value: 'invalid' });
    expect(err.field).toBe('role');
    expect(err.context).toEqual({ field: 'role', value: 'invalid' });
  });
});

describe('DuplicateEntityError', () => {
  it('has correct status code and message', () => {
    const err = new DuplicateEntityError('Relationship', 'C001-C002');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('DUPLICATE_ENTITY');
    expect(err.message).toBe('Relationship already exists: C001-C002');
    expect(err.entityType).toBe('Relationship');
    expect(err.identifier).toBe('C001-C002');
  });

  it('merges additional context', () => {
    const err = new DuplicateEntityError('X', 'Y', { extra: true });
    expect(err.context).toEqual({ entityType: 'X', identifier: 'Y', extra: true });
  });
});

describe('InvalidOperationError', () => {
  it('has correct status code and message', () => {
    const err = new InvalidOperationError('Cannot delete arc');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('INVALID_OPERATION');
    expect(err.message).toBe('Cannot delete arc');
  });
});

describe('ReferenceNotFoundError', () => {
  it('has correct status code and message', () => {
    const err = new ReferenceNotFoundError('Character', 'C001', 'leaderId');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('REFERENCE_NOT_FOUND');
    expect(err.message).toContain('Character');
    expect(err.message).toContain('C001');
    expect(err.message).toContain('leaderId');
    expect(err.referencedType).toBe('Character');
    expect(err.referencedId).toBe('C001');
    expect(err.field).toBe('leaderId');
  });
});

describe('SelfReferenceError', () => {
  it('has correct status code and message', () => {
    const err = new SelfReferenceError('Relationship', 'sourceId', 'targetId');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('SELF_REFERENCE');
    expect(err.message).toContain('sourceId');
    expect(err.message).toContain('targetId');
    expect(err.entityType).toBe('Relationship');
    expect(err.field1).toBe('sourceId');
    expect(err.field2).toBe('targetId');
  });
});

describe('DatabaseError', () => {
  it('has correct status code and message', () => {
    const err = new DatabaseError('Insert failed');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('DATABASE_ERROR');
    expect(err.originalError).toBeUndefined();
  });

  it('wraps original error', () => {
    const orig = new Error('SQLITE_CONSTRAINT');
    const err = new DatabaseError('Insert failed', orig);
    expect(err.originalError).toBe(orig);
    expect(err.context?.originalMessage).toBe('SQLITE_CONSTRAINT');
  });
});

describe('TransactionError', () => {
  it('has correct status code and message', () => {
    const err = new TransactionError('Rolled back');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('TRANSACTION_ERROR');
  });

  it('wraps original error', () => {
    const orig = new Error('deadlock');
    const err = new TransactionError('Rolled back', orig);
    expect(err.originalError).toBe(orig);
    expect(err.context?.originalMessage).toBe('deadlock');
  });
});

describe('AIProviderError', () => {
  it('has correct status code and custom code', () => {
    const err = new AIProviderError('AI_PROVIDER_ERROR', 'Invalid API key');
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe('AI_PROVIDER_ERROR');
    expect(err.retriable).toBe(false);
  });

  it('supports retriable flag', () => {
    const err = new AIProviderError('AI_RATE_LIMITED', 'Rate limit', true);
    expect(err.code).toBe('AI_RATE_LIMITED');
    expect(err.retriable).toBe(true);
  });

  it('supports all error codes', () => {
    expect(new AIProviderError('AI_CONTEXT_TOO_LARGE', 'Too big').code).toBe(
      'AI_CONTEXT_TOO_LARGE'
    );
    expect(new AIProviderError('AI_CONTENT_FILTERED', 'Filtered').code).toBe('AI_CONTENT_FILTERED');
  });
});

// ============================================
// Type Guards
// ============================================

describe('type guards', () => {
  it('isInxtoneError identifies InxtoneError subtypes', () => {
    expect(isInxtoneError(new EntityNotFoundError('X', 1))).toBe(true);
    expect(isInxtoneError(new ValidationError('bad'))).toBe(true);
    expect(isInxtoneError(new DatabaseError('fail'))).toBe(true);
    expect(isInxtoneError(new Error('plain'))).toBe(false);
    expect(isInxtoneError('string')).toBe(false);
    expect(isInxtoneError(null)).toBe(false);
  });

  it('isEntityNotFound narrows to EntityNotFoundError', () => {
    expect(isEntityNotFound(new EntityNotFoundError('X', 1))).toBe(true);
    expect(isEntityNotFound(new ValidationError('bad'))).toBe(false);
    expect(isEntityNotFound(new Error('plain'))).toBe(false);
  });

  it('isValidationError narrows to ValidationError', () => {
    expect(isValidationError(new ValidationError('bad'))).toBe(true);
    expect(isValidationError(new EntityNotFoundError('X', 1))).toBe(false);
  });

  it('isDuplicateEntity narrows to DuplicateEntityError', () => {
    expect(isDuplicateEntity(new DuplicateEntityError('X', 'Y'))).toBe(true);
    expect(isDuplicateEntity(new EntityNotFoundError('X', 1))).toBe(false);
  });
});

// ============================================
// Helper Functions
// ============================================

describe('wrapError', () => {
  it('returns InxtoneError unchanged', () => {
    const orig = new EntityNotFoundError('X', 1);
    expect(wrapError(orig, 'wrapper')).toBe(orig);
  });

  it('wraps plain Error into DatabaseError', () => {
    const plain = new Error('some failure');
    const wrapped = wrapError(plain, 'context message');
    expect(wrapped).toBeInstanceOf(DatabaseError);
    expect(wrapped.message).toBe('context message');
  });

  it('wraps non-Error values', () => {
    const wrapped = wrapError('string error', 'wrapper');
    expect(wrapped).toBeInstanceOf(DatabaseError);
  });
});

describe('getStatusCode', () => {
  it('returns status code for InxtoneError', () => {
    expect(getStatusCode(new EntityNotFoundError('X', 1))).toBe(404);
    expect(getStatusCode(new ValidationError('bad'))).toBe(400);
    expect(getStatusCode(new DatabaseError('fail'))).toBe(500);
    expect(getStatusCode(new AIProviderError('AI_PROVIDER_ERROR', 'fail'))).toBe(502);
  });

  it('returns 500 for unknown errors', () => {
    expect(getStatusCode(new Error('plain'))).toBe(500);
    expect(getStatusCode('string')).toBe(500);
    expect(getStatusCode(null)).toBe(500);
  });
});

describe('getErrorCode', () => {
  it('returns error code for InxtoneError', () => {
    expect(getErrorCode(new EntityNotFoundError('X', 1))).toBe('NOT_FOUND');
    expect(getErrorCode(new ValidationError('bad'))).toBe('VALIDATION_ERROR');
    expect(getErrorCode(new DuplicateEntityError('X', 'Y'))).toBe('DUPLICATE_ENTITY');
  });

  it('returns INTERNAL_ERROR for unknown errors', () => {
    expect(getErrorCode(new Error('plain'))).toBe('INTERNAL_ERROR');
    expect(getErrorCode(42)).toBe('INTERNAL_ERROR');
  });
});
