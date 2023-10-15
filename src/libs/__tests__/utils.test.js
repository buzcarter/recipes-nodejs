const utils = require('../utils');

describe('buildRecipes', () => {
  describe('linkify', () => {
    const { linkify } = utils;
    it('should add parens class (Happy Path)', () => {
      const value = `
<ul>
<li>Drizzle from <a href="https://cooking.nytimes.com/recipes/1021802-applejack-butter-pecan-bundt-cake">Applejack Butter Pecan Bundt Cake/NYTimes Cooking</a></li>
<li><a href="https://cooking.nytimes.com/search?q=Brian+Noyes">Brian Noyes</a> wrote this recipe</li>
<li>Just a domain: www.seriouseats.com/recipes/2017/01/homemade-bagels-recipe.html</li>
<li>Deliberately broken URL: href="www.seriouseats.com/recipes/2017/01/homemade-bagels-recipe.html</li>
<li>https://cooking.nytimes.com/recipes/1013116-simple-barbecue-sauce</li>
<li>julia.child@wgbh.org</li>
</ul>
`;

      const expectedResult = `
<ul>
<li>Drizzle from <a href="https://cooking.nytimes.com/recipes/1021802-applejack-butter-pecan-bundt-cake">Applejack Butter Pecan Bundt Cake/NYTimes Cooking</a></li>
<li><a href="https://cooking.nytimes.com/search?q=Brian+Noyes">Brian Noyes</a> wrote this recipe</li>
<li>Just a domain: <a href="http://www.seriouseats.com/recipes/2017/01/homemade-bagels-recipe.html">www.seriouseats.com/recipes/2017/01/homemade-bagels-recipe.html</a></li>
<li>Deliberately broken URL: href="www.seriouseats.com/recipes/2017/01/homemade-bagels-recipe.html</li>
<li><a href="https://cooking.nytimes.com/recipes/1013116-simple-barbecue-sauce">https://cooking.nytimes.com/recipes/1013116-simple-barbecue-sauce</a></li>
<li><a href="mailto:julia.child@wgbh.org">julia.child@wgbh.org</a></li>
</ul>
`;

      const result = linkify(value);

      expect(result).toBe(expectedResult);
    });
  });

  describe('shorten', () => {
    const { shorten } = utils;

    it('should shorten anchors with URLs as text (Happy Path)', () => {
      const tests = [{
        value: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">https://cooking.nytimes.com/recipes/1013116-simple-barbecue-sauce</a>',
        expectedResult: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">cooking.nytimes.com</a>',
      }, {
        value: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">http://cooking.edu/recipes/1013116</a>',
        expectedResult: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">cooking.edu</a>',
      }, {
        value: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">cooking.co.uk/recipes</a>',
        expectedResult: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">cooking.co.uk/recipes</a>',
      }, {
        value: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">Banana Splits</a>',
        expectedResult: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">Banana Splits</a>',
      }, {
        value: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">https://Banana.Splits</span>',
        expectedResult: '<a href="https://cooking.nytimes.com/recipes/bbq-sauce">https://Banana.Splits</span>',
      }];

      tests.forEach(({ value, expectedResult }) => {
        const result = shorten(value);
        expect(result).toBe(expectedResult);
      });
    });
  });

  describe('replaceFractions', () => {
    const { replaceFractions } = utils;

    it('should replace fractions when present (Happy Path)', () => {
      const tests = [{
        value: '1',
        expectedResult: '1',
      }, {
        value: '~1/4 ',
        expectedResult: '~¼ ',
      }, {
        value: '1 1/2 ',
        expectedResult: '1 ½ ',
      }, {
        value: '23/4 to 31/6',
        expectedResult: '2¾ to 3⅙',
      }, {
        value: '',
        expectedResult: '',
      }, {
        value: '1/2 1/3 2/3 1/4 3/4 1/5 2/5 3/5 4/5 1/6 5/6 1/7 1/8 3/8 5/8 7/8',
        expectedResult: '½ ⅓ ⅔ ¼ ¾ ⅕ ⅖ ⅗ ⅘ ⅙ ⅚ ⅐ ⅛ ⅜ ⅝ ⅞',
      }];

      tests.forEach(({ value, expectedResult }) => {
        const result = replaceFractions(value);
        expect(result).toBe(expectedResult);
      });
    });
  });

});
