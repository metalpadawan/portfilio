/**
 * Extract a short plain-text summary from a README (ADR-0003).
 * Pure and dependency-free so the Node snapshot script can import it directly.
 */
export function readmeExcerpt(markdown: string, maxLength = 180): string | null {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const paragraph: string[] = [];
  let inFence = false;
  let inHtmlComment = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('```') || line.startsWith('~~~')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (line.startsWith('<!--')) inHtmlComment = !line.includes('-->');
    else if (inHtmlComment) {
      if (line.includes('-->')) inHtmlComment = false;
      continue;
    }

    const isNoise =
      line === '' ||
      line.startsWith('#') || // headings
      line.startsWith('<') || // raw HTML
      line.startsWith('![') || // images / badges
      line.startsWith('[![') || // linked badges
      line.startsWith('|') || // tables
      line.startsWith('>') || // blockquotes / callouts
      /^[-*_=]{3,}$/.test(line) || // rules / setext underline
      /^[-*+]\s|^\d+\.\s/.test(line); // lists

    if (isNoise) {
      if (paragraph.length > 0) break; // first prose paragraph ended
      continue;
    }
    paragraph.push(line);
  }

  if (paragraph.length === 0) return null;
  const text = stripInlineMarkdown(paragraph.join(' ')).replace(/:$/, '.');
  if (text.length < 12) return null; // too short to be a meaningful summary
  if (BOILERPLATE.some((re) => re.test(text))) return null;
  return truncate(text, maxLength);
}

/** Course-template / setup text that says nothing about the project itself. */
const BOILERPLATE: readonly RegExp[] = [
  /setup environment/i,
  /starting repository for student work/i,
  /intended to get you started/i,
  /^run npm (install|start)/i,
  /^this project was bootstrapped with/i,
  /^getting started/i,
];

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/<[^>]+>/g, '') // stray tags
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:-]+$/, '')}…`;
}
