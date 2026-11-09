import { describe, expect, it } from 'vitest';
import { readmeExcerpt } from '../src/github/readme';

describe('readmeExcerpt', () => {
  it('skips headings, badges and HTML and takes the first prose paragraph', () => {
    const md = [
      '# My App',
      '[![CI](https://x/badge.svg)](https://x)',
      '<p align="center"><img src="x.png"></p>',
      '',
      'A **fast** app built with [React](https://react.dev) and `vite`.',
      'It does useful things.',
      '',
      'Second paragraph ignored.',
    ].join('\n');
    expect(readmeExcerpt(md)).toBe('A fast app built with React and vite. It does useful things.');
  });

  it('ignores fenced code and HTML comments', () => {
    const md =
      '```bash\nnpm install\n```\n<!-- hidden\ncomment -->\nReal summary of the project here.';
    expect(readmeExcerpt(md)).toBe('Real summary of the project here.');
  });

  it('returns null for empty, tiny or boilerplate READMEs', () => {
    expect(readmeExcerpt('')).toBeNull();
    expect(readmeExcerpt('# Title only')).toBeNull();
    expect(readmeExcerpt('Hi there')).toBeNull();
    expect(readmeExcerpt('WDD 330 Setup Environment')).toBeNull();
    expect(readmeExcerpt('Run npm install and npm start from the backend folder')).toBeNull();
  });

  it('turns a trailing colon into a full stop', () => {
    expect(readmeExcerpt('A lightweight flight charter site with:\n- a\n- b')).toBe(
      'A lightweight flight charter site with.',
    );
  });

  it('truncates on a word boundary with an ellipsis', () => {
    const out = readmeExcerpt('word '.repeat(100), 50) ?? '';
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('…')).toBe(true);
  });

  it('handles CRLF line endings', () => {
    expect(readmeExcerpt('# T\r\n\r\nWindows line endings work fine.\r\n')).toBe(
      'Windows line endings work fine.',
    );
  });
});
