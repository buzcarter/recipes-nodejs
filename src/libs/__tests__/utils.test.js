import * as utils from '../utils';

// TODO: handle "https://www.getabiggerwagon.com/blog/posts/pineapple_pecan_loaf.html"
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

  describe('replaceQuotes', () => {
    const { replaceQuotes } = utils;

    it('should skip HTML tag attributes', () => {
      const html = `
<h1>"My Favorite"</h1>
<p class="pickles" data-onions="gassioso">This "should be pretty" and "so" should this</p>
<a href="mypage" id="wow">
    <img src="./grapes.avif" alt="these grapes &quo;rock&quo;">
</a>


<a href="mypage" id="wow">
    There is 2" gap there <img src="./grapes.avif" alt="these grapes &quo;rock&quo;"> or 7" to 8" on the <a href="bob">side"</a>
</a>
`;

      // NOTE: the 7" to 8" is not the worst thing to happen, but it is undesired.
      const expectedResult = `
<h1>&ldquo;My Favorite&rdquo;</h1>
<p class="pickles" data-onions="gassioso">This &ldquo;should be pretty&rdquo; and &ldquo;so&rdquo; should this</p>
<a href="mypage" id="wow">
    <img src="./grapes.avif" alt="these grapes &quo;rock&quo;">
</a>


<a href="mypage" id="wow">
    There is 2" gap there <img src="./grapes.avif" alt="these grapes &quo;rock&quo;"> or 7&ldquo; to 8&rdquo; on the <a href="bob">side"</a>
</a>
`;

      const result = replaceQuotes(html);

      expect(result).toBe(expectedResult);
    });
  });

  describe('getAuthor', () => {
    const { getAuthor } = utils;

    it('should happy path', () => {
      const Tests = [{
        value: '',
        expectedResult: '',
      }, {
        value: `
 by Amanda Berry
        `,
        expectedResult: 'Amanda Berry',
      }, {
        value: `
photo by Demples
This is from the kitchen of Harriet McCormmick hereself
from the kitchen of Aunt Bertha (my favorite auntie)

        `,
        expectedResult: 'Aunt Bertha',
      }, {
        value: `
        courtesy of: Jenny
        `,
        expectedResult: 'Jenny',
      }, {
        value: `
        courtesy of Derek
        `,
        expectedResult: 'Derek',
      }, {
        value: 'BY Todd',
        expectedResult: 'Todd',
      }, {
        value: 'BY the New York Times Staff',
        expectedResult: '',
      }, {
        value: 'From the time my Unkle James was paroled',
        expectedResult: '',
      }, {
        value: `
        courtesy of      :    Gavin

            `,
        expectedResult: 'Gavin',
      }, {
        value: `
          courtesy of:Auntie Jim

          `,
        expectedResult: 'Auntie Jim',
      }, {
        value: `
from Mellisa Clark at the New York Times
        `,
        expectedResult: 'Mellisa Clark at the New York Times',
      }, {
        value: `
by Jeff "Handsy" Smith aka "The Frugal Gourmet" (WBEZ Chicago)
        `,
        expectedResult: 'Jeff "Handsy" Smith aka "The Frugal Gourmet"',
      }, {
        value: `
# Positively-the-Absolutely-Best-Chocolate-Chip Cookies
### From Maida Heatter

* Yield: **50** cookies.
`,
        expectedResult: 'Maida Heatter',
      }, {
        value: `
# Positively-the-Absolutely-Best-Chocolate-Chip Cookies
From Billie's Kitchen

* Yield: **50** cookies.
`,
        expectedResult: 'Billie\'s Kitchen',
      }, {
        value: `
Time: 3 years

Source: America's Test Kitchen

Yield: **50** cookies.
`,
        expectedResult: 'America\'s Test Kitchen',
      }, {
        value: `
Total Time: 6 minutes | Servings: 1 : Calories: 215kcal

Author: Robin Gagnon

Dalgona coffee is a whipped coffee drink`,
        expectedResult: 'Robin Gagnon',
      }];

      Tests.forEach(({ value, expectedResult }) => {
        const result = getAuthor(value);
        expect(result).toBe(expectedResult);
      });
    });
  });
});
