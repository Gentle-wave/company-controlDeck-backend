import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  const createHost = (jsonSpy: jest.Mock, statusSpy: jest.Mock): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({
          status: statusSpy,
          json: jsonSpy,
        }),
        getRequest: () => ({
          url: '/test',
          method: 'GET',
        }),
      }),
    }) as any;

  it('formats HttpException payloads', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(
      new HttpException({ message: 'Bad input' }, HttpStatus.BAD_REQUEST),
      createHost(json, status),
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test',
        method: 'GET',
        message: 'Bad input',
      }),
    );
  });

  it('formats unknown exceptions as 500', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    filter.catch(new Error('boom'), createHost(json, status));

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      }),
    );
  });
});
