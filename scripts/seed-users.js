/**
 * scripts/seed-users.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds the 30 NetCert students into Vercel KV.
 *
 * Usage:
 *   node scripts/seed-users.js           → seeds into Vercel KV
 *   node scripts/seed-users.js --dry     → prints what would be stored (no KV)
 *   node scripts/seed-users.js --local   → saves to scripts/users-seed.json
 *
 * Requires KV env vars (set via `vercel env pull .env.local` or .env file):
 *   KV_URL, KV_REST_API_URL, KV_REST_API_TOKEN
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const bcrypt = require('bcryptjs');
const fs     = require('fs');
const path   = require('path');

const SALT_ROUNDS = 10;

// ── User definitions ─────────────────────────────────────────────────────────
const USERS = [
  { studentId: '25115404', name: '羅捷克(RATANAK NORAK)',              role: '學生', password: '25115404' },
  { studentId: '25115405', name: '陳品睿(ANGEL AUGUSTO CHEN CHENG)',   role: '學生', password: '25115405' },
  { studentId: '25115406', name: '廖曠光(HERY)',                        role: '學生', password: '25115406' },
  { studentId: '25115407', name: '黃謹呂(STEVEN GEISTBONG)',            role: '學生', password: '25115407' },
  { studentId: '25115408', name: '約瑟拉(JOSHELAH ABELLA APURA)',       role: '學生', password: '25115408' },
  { studentId: '25115409', name: '雷切爾(RACHELLE CEJUELA ADAPTAR)',    role: '學生', password: '25115409' },
  { studentId: '25115410', name: '爾亨斯(RHENZ CARDIENTE LANZADERAS)',  role: '學生', password: '25115410' },
  { studentId: '25115411', name: '林亞典(ADRIAN VILLALUNA)',             role: '學生', password: '25115411' },
  { studentId: '25115413', name: '陳志勇(TRAN CHI DUNG)',               role: '學生', password: '25115413' },
  { studentId: '25115414', name: '馬帕克(PATRICK CALIBAY MALALA)',      role: '學生', password: '25115414' },
  { studentId: '25115416', name: '蘇鑽輪(SWANLUN)',                      role: '學生', password: '25115416' },
  { studentId: '25115418', name: '瑞居(REY JUDE ESPINA TUSI)',          role: '學生', password: '25115418' },
  { studentId: '25115419', name: '馮秀琪(PHUNG TU KY)',                  role: '學生', password: '25115419' },
  { studentId: '25115420', name: '施佳雯(BILLY NATHANAEL)',              role: '學生', password: '25115420' },
  { studentId: '25115421', name: '王偉(MICHAEL FRANCESCOWY)',            role: '學生', password: '25115421' },
  { studentId: '25115422', name: '黃友和(GABRIEL FERNANDO)',             role: '學生', password: '25115422' },
  { studentId: '25115423', name: '成建建(KEN KEN)',                       role: '學生', password: '25115423' },
  { studentId: '25115424', name: '江俊雄(DAVID WILLIAM)',                role: '學生', password: '25115424' },
  { studentId: '25115425', name: '徐霖壽(JUSTIN FEBRIAN SIDIK)',         role: '學生', password: '25115425' },
  { studentId: '25115426', name: '曾俊森(MATTHEW LUISCHAN)',             role: '學生', password: '25115426' },
  { studentId: '25115427', name: '黎松偉(FREDERICK YOSLY)',              role: '學生', password: '25115427' },
  { studentId: '25115428', name: '楊樹根(MARVEL HASUMIYO)',              role: '學生', password: '25115428' },
  { studentId: '25115429', name: '陳瓊科(ARIANTO TANJAYA)',              role: '學生', password: '25115429' },
  { studentId: '25115430', name: '鄭現財(WILSON)',                        role: '學生', password: '25115430' },
  { studentId: '25115431', name: '黃英和(VONG ANH HOA)',                 role: '學生', password: '25115431' },
  { studentId: '25115432', name: '沈名志(SAM MINH CHI)',                 role: '學生', password: '25115432' },
  { studentId: '25115433', name: '阮文煌(NGUYEN VAN HOANG)',             role: '學生', password: '25115433' },
  { studentId: '25115436', name: '黃鴻鵬(SAMUEL SEBASTIAN)',             role: '學生', password: '25115436' },
  { studentId: '25115438', name: '陳槡槡(CLYDIE COLLY)',                  role: '學生', password: '25115438' },
  { studentId: '25115439', name: '黃柳槡(JOICE FAUSTINE)',               role: '學生', password: '25115439' },
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args    = process.argv.slice(2);
  const isDry   = args.includes('--dry');
  const isLocal = args.includes('--local');

  console.log('\n🔐 NetCert User Seeder');
  console.log('════════════════════════════════════════');
  console.log(`  Mode: ${isDry ? 'DRY RUN' : isLocal ? 'LOCAL JSON' : 'VERCEL KV'}`);
  console.log(`  Users: ${USERS.length}`);
  console.log('════════════════════════════════════════\n');

  // ── Hash passwords in parallel ────────────────────────────────────────────
  console.log('⏳ Hashing passwords...');
  const seeded = await Promise.all(
    USERS.map(async u => {
      const passwordHash = await bcrypt.hash(String(u.password), SALT_ROUNDS);
      return {
        studentId:      u.studentId,
        name:           u.name,
        role:           u.role,
        passwordHash,
        xp:             0,
        level:          1,
        streak:         0,
        lastActiveDate: null,
        createdAt:      new Date().toISOString(),
      };
    })
  );
  console.log('✅ Passwords hashed.\n');

  // ── Dry run — just print ──────────────────────────────────────────────────
  if (isDry) {
    console.log('📋 Would seed the following users:\n');
    seeded.forEach(u => {
      console.log(`  KV key: user:${u.studentId}`);
      console.log(`    name: ${u.name}`);
      console.log(`    hash: ${u.passwordHash.slice(0, 20)}...`);
      console.log('');
    });
    console.log('(No data was written — dry run mode)');
    return;
  }

  // ── Local JSON fallback ───────────────────────────────────────────────────
  if (isLocal) {
    const outPath = path.join(__dirname, 'users-seed.json');
    // Don't write actual hashes to JSON for security; write a safe preview
    const preview = seeded.map(({ passwordHash: _ph, ...u }) => u);
    fs.writeFileSync(outPath, JSON.stringify(preview, null, 2), 'utf8');
    console.log(`✅ Saved user list (without hashes) to:\n   ${outPath}\n`);
    console.log('⚠️  Full seed with hashes requires Vercel KV.\n');
    return;
  }

  // ── Vercel KV seed ────────────────────────────────────────────────────────
  const kvUrl = process.env.KV_REST_API_URL || process.env.KV_URL;
  if (!kvUrl) {
    console.error('❌ KV not configured. Please set KV_REST_API_URL in .env.local\n');
    console.error('   Run:  vercel env pull .env.local\n');
    console.error('   Or:   node scripts/seed-users.js --dry   (to preview)\n');
    process.exit(1);
  }

  let store;
  try {
    store = require('@vercel/kv');
  } catch (err) {
    console.error('❌ @vercel/kv not installed. Run: npm install @vercel/kv\n');
    process.exit(1);
  }

  console.log('📡 Connecting to Vercel KV...');
  let ok = 0, fail = 0;

  for (const user of seeded) {
    try {
      await store.set(`user:${user.studentId}`, user);
      console.log(`  ✓ user:${user.studentId}  (${user.name})`);
      ok++;
    } catch (err) {
      console.error(`  ✗ user:${user.studentId}  → ${err.message}`);
      fail++;
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ Seeded: ${ok} / ${USERS.length}   ❌ Failed: ${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
