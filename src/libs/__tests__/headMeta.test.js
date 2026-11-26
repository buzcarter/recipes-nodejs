import { getHeadMeta, HeadPlaceholders } from '../headMeta.js';

describe('getHeadMeta', () => {
  const generated = new Date('2026-01-02T03:04:05Z');

  it('fills every head placeholder', () => {
    expect(getHeadMeta({ favicon: 'icon.png', ogImgURL: 'images/a%20b.jpg', theme: 'default', generated })).toEqual({
      [HeadPlaceholders.META_DATE]: '<meta name="date" content="2026-01-02T03:04:05.000Z">',
      [HeadPlaceholders.META_FAVICON]: '<link rel="icon" type="image/png" href="icon.png">',
      [HeadPlaceholders.META_OG_IMG]: '<meta property="og:image" content="images/a%20b.jpg">',
      [HeadPlaceholders.THEME_CSS]: 'theme-default',
    });
  });

  it('leaves out the favicon and og:image when not given', () => {
    const meta = getHeadMeta({ theme: 'x', generated });
    expect(meta[HeadPlaceholders.META_FAVICON]).toBe('');
    expect(meta[HeadPlaceholders.META_OG_IMG]).toBe('');
  });

  it('omits the type for an unknown icon extension, and escapes values', () => {
    const meta = getHeadMeta({ favicon: 'a"b.bmp', theme: '"><x', generated });
    expect(meta[HeadPlaceholders.META_FAVICON]).toBe('<link rel="icon" href="a&quot;b.bmp">');
    expect(meta[HeadPlaceholders.THEME_CSS]).toBe('theme-&quot;&gt;&lt;x');
  });
});
