# MoneyTree 🌱

Try it out here https://welcome-to-moneytree.vercel.app/!

## Contributors

Emma Chen (Brown '27), Erin Kim (Brown '27), Katerina Nguyen (Brown '27), Sophia Li (Brown '27)

## Overview

Description:

MoneyTree is a visually engaging and intuitive budget management web application that helps users track their expenses in a creative and interactive way. By associating budgets with plants, users can see their financial health grow (or wilt!) over time. Each budget corresponds to a plant, and its state reflects how well the user is managing their spending in relation to their budget. MoneyTree combines visual feedback with practical budgeting tools, offering an immersive experience that gamifies the process of financial responsibility.

## Technology Stack
Built with:
- Frontend: React, TypeScript, HTML/CSS, JavaScript (Vanta.js, Three.js)
- Backend: Java, Spark Java
- Database: Firebase Firestore
- Authentication: Clerk
- API: OpenAI API

Deployed Vite React on Vercel: https://welcome-to-moneytree.vercel.app/

## Features

### Garden View

- User authentication via Clerk
- Dynamically renders budgets as alive, wilted, or dead plants
- Interactive modal design for accessible budget updates

### Budget Management View

- Manage financial history by adding new budgets or updating existing ones, all supported by integration with Firebase

### Insights View

- Integration with OpenAI API for personalized spending summaries and advice unique to each user's spending history at that snapshot in time

## How to...

### Frontend: Client

Navigate to the directory to install dependencies:

```agsl
cd client
npm install
```

Start the client

```agsl
npm run start
```

Run Playwright tests

```agsl
npm run test
```

### Backend: Server

Navigate to the directory to install dependencies, run tests, and build:

```agsl
cd server
mvn package
```

Start the server

```agsl
./run
```

## Application Usage

### Log in or Sign up

- Navigate to the homepage of the website and log in using email.

### Access your Garden

- After logging in, you’ll be taken to your personalized garden view.
- Each plant in the garden represents a budget category (e.g., Food, Entertainment, Transportation). The health of the plant (alive, wilting, or dead) corresponds to your spending habits within that category.
- Click on a plant in the garden to open a modal window where you can update or delete the budget for that category.

### Create and Manage Budgets

- Navigate to the Budgets page to create new budget categories.
- Provide details such as the category name, budget limit, duration, plant type, and any initial spending.
- Submit the form to add a new plant to your garden view.
- Access budget history with options to update or delete individual budgets on this page.

### Track Spending

- Your garden dynamically updates as you modify spending amounts or create new budgets.
- The progress bars and plant health visually indicate how well you’re adhering to your budget goals.

### Receive Financial Insights

- Access personalized summaries and advice through integration with OpenAI’s API.
- Navigate to the Insights page to receive tailored spending insights based on your budget data and financial goals.


## Comprehensive automated testing suite:

Front-end Testing: Playwright

- successful login and logout cycle: tests basic login/logout authentication features via Clerk authentification
- sequential brown.edu users login and access check: tests that 2 users can log in after one another
- add and update budget to show up as plant in the garden: tests that users can add plants via the budget tab and update/delete their chosen plant in the garden tab
- correct plants are chosen and their corresponding stages are updated accordingly: test that the plant appears in the correct stage and multiple plants have various stages that can be updated respectively
- plants persist after sign in and sign out: test that plants persist after sign in and sign out
- test edge cases in the budget tab information fields: empty required fields: test for correct output displayed for empty required fields
- test edge cases in the budget tab information fields: negative budget amount: test edge cases in the budget information fields: test for correct output displayed for a negative budget amount
- test edge cases in the budget tab information fields: negative spent amount: test for correct output displayed for negative spent amount
- test edge cases in the budget tab information fields: zero budget amount: test for correct output displayed for zero budget amount
- test edge cases in the budget tab information fields: spent amount update validation: test for correct output displayed for spent amount update validation
- test edge cases in the budget tab information fields: whitespace in required fields: test for correct output displayed for whitespace in required fields
- test edge cases in the budget tab information fields: non-numeric values in duration: test for correct output displayed for non-numeric values in duration
- test edge cases in the budget tab information fields: duplicate category names: test for correct output displayed for duplicate category names
- test edge cases in the budget tab information fields: budget deletion: test for correct output displayed when using the delete budget option in the Budget tab
- test insights tab correctly contains all the correct information and functionality: test insights AI tab to contain correct fields and functionalities

Back-end Testing: Unit Testing

- Unit tests for all handlers
- Tests with mocked firebase storage and mocked OpenAI client

## Citation

OpenAI. (2024). ChatGPT (GPT-4o) [Large language model]. https://chat.openai.com/chat/ We used Blender and ChatGPT to help generate plant images in the alive, wilting, and dead states.
