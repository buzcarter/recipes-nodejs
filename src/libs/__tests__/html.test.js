const { escapeHtml, fileUrl, stripTags } = require('../html');
const { default: fillTemplate } = require('../template');

describe('escapeHtml', () => {
  it('escapes markup and quote characters', () => {
    expect(escapeHtml('<a href="x">Tom & Jerry\'s</a>')).toBe('&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;');
  });

  it('treats null and undefined as empty', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('stripTags', () => {
  it('keeps text and entities', () => {
    expect(stripTags('<em>Mom&#39;s</em> pie')).toBe('Mom&#39;s pie');
  });
});

describe('fileUrl', () => {
  it('percent-encodes the file name only', () => {
    expect(fileUrl('images/thumbnails', 'a b#c?.jpg')).toBe('images/thumbnails/a%20b%23c%3F.jpg');
    expect(fileUrl('', 'x y.html')).toBe('x%20y.html');
  });
});

describe('fillTemplate', () => {
  it('fills every occurrence, keeping `$` patterns literal', () => {
    expect(fillTemplate('{{__a__}}-{{__a__}}-{{__b__}}', { '{{__a__}}': '$&$$', '{{__b__}}': null }))
      .toBe('$&$$-$&$$-');
  });
});
