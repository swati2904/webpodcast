import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/icons/*',
          dest: 'icons',
        },
        {
          src: 'manifest.json',
          dest: '.',
        },
      ],
    }),
    // Plugin to fix content script for Chrome (remove ES module syntax)
    {
      name: 'fix-content-script',
      generateBundle(options, bundle) {
        const contentScript = bundle['content/content.js'];
        if (contentScript && contentScript.type === 'chunk') {
          // Replace import.meta.url with a safe alternative
          contentScript.code = contentScript.code.replace(
            /import\.meta\.url/g,
            '""'
          );
          // Replace import.meta with an empty object
          contentScript.code = contentScript.code.replace(
            /import\.meta(?!\.)/g,
            '({})'
          );
          // Remove export statements at the end (common pattern: export{...})
          contentScript.code = contentScript.code.replace(
            /export\s*\{[^}]*\}\s*;?\s*$/gm,
            ''
          );
          // Remove any standalone export statements
          contentScript.code = contentScript.code.replace(
            /^export\s+[^;]+;?\s*$/gm,
            ''
          );
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
        background: resolve(__dirname, 'src/background/serviceWorker.js'),
        content: resolve(__dirname, 'src/content/contentScript.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background/[name].js';
          }
          if (chunkInfo.name === 'content') {
            return 'content/[name].js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: (chunkInfo) => {
          // Inline all chunks used by content script into the content script itself
          const moduleIds = chunkInfo.moduleIds || [];
          const isContentScriptDep = moduleIds.some(id => 
            id.includes('src/content/') || 
            id.includes('src/ai/') ||
            id.includes('src/utils/') ||
            id.includes('src/tts/')
          );
          if (isContentScriptDep && chunkInfo.name !== 'content') {
            // These will be inlined via manualChunks
            return 'assets/[name]-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: (id) => {
          // Inline all content script dependencies into the content script entry
          if (id.includes('src/content/') || id.includes('src/ai/') || id.includes('src/utils/storage') || id.includes('src/tts/')) {
            return 'content'; // Force all content script deps into content chunk
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
