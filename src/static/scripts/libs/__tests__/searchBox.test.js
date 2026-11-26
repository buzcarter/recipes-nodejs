import { isMatch, scrub } from '../searchBox.js';

describe('searchBox', () => {
  describe('scrub', () => {
    const tests = [
      { value: 'Hello World!', expectedResult: 'helloworld' },
      { value: '  A very  delicious pumpkin -- pie! From, :Hasbro (99)  ', expectedResult: 'averydeliciouspumpkinpiefromhasbro99' },
      { value: '  Hello   World  ', expectedResult: 'helloworld' },
      { value: '12345', expectedResult: '12345' },
      { value: '', expectedResult: '' },
      { value: '---', expectedResult: '' },
      { value: 'Jalapeño Crème Brûlée', expectedResult: 'jalapenocremebrulee' },
      { value: 'Käsespätzle', expectedResult: 'kasespatzle' },
      { value: 'Борщ (borscht)', expectedResult: 'борщborscht' },
      { value: '麻婆豆腐', expectedResult: '麻婆豆腐' },
    ];

    tests.forEach((test) => {
      it(`should scrub "${test.value}" to "${test.expectedResult}"`, () => {
        const result = scrub(test.value);
        expect(result).toEqual(test.expectedResult);
      });
    });
  });

  describe('isMatch', () => {
    const searchText = scrub('Aunt Carolyn’s Jalapeño Poppers');

    it.each([
      ['', true],
      ['   ', true],
      ['jalapeno', true],
      ['JALAPEÑO', true],
      ['poppers aunt', true],
      ['carolyn\'s', true],
      ['poppers pie', false],
    ])('"%s" → %s', (filterText, expected) => {
      expect(isMatch(searchText, filterText)).toBe(expected);
    });
  });
});
