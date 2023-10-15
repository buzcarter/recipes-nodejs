class SectionMgr {
  constructor({ definedTypes, defaultType }) {
    if (Array.isArray(definedTypes)) {
      this.definedTypes = definedTypes;
    } else if (definedTypes && typeof definedTypes === 'object') {
      this.definedTypes = Object.keys(definedTypes).map(key => definedTypes[key]);
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
    return this.definedTypes.filter(type => !this.sections[type]);
  }

  add(sectionType, sectionHTML) {
    if (this.defaultType && !this.definedTypes.includes(sectionType)) {
      this.unknownTypes.push(sectionType);
      sectionType = this.defaultType;
    }
    this.sections[sectionType] = (this.sections[sectionType] || '') + sectionHTML;
  }

  replace(documentHTML) {
    Object.keys(this.sections)
      .forEach(sectionType => documentHTML = documentHTML.replace(`{{__${sectionType}__}}`, this.sections[sectionType]));

    // clean-up unused sections
    this.definedTypes
      .forEach(sectionType => documentHTML = documentHTML.replace(`{{__${sectionType}__}}`, ''));

    return documentHTML;
  }
}

module.exports = SectionMgr;
