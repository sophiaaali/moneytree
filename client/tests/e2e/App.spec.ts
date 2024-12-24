import { expect, test } from "@playwright/test";
import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import { clearUser } from "../../src/utils/api";

/**
  The general shapes of tests in Playwright Test are:
    1. Navigate to a URL
    2. Interact with the page
    3. Assert something about the page against your expectations
  Look for this pattern in the tests below!
 */

const SPOOF_UID = "mock-user-id";

test.beforeEach(
  "add spoof uid cookie to browser",
  async ({ context, page }) => {
    // - Add "uid" cookie to the browser context
    await context.addCookies([
      {
        name: "uid",
        value: SPOOF_UID,
        url: "http://localhost:8000",
      },
    ]);

    // wipe everything for this spoofed UID in the database.
    await clearUser(SPOOF_UID);
  }
);

const TIMEOUT = 10000;
const url = "http://localhost:8000/";

interface SetupAuthStateOptions {
  forceSignOut?: boolean;
}

// Navigates to home and handles authentication state before each test
test.beforeEach(async ({ page }) => {
  test.setTimeout(600000);

  await page.goto(url);

  await clerk.loaded({ page });

  try {
    // Try to find either sign in or sign out button
    const signInButton = page.getByRole("button", { name: "Sign in" });
    const signOutButton = page.getByRole("button", { name: "Sign out" });

    const isSignedOut = await signInButton.isVisible().catch(() => false);
    const isSignedIn = await signOutButton.isVisible().catch(() => false);

    // If we see "Sign in", we need to authenticate
    if (isSignedOut) {
      await clerk.signIn({
        page,
        signInParams: {
          strategy: "password",
          password: process.env.E2E_CLERK_USER_PASSWORD_1,
          identifier: process.env.E2E_CLERK_USER_USERNAME_1,
        },
      });
    } else if (!isSignedIn) {
      throw new Error(
        "Neither Sign in nor Sign out button found - page may not have loaded correctly"
      );
    }

    // Verify we end up in a signed-in state
    await expect(signOutButton).toBeVisible();
  } catch (error) {
    console.error("Authentication setup failed:", error);
    throw error;
  }
});

setup("global setup", async ({}) => {
  await clerkSetup();
});

