export class SectionMgr {
  constructor({ definedTypes, defaultType }) {
    if (Array.isArray(definedTypes)) {
      this.definedTypes = definedTypes;
    } else if (definedTypes && typeof definedTypes === 'object') {
      this.definedTypes = Object.keys(definedTypes).map((key) => definedTypes[key]);
    }
    this.defaultType = defaultType || '';
  }

  definedTypes = [];

  defaultType = '';

  sections = {};

  unknownTypes = [];

  get hasWarnings() {
    return this.unknownTypes.length > 0;
  }

  get warnings() {
    return this.unknownTypes.join(', ');
  }

  get sectionsInUse() {
    return Object.keys(this.sections);
  }

  get sectionsUnused() {
    return this.definedTypes.filter((type) => !this.sections[type]);
  }

  add(sectionType, subsectionName, sectionHTML) {
    if (this.defaultType && !this.definedTypes.includes(sectionType)) {
      this.unknownTypes.push(sectionType);
      sectionType = this.defaultType;
    }
    this.sections[sectionType] = `${this.sections[sectionType] || ''}<div class="subsection--${subsectionName || sectionType}">${sectionHTML}</div>`;
  }

  /**
   * Fills each `{{__<sectionType>__}}` placeholder in `documentHTML` with its section's HTML,
   * and blanks the placeholders of defined sections that weren't used.
   */
  replace(documentHTML) {
    Object.keys(this.sections)
      // function replacer: a string replacement would treat `$&`, `$$`, etc. in recipe text as patterns
      // eslint-disable-next-line no-return-assign
      .forEach((sectionType) => documentHTML = documentHTML.replace(`{{__${sectionType}__}}`, () => this.sections[sectionType]));

    // clean-up unused sections
    this.definedTypes
      // eslint-disable-next-line no-return-assign
      .forEach((sectionType) => documentHTML = documentHTML.replace(`{{__${sectionType}__}}`, ''));

    return documentHTML;
  }
}
