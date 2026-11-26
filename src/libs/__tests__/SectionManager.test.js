import { SectionMgr } from '../SectionManager.js';

describe('SectionMgr', () => {
  describe('replace', () => {
    it('should insert section HTML literally, ignoring `$` replacement patterns', () => {
      const mgr = new SectionMgr({ definedTypes: ['notes'], defaultType: 'notes' });
      mgr.add('notes', 'notes', "<p>$$5, $& and $' stay put</p>");

      const result = mgr.replace('<main>{{__notes__}}</main>');

      expect(result).toBe("<main><div class=\"subsection--notes\"><p>$$5, $& and $' stay put</p></div></main>");
    });

    it('should blank placeholders of unused defined sections', () => {
      const mgr = new SectionMgr({ definedTypes: ['notes', 'steps'], defaultType: 'notes' });

      expect(mgr.replace('[{{__steps__}}]')).toBe('[]');
    });
  });
});
