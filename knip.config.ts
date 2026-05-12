import { createKnipConfig } from '@ankhorage/devtools/knip';

export default createKnipConfig({
  ignoreDependencies: ['@supabase/supabase-js'],
  ignoreFiles: ['.prettierrc.js', 'eslint.config.mjs', 'paradox.config.ts'],
});
