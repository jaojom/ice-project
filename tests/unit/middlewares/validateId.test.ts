import { Request, Response, NextFunction } from 'express';
import { validateId } from '../../../src/middlewares/validateId';

const mockNext = jest.fn() as jest.MockedFunction<NextFunction>;

function makeReq(id: string): Request {
  return { params: { id } } as unknown as Request;
}

const mockRes = {} as Response;

beforeEach(() => mockNext.mockClear());

describe('validateId middleware', () => {
  it('calls next() with no args for valid UUID', () => {
    validateId(makeReq('550e8400-e29b-41d4-a716-446655440000'), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('calls next(error) with status 400 for non-UUID', () => {
    validateId(makeReq('not-a-uuid'), mockRes, mockNext);
    const err = mockNext.mock.calls[0][0] as unknown as { status: number };
    expect(err.status).toBe(400);
  });

  it('calls next(error) for empty string', () => {
    validateId(makeReq(''), mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
  });
});
