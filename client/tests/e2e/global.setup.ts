import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";

/**
 * Global setup for Playwright tests.
 */
setup("global setup", async ({}) => {
  await clerkSetup();
});