// tests basic login/logout authentication features
test("successful login and logout cycle", async ({ page }) => {
  // First, ensure we're logged out by clicking "Sign Out" if visible
  const signOutButton = page.getByRole("button", { name: "Sign Out" });
  const signInButton = page.getByRole("button", { name: "Sign In" });

  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
  }

  // Ensure the sign-in button is visible
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
  await expect(signInButton).toBeVisible();

  // Click the "Sign In" button to initiate login
  await signInButton.click();

  // Fill in email
  const emailField = page.getByLabel("Email address");
  await emailField.click();
  await emailField.fill("brownstudent@brown.edu");

  // Click continue after filling email
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Fill in password
  const passwordField = page.getByLabel("Password", { exact: true });
  await passwordField.click();
  await passwordField.fill("BrownStudent123!");

  // Click continue after filling password
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify we are logged in by checking for the sign-out button
  await expect(signOutButton).toBeVisible();

  // Perform sign-out to complete the cycle
  await signOutButton.click();

  // Confirm we returned to the logged-out state
  await expect(signInButton).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// tests that 2 users can log in after one another
test("sequential brown.edu users login and access check", async ({ page }) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // Sign out first user
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();

  // Second Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent2@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify second user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // Sign out second user
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

//  tests that users can add and update their chosen plant in the garden and budget tab
test("add and update budget to show up as plant in the garden", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();
  // await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  // === Budget Management ===
  await page.getByRole("link", { name: "Budgets" }).click();

  // Add a budget
  await page.getByPlaceholder("category name").fill("Clothes");
  await page.getByPlaceholder("budget amount").fill("100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("12");
  await page.getByPlaceholder("amount spent").fill("5");
  await page.getByLabel("plantplease select a").selectOption("willow tree");
  await page
    .getByPlaceholder("enter any notes about this")
    .fill("Christmas Presents");
  await page.getByRole("button", { name: "save budget" }).click();

  // Verify the budget exists
  await expect(page.getByText("Category: Clothes Budget: 100")).toBeVisible();

  // === Spending Updates ===
  await page.getByRole("link", { name: "Garden" }).click();
  await page.getByText("Clothes$5 / $").click();
  await page.getByPlaceholder("Update spending").click();

  // Test positive values
  await page.getByPlaceholder("Update spending").fill("25");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Clothes$30 / $")).toBeVisible();
  await page.getByText("Clothes$30 / $").click();
  await page.getByPlaceholder("Update spending").click();

  // Test negative values
  await page.getByPlaceholder("Update spending").fill("-10");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Clothes$20 / $")).toBeVisible();
  await page.getByText("Clothes$20 / $").click();
  await page.getByPlaceholder("Update spending").click();

  // Test inputting zero
  await page.getByPlaceholder("Update spending").fill("0");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Clothes$20 / $")).toBeVisible();
  await page.getByText("Clothes$20 / $").click();
  await page.getByRole("button", { name: "Close" }).click();

  await page.getByText("Clothes$20 / $").click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("25");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Clothes$45 / $")).toBeVisible();
  await page.getByRole("img", { name: "Clothes plant" }).click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("50");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await page.getByRole("img", { name: "Clothes plant" }).click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("200");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await page.getByRole("img", { name: "Clothes plant" }).click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("-200");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Clothes$95 / $")).toBeVisible;
  await page.getByText("Clothes$95 / $").click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("5");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await page.getByText("Clothes$100 / $").click();

  // Test deleting budget erases entry from garden and budget history
  await page.getByRole("button", { name: "Delete Budget" }).click();
  await page.getByText("no plants in your garden yet").click();
  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByText("no entries yet... start by").click();
  await expect(page.getByText("Clothes$100 / $")).not.toBeVisible();

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test that the plant appears in the correct stage and multiple plants have various stages that can be updated respectively
test("correct plants chosen and their corresponding stages are updated accordingly", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();
  // await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);
  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  // === Budget Management ===
  await page.getByRole("link", { name: "Budgets" }).click();

  // Add a multiple budgets
  await page.getByPlaceholder("category name").fill("Food");
  await page.getByPlaceholder("budget amount").fill("300");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("3");
  await page.getByPlaceholder("amount spent", { exact: true }).fill("100");
  await page
    .getByLabel("plantplease select a")
    .selectOption("cherry blossom tree");
  await page
    .getByPlaceholder("enter any notes about this")
    .fill("Spring Birthdays");
  await page.getByRole("button", { name: "save budget" }).click();
  await page.getByPlaceholder("category name").fill("Barber");
  await page.getByPlaceholder("budget amount").fill("120");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("2");
  await page.getByPlaceholder("amount spent", { exact: true }).fill("100");
  await page.getByLabel("plantplease select a").selectOption("orchid");
  await page
    .getByPlaceholder("enter any notes about this")
    .fill("Tip included");
  await page.getByRole("button", { name: "save budget" }).click();

  // Verify the budget exists
  await expect
    .soft(page.getByText("Category: Food Budget: 300").first())
    .toBeVisible();
  await expect
    .soft(page.getByText("Category: Barber Budget: 120").first())
    .toBeVisible();

  // Initial state checks
  await page.getByRole("link", { name: "Garden" }).click();

  // Check initial cherry blossom state (alive)
  let cherryBlossomImage = await page.locator("img[alt='Food plant']").first();
  let cherryBlossomImageSrc = await cherryBlossomImage.getAttribute("src");
  expect(cherryBlossomImageSrc).toContain("cherryblossomtree_alive");

  // Check initial orchid state (wilted)
  let orchidImage = await page.locator("img[alt='Barber plant']").first();
  let orchidImageSrc = await orchidImage.getAttribute("src");
  expect(orchidImageSrc).toContain("orchid_wilted");

  // Update cherry blossom to wilted state
  await page.getByText("Food$100 / $").click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("150");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Food$250 / $")).toBeVisible();

  // Get fresh image src and check wilted state
  cherryBlossomImage = await page.locator("img[alt='Food plant']").first();
  cherryBlossomImageSrc = await cherryBlossomImage.getAttribute("src");
  expect(cherryBlossomImageSrc).toContain("cherryblossomtree_wilted");

  // Update to dead state
  await page.getByText("Food$250 / $").click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("50");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Food$300 / $")).toBeVisible();

  // Get fresh image src and check dead state
  cherryBlossomImage = await page.locator("img[alt='Food plant']").first();
  cherryBlossomImageSrc = await cherryBlossomImage.getAttribute("src");
  expect(cherryBlossomImageSrc).toContain("cherryblossomtree_dead");

  // Update orchid to dead state
  await page.getByText("Barber$100 / $").click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("100");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Barber$200 / $")).toBeVisible();

  // Get fresh image src and check dead state
  orchidImage = await page.locator("img[alt='Barber plant']").first();
  orchidImageSrc = await orchidImage.getAttribute("src");
  expect(orchidImageSrc).toContain("orchid_dead");

  // Update to alive state
  await page.getByText("Barber$200 / $").click();
  await page.getByPlaceholder("Update spending").click();
  await page.getByPlaceholder("Update spending").fill("-200");
  await page.getByRole("button", { name: "Update Spending" }).click();
  await expect(page.getByText("Barber$0 / $")).toBeVisible();

  // Get fresh image src and check alive state
  orchidImage = await page.locator("img[alt='Barber plant']").first();
  orchidImageSrc = await orchidImage.getAttribute("src");
  expect(orchidImageSrc).toContain("orchid_alive");

  // Verify Cherry Blossom Tree is present in the garden
  const cherryBlossomPlant = await page
    .locator("img[alt='Food plant']")
    .first();
  await expect(cherryBlossomPlant).toBeVisible();

  // Verify Orchid is present in the garden
  const orchidPlant = await page.locator("img[alt='Barber plant']").first();
  await expect(orchidPlant).toBeVisible();

  // Verify that there are exactly two plants in the garden
  const plantsInGarden = await page.locator("img[alt*='plant']").count();
  expect(plantsInGarden).toBe(2);

  // Test deleting budget erases entry from garden and budget history
  await page.getByText("Food$300 / $").click();
  await page.getByRole("button", { name: "Delete Budget" }).click();
  await page.getByText("Barber$0 / $").click();
  await page.getByRole("button", { name: "Delete Budget" }).click();
  await page.getByText("no plants in your garden yet").click();
  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByText("no entries yet... start by").click();
  await expect(page.getByText("Food$100 / $")).not.toBeVisible();
  await expect(page.getByText("Barber$0 / $")).not.toBeVisible();

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test that plants persist after sign in and sign out
test("plants persist after sign in and sign out", async ({ page }) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  // === Budget Management ===
  await page.getByRole("link", { name: "Budgets" }).click();

  // Add a budget
  await page.getByPlaceholder("category name").fill("Clothes");
  await page.getByPlaceholder("budget amount").fill("100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("12");
  await page.getByPlaceholder("amount spent", { exact: true }).fill("5");
  await page.getByLabel("plantplease select a").selectOption("willow tree");
  await page
    .getByPlaceholder("enter any notes about this")
    .fill("Christmas Presents");
  await page.getByRole("button", { name: "save budget" }).click();

  // Verify the budget exists
  await expect(page.getByText("Category: Clothes Budget: 100")).toBeVisible();

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // Verify Willow Tree is present in the garden
  const willowPlant = await page.locator("img[alt='Clothes plant']").first();
  await expect(willowPlant).toBeVisible();

  // Test deleting budget erases entry from garden and budget history
  await page.getByText("Clothes$5 / $").click();
  await page.getByRole("button", { name: "Delete Budget" }).click();
  await page.getByText("no plants in your garden yet").click();
  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByText("no entries yet... start by").click();
  await expect(page.getByText("Clothes$5 / $")).not.toBeVisible();

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: empty required fields
test("test edge cases in the budget tab information fields: empty required fields", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByRole("button", { name: "save budget" }).click();
  // Empty fields should trigger alert
  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Please fill in the required fields.");
    dialog.dismiss().catch(() => {});
  });

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: negative budget amount
test("test edge cases in the budget tab information fields: negative budget amount", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByPlaceholder("category name").fill("Test Category");
  await page.getByPlaceholder("budget amount").fill("-100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("monthly");
  await page.getByRole("button", { name: "save budget" }).click();

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Budget must be a positive number.");
    dialog.dismiss().catch(() => {});
  });

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: negative spent amount
test("test edge cases in the budget tab information fields: negative spent amount", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByPlaceholder("category name").fill("Test Category");
  await page.getByPlaceholder("budget amount").fill("100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("monthly");
  await page.getByPlaceholder("amount spent").fill("-50");
  await page.getByRole("button", { name: "save budget" }).click();

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Spent amount cannot be negative.");
    dialog.dismiss().catch(() => {});
  });

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: zero budget amount
test("test edge cases in the budget tab information fields: zero budget amount", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByPlaceholder("category name").fill("Test Category");
  await page.getByPlaceholder("budget amount").fill("0");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("monthly");
  await page.getByRole("button", { name: "save budget" }).click();

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Budget must be a positive number.");
    dialog.dismiss().catch(() => {});
  });

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: spent amount update validation
test("test edge cases in the budget tab information fields: spent amount update validation", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  // First create a budget
  await page.getByPlaceholder("category name").fill("Test Category");
  await page.getByPlaceholder("budget amount").fill("100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("monthly");
  await page.getByPlaceholder("amount spent").fill("20");
  await page.getByLabel("plantplease select a").selectOption("plant");
  await page.getByRole("button", { name: "save budget" }).click();

  // Try to update with invalid amount
  await page.getByPlaceholder("Input amount spent...").fill("-30");
  await page.getByRole("button", { name: "Update my spendings" }).click();

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Please enter a valid amount.");
    dialog.dismiss().catch(() => {});
  });

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: whitespace in required fields
test("test edge cases in the budget tab information fields: whitespace in required fields", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByPlaceholder("category name").fill("   ");
  await page.getByPlaceholder("budget amount").fill("100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("   ");
  await page.getByRole("button", { name: "save budget" }).click();

  page.once("dialog", (dialog) => {
    expect(dialog.message()).toBe("Please fill in the required fields.");
    dialog.dismiss().catch(() => {});
  });

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: non-numeric values in duration
test("test edge cases in the budget tab information fields: non-numeric values in duration", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  await page.getByPlaceholder("category name").fill("Test Category");
  await page.getByPlaceholder("budget amount").fill("100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("invalid");
  await page.getByPlaceholder("amount spent").fill("20");
  await page.getByLabel("plantplease select a").selectOption("plant");
  await page.getByRole("button", { name: "save budget" }).click();

  // Verify the entry is added to history
  await expect(page.getByText("Test Category")).toBeVisible();

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: duplicate category names
test("test edge cases in the budget tab information fields: duplicate category names", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  // Create first budget
  await page.getByPlaceholder("category name").fill("Duplicate Test");
  await page.getByPlaceholder("budget amount").fill("100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("monthly");
  await page.getByLabel("plantplease select a").selectOption("plant");
  await page.getByRole("button", { name: "save budget" }).click();

  // Try to create second budget with same name
  await page.getByPlaceholder("category name").fill("Duplicate Test");
  await page.getByPlaceholder("budget amount").fill("200");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("yearly");
  await page.getByLabel("plantplease select a").selectOption("willow tree");
  await page.getByRole("button", { name: "save budget" }).click();

  // Verify both entries exist
  const categoryElements = await page.getByText("Duplicate Test").all();
  expect(categoryElements.length).toBe(2);

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// test edge cases in the budget information fields: budget deletion
test("test edge cases in the budget tab information fields: budget deletion", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  await page.getByRole("link", { name: "Budgets" }).click();
  // Create a budget
  await page.getByPlaceholder("category name").fill("Delete Test");
  await page.getByPlaceholder("budget amount").fill("100");
  await page.getByPlaceholder("duration (e.g., monthly)").fill("monthly");
  await page.getByLabel("plantplease select a").selectOption("plant");
  await page.getByRole("button", { name: "save budget" }).click();

  // Delete the budget
  await page.getByRole("button", { name: "Delete entire budget" }).click();

  // Verify the entry is removed
  await expect(page.getByText("Delete Test")).not.toBeVisible();

  // === Sign Out ===
  await signOutButton.click();
  await expect(signInButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
  ).toBeVisible();
});

// Helper function to mock API responses
const mockApiResponses = (page: any, response: any) => {
  page.on("route", (route) => {
    if (route.request().url().includes("/getSummary")) {
      route.fulfill({
        status: 200,
        body: JSON.stringify(response.summary),
        contentType: "application/json",
      });
    } else if (route.request().url().includes("/getAdvice")) {
      route.fulfill({
        status: 200,
        body: JSON.stringify(response.advice),
        contentType: "application/json",
      });
    } else {
      route.continue();
    }
  });
};

// test insights AI tab to contain correct fields and functionalities
test("test insights tab correctly contains all the correct information and functionality", async ({
  page,
}) => {
  // Ensure the user is logged out initially
  const signInButton = page.getByRole("button", { name: "Sign In" });
  const signOutButton = page.getByRole("button", { name: "Sign Out" });

  // If already logged in, sign out
  if (await signOutButton.isVisible().catch(() => false)) {
    await signOutButton.click();
    await expect(signInButton).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Welcome to MoneyTree 🌱" })
    ).toBeVisible();
  }

  // First Brown user login
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.getByLabel("Email address").click();
  await page.getByLabel("Email address").fill("brownstudent@brown.edu");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Password", { exact: true }).fill("BrownStudent123!");
  await page.getByRole("button", { name: "Continue" }).click();

  // Verify first user is logged in
  await expect(signOutButton).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "🌱 your garden 🌱" })
  ).toBeVisible();

  // === Clear Garden ===
  const plantsPresent = await page
    .getByText("no plants in your garden yet")
    .isVisible()
    .catch(() => false);

  if (!plantsPresent) {
    // Delete all plants if garden is not empty
    const plantCards = page.locator(".plant-card");
    const count = await plantCards.count();
    for (let i = 0; i < count; i++) {
      await plantCards.nth(0).click(); // Click first plant to open modal
      await page.getByRole("button", { name: "Delete Budget" }).click();
      await page.waitForTimeout(500); // Small delay to ensure plant is deleted
    }
  }

  // Confirm garden is empty
  await expect(page.getByText("no plants in your garden yet")).toBeVisible();

  // Open Insights tab
  await page.getByRole("link", { name: "Insights" }).click();

  // Test "Generate Summary" button functionality
  const summaryButton = await page.getByRole("button", {
    name: "Generate Summary",
  });
  await expect(summaryButton).toBeVisible();
  await summaryButton.click();

  // Test "Get Advice" functionality (ensure goal input and advice generation)
  const goalInput = await page.getByPlaceholder("e.g., Save $5000 for a");
  const adviceButton = await page.getByRole("button", { name: "Get Advice" });

  await goalInput.fill("How to better save money during the summer?");
  await adviceButton.click();

  // Verify loading state while getting advice
  await expect(page.getByText("Getting Advice...")).toBeVisible();

  // After receiving advice, check if advice text is visible
  const adviceText = page.locator("text=To save money during the");
  await adviceText.waitFor({ state: "visible", timeout: 10000 });
  await expect(adviceText).toBeVisible();

  // Switch tabs to "Garden" and back to "Insights" to check data persistence
  await page.getByRole("link", { name: "Garden" }).click();
  await page.getByRole("link", { name: "Insights" }).click();

  // Verify the summary and advice are still present
  await expect(adviceText).toBeVisible();

  // Test error handling when no goal is provided
  await goalInput.fill("");
  await adviceButton.click();
  await expect(page.getByText("Please enter a goal")).toBeVisible();

  // Test for reactivity when changing goal input
  await goalInput.fill("What's the best way to earn money in the winter?");
  await adviceButton.click();
  await expect(page.getByText("To save money during the")).toBeVisible();

  // Verify that after switching tabs and coming back, the new advice is shown
  await page.getByRole("link", { name: "Garden" }).click();
  await page.getByRole("link", { name: "Insights" }).click();
  await expect(page.getByText("To save money during the")).toBeVisible();
});
