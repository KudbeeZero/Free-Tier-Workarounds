/**
 * Standalone CLI runner for the seed module.
 *
 * Usage:
 *   npm run db:seed
 */

import { seedMockData } from "./seedData";

seedMockData()
  .then((created) => {
    console.log(created ? "[seed] Done — data seeded." : "[seed] Done — nothing to do.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  });
