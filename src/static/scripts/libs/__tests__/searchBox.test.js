import { scrub } from '../searchBox';

describe('searchBox', () => {
  describe('scrub', () => {
    const tests = [
      { value: 'Hello World!', expectedResult: 'helloworld' },
      { value: '  A very  delicious pumpkin -- pie! From, :Hasbro (99)  ', expectedResult: 'averydeliciouspumpkinpiefromhasbro99' },
      { value: '  Hello   World  ', expectedResult: 'helloworld' },
      { value: '12345', expectedResult: '12345' },
      { value: '', expectedResult: '' },
      { value: '---', expectedResult: '' },
    ];

    tests.forEach((test) => {
      it(`should scrub "${test.value}" to "${test.expectedResult}"`, () => {
        const result = scrub(test.value);
        expect(result).toEqual(test.expectedResult);
      });
    });
  });
});
