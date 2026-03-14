/**
 * Run before build. Fails if NEXT_PUBLIC_PRIVY_APP_ID is missing,
 * so Vercel build logs show a clear message instead of "Auth not configured" at runtime.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
if (!appId) {
  console.error('\n❌ Build failed: NEXT_PUBLIC_PRIVY_APP_ID is not set.');
  console.error('   Add it in Vercel: Project → Settings → Environment Variables');
  console.error('   Name: NEXT_PUBLIC_PRIVY_APP_ID');
  console.error('   Value: your Privy App ID (e.g. from dashboard.privy.io)');
  console.error('   Enable: Production + Preview → Save → Redeploy (with new build)\n');
  process.exit(1);
}
console.log('✓ NEXT_PUBLIC_PRIVY_APP_ID is set');
