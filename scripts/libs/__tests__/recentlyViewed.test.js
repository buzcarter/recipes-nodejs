import { toDisplay } from '../recentlyViewed';

describe('recentlyViewed', () => {
  describe('toDisplay', () => {
    const tests = [
      { value: 'hello-world', expectedResult: 'Hello World' },
      { value: 'hello world', expectedResult: 'Hello World' },
      { value: '    HeLLo            WoRLD      ', expectedResult: 'Hello World' },
      { value: '', expectedResult: '' },
      { value: '---', expectedResult: '' },
    ];

    tests.forEach((test) => {
      it(`should convert "${test.value}" to "${test.expectedResult}"`, () => {
        const result = toDisplay(test.value);
        expect(result).toEqual(test.expectedResult);
      });
    });
  });
});
