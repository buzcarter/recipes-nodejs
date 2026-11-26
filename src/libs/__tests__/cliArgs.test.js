const { UsageError, getUsage, parseCommandLine } = require('../cliArgs');

const Defaults = {
  outputDir: './output',
  titleSuffix: ' - Recipe Book',
  includeHelpLinks: false,
  findAuthor: true,
  helpURLs: [],
};

describe('parseCommandLine', () => {
  it('returns no overrides for no arguments', () => {
    expect(parseCommandLine([], Defaults)).toEqual({ overrides: {}, help: false });
  });

  it('reads key=value, splitting on the first "=" only', () => {
    const { overrides } = parseCommandLine(['outputDir=/tmp/a=b', 'titleSuffix='], Defaults);
    expect(overrides).toEqual({ outputDir: '/tmp/a=b', titleSuffix: '' });
  });

  it('turns key=value booleans into booleans', () => {
    const { overrides } = parseCommandLine(['includeHelpLinks=TRUE', 'findAuthor=no'], Defaults);
    expect(overrides).toEqual({ includeHelpLinks: true, findAuthor: false });
  });

  it('reads --key value, --key=value, --flag and --no-flag', () => {
    const { overrides } = parseCommandLine(['--outputDir', '/tmp/x', '--titleSuffix=!', '--includeHelpLinks', '--no-findAuthor'], Defaults);
    expect(overrides).toEqual({
      outputDir: '/tmp/x', titleSuffix: '!', includeHelpLinks: true, findAuthor: false,
    });
  });

  it('reads --help', () => {
    expect(parseCommandLine(['-h'], Defaults).help).toBe(true);
  });

  it.each([
    [['outputDr=/tmp'], 'Unknown setting "outputDr"'],
    [['helpURLs=x'], 'Unknown setting "helpURLs"'],
    [['outputDir'], '"outputDir" needs a value'],
    [['findAuthor=maybe'], '"findAuthor" must be true or false'],
    [['--outputDr', 'x'], "Unknown option '--outputDr'"],
    [['--outputDir'], "'--outputDir <value>' argument missing"],
  ])('rejects %j', (args, message) => {
    expect(() => parseCommandLine(args, Defaults)).toThrow(UsageError);
    expect(() => parseCommandLine(args, Defaults)).toThrow(message);
  });
});

describe('getUsage', () => {
  it('lists the settable keys only', () => {
    const usage = getUsage(Defaults);
    expect(usage).toContain('outputDir');
    expect(usage).toContain('includeHelpLinks     true | false');
    expect(usage).not.toContain('helpURLs');
  });
});
