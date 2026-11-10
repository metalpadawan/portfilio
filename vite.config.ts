import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vitest/config';
import { config } from './src/config.ts';
import { sizedAvatar } from './src/github/urls.ts';

const escapeHtml = (s: string): string =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );

/**
 * Fills %token% placeholders in index.html from src/config.ts (SPEC F8), so profile
 * text is in the static HTML for SEO and no-JS visitors, with one source of truth.
 */
function htmlFromConfig(): Plugin {
  return {
    name: 'html-from-config',
    transformIndexHtml(html) {
      const snapshot = JSON.parse(
        // Resolved from this file, not the shell's cwd (audit fix J).
        readFileSync(new URL('./src/data/repos.json', import.meta.url), 'utf8'),
      ) as {
        user: { avatar_url: string };
      };
      const initials = config.displayName
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0))
        .filter((_, i, all) => i === 0 || i === all.length - 1)
        .join('');
      const tokens: Record<string, string> = {
        displayName: config.displayName,
        initials,
        role: config.role,
        location: config.location,
        tagline: config.tagline,
        intro: config.intro,
        github: config.links.github,
        linkedin: config.links.linkedin,
        email: config.links.email,
        avatar: snapshot.user.avatar_url,
        avatarSized: sizedAvatar(snapshot.user.avatar_url, 320),
        aboutHeading: config.about.heading,
        aboutLead: config.about.lead,
        aboutPersonal: config.about.personal,
        aboutAim: config.about.aim,
        siteUrl: config.siteUrl,
        // Link previews need an absolute image URL; the file ships from public/.
        ogImage: new URL('og-image.png', config.siteUrl).href,
      };
      return html.replace(/%(\w+)%/g, (match, key: string) => {
        const value = tokens[key];
        return value === undefined ? match : escapeHtml(value);
      });
    },
  };
}

// Relative base so the same build works on GitHub Pages sub-paths, Vercel or a custom domain (ADR-0004).
export default defineConfig({
  base: './',
  plugins: [htmlFromConfig()],
  build: {
    target: 'es2022',
    sourcemap: true,
    // Second page: the Dub or Sub? demo (ADR-0006).
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        duborsub: fileURLToPath(new URL('./demos/duborsub/index.html', import.meta.url)),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
