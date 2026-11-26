const showdown = require('showdown');
const { default: parseRecipe, getCustomizations, splitSections } = require('../parseRecipe');
const { default: renderRecipe } = require('../renderRecipe');
const { getSectionType } = require('../sections');

const converter = new showdown.Converter();

const Template = `<html><head><title>x</title>{{__favIcon__}}</head>
<body class="{{__bodyClass__}}"><h1>{{__title__}}</h1>{{__heroImg__}}
<a href="{{__sourceFile__}}"></a>{{__help__}}
{{__header__}}|{{__info__}}|{{__ingredients__}}|{{__steps__}}|{{__notes__}}|{{__basedon__}}</body></html>`;

const Options = {
  autoUrlSections: ['basedon'],
  defaultTheme: 'default',
  favicon: 'icon.svg',
  findAuthor: true,
  helpURLs: [{ label: 'Find <it>', url: 'https://example.com/search?where=New York&q=<name>' }],
  includeHelpLinks: true,
  titleSuffix: ' - Recipes',
  useFractionSymbols: true,
};

describe('getSectionType', () => {
  it.each([
    ['<h2 id="steps">Steps</h2>', 'steps'],
    ['<h2 id="steps-1">Steps</h2>', 'steps'],
    ['<h2 id="method">Method</h2>', 'steps'],
    ['<h2 id="nutritioninfo-2">Nutrition Info</h2>', 'notes'],
    ['<h2 id="wine-pairing">Wine Pairing</h2>', 'wine-pairing'],
    ['<p>no heading</p>', ''],
  ])('%s → "%s"', (html, expected) => {
    expect(getSectionType(html)).toBe(expected);
  });
});

describe('getCustomizations', () => {
  it('reads recipe-* comments', () => {
    const html = '<!-- recipe-style: dark -->\n<p>x</p>\n<!-- recipe-body-class: wide -->';
    expect(getCustomizations(html)).toEqual({ style: 'dark', 'body-class': 'wide' });
  });

  it('returns {} when there are none', () => {
    expect(getCustomizations('<p>x</p>')).toEqual({});
  });
});

describe('splitSections', () => {
  it('merges a repeated heading into the first, as a subheading', () => {
    const html = converter.makeHtml('# Toast\n## Steps\n1. step one\n\n## Notes\nnote\n## Method\n1. step two');
    const { title, sections } = splitSections(html, Options);

    expect(title).toBe('Toast');
    expect(sections.sectionsInUse).toEqual(['header', 'steps', 'notes']);
    expect(sections.sections.steps).toMatch(/<h2 id="steps">Steps<\/h2>[\s\S]*step one[\s\S]*<\/ol>\n?<h3 id="method">Method<\/h3>[\s\S]*step two/);
    expect(sections.sections.steps.match(/class="subsection--/g)).toHaveLength(1);
    expect(sections.hasWarnings).toBe(false);
  });

  it('keeps unrecognized headings separate', () => {
    const html = converter.makeHtml('## Wine\nred\n## Wine\nwhite');
    const { sections } = splitSections(html, Options);

    expect(sections.unknownTypes).toEqual(['wine', 'wine-1']);
  });
});

describe('parseRecipe + renderRecipe', () => {
  const markdown = `# Mom's "Best" Toast

By Pat O'Brien

## Ingredients

* 1/2 cup butter
* Costs $$5, pattern $& here

## Steps

1. Toast it. See [jam](jam.md#top).
`;

  const recipe = parseRecipe(converter, markdown, Options);
  const html = renderRecipe(Template, recipe, {
    name: 'mom\'s "best" toast',
    image: { fileName: 'mom\'s "best" toast.jpg', orientation: 'landscape' },
  }, Options);

  it('detects the author', () => {
    expect(recipe.author).toBe('Pat O\'Brien');
  });

  it('keeps `$` sequences in recipe text literal', () => {
    expect(html).toContain('Costs $$5, pattern $&amp; here');
  });

  it('formats ingredient amounts', () => {
    expect(html).toContain('<span class="ingredient__amt"><span class="ingredient__symbol">½</span> cup</span>');
  });

  it('points local .md links at the .html page', () => {
    expect(html).toContain('href="jam.html#top"');
  });

  it('escapes the author and suffix in <title>', () => {
    expect(html).toContain('<title>Mom\'s "Best" Toast by Pat O&#39;Brien - Recipes</title>');
  });

  it('encodes file names in URLs', () => {
    expect(html).toContain('src="images/mom&#39;s%20%22best%22%20toast.jpg"');
    expect(html).toContain('href="sources/mom\'s%20%22best%22%20toast.txt"');
  });

  it('encodes help links and escapes their labels', () => {
    expect(html).toContain('href="https://example.com/search?where=New%20York&amp;q=mom%27s%20%22best%22%20toast"');
    expect(html).toContain('>Find &lt;it&gt;</a>');
  });

  it('sets the favicon type from its extension', () => {
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="icon.svg">');
  });

  it('lists visible and hidden sections on <body>', () => {
    expect(html).toContain('class="heroimage--visible heroimage--landscape header--visible ingredients--visible steps--visible basedon--hidden info--hidden notes--hidden"');
  });

  it('leaves no placeholders behind', () => {
    expect(html).not.toMatch(/\{\{__/);
  });
});
