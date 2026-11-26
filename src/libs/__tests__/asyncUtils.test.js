import { jest } from '@jest/globals';
import { settleAll } from '../asyncUtils.js';

describe('settleAll', () => {
  it('collects values and errors without stopping at the first failure', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const boom = new Error('boom');

    const result = await settleAll('Thing', [Promise.resolve(1), Promise.reject(boom), Promise.resolve(3)]);

    expect(result).toEqual({ values: [1, 3], errors: [boom] });
    expect(consoleError).toHaveBeenCalledWith('Thing failed:', 'boom');
    consoleError.mockRestore();
  });

  it('handles an empty list', async () => {
    expect(await settleAll('Thing', [])).toEqual({ values: [], errors: [] });
  });
});
