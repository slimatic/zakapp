/**
 * Jest globalTeardown. Currently a no-op but present for future cleanup needs
 * (e.g., removing ephemeral DB files).
 */
export default async function globalTeardown() {
  // Placeholder: no teardown actions required at the moment.
  // If ephemeral DB files are created in a later step, remove them here.
  console.log('[globalTeardown] Test teardown complete.');
}
