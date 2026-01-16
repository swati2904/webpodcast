import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const alias = { '@': resolve(__dirname, 'src') };

// Strip module-only syntax so the MV3 content script stays classic JS
const fixContentScript = {
  name: 'fix-content-script',
  generateBundle(options, bundle) {
    const contentScript = bundle['content/content.js'];
    if (contentScript && contentScript.type === 'chunk') {
      contentScript.code = contentScript.code
        .replace(/import\.meta\.url/g, '""')
        .replace(/import\.meta(?!\.)/g, '({})')
        .replace(/export\s*\{[^}]*\}\s*;?\s*$/gm, '')
        .replace(/^export\s+[^;]+;?\s*$/gm, '');
    }
  },
};

export default defineConfig({
  plugins: [react(), fixContentScript],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content/contentScript.js'),
      },
      output: {
        entryFileNames: 'content/[name].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        inlineDynamicImports: true,
      },
    },
  },
  resolve: { alias },
});
