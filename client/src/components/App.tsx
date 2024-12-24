import { initializeApp } from "firebase/app";
import "../styles/App.css";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import Budget from "./Budgets";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Navbar from "./Navbar";
import Insights from "./Insights";
import Garden from "./Garden";
import { useState } from "react";

// Firebase configuration settings using environment variables for security.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_MAPBOX_TOKEN, // API key for Firebase authentication
  authDomain: process.env.AUTH_DOMAIN, // Firebase Auth domain
  projectId: process.env.PROJECT_ID, // Firebase project ID
  storageBucket: process.env.STORAGE_BUCKET, // Storage bucket for file storage
  messagingSenderId: process.env.MESSAGING_SENDER_ID, // Messaging sender ID for notifications
  appId: process.env.APP_ID, // App ID for the Firebase project
};

// Initialize Firebase app with the provided configuration
initializeApp(firebaseConfig);

function App() {
  const { user } = useUser();

  // Props for Insights page
  const [goal, setGoal] = useState("");
  const [summary, setSummary] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState({ summary: false, advice: false });
  const [error, setError] = useState({ summary: "", advice: "" });

  return (
    <Router>
      <div className="App">
        {/* Navbar and main content only rendered if user is logged in */}
        <SignedIn>
          <Navbar />
          <div className="App-header">
            {/* <h1 aria-label="Project Header">Welcome to MoneyTree!</h1> */}
            <div className="auth-controls">
              <UserButton />
              <SignOutButton />
            </div>
          </div>

          <main className="App-content">
            <Routes>
              {/* Redirect to Garden if logged in */}
              <Route path="/" element={<Navigate to="/garden" />} />

              {/* Garden Page (Requires Login) */}
              <Route
                path="/garden"
                element={<Garden userId={user?.id || ""} />}
              />

              {/* Budgets Page (Requires Login) */}
              <Route
                path="/budgets"
                element={<Budget userId={user?.id || ""} />}
              />

              {/* Insights Page (Requires Login) */}
              <Route
                path="/insights"
                element={
                  <Insights
                    userId={user?.id || ""}
                    goal={goal}
                    setGoal={setGoal}
                    summary={summary}
                    setSummary={setSummary}
                    advice={advice}
                    setAdvice={setAdvice}
                    loading={loading}
                    setLoading={setLoading}
                    error={error}
                    setError={setError}
                  />
                }
              />
            </Routes>
          </main>
        </SignedIn>

        {/* Display login page and prompt user to sign in if not logged in */}
        <SignedOut>
          <div className="home-page">
            <h2>Welcome to MoneyTree 🌱</h2>
            <SignInButton mode="modal">
              <button className="sign-in-button">Sign In</button>
            </SignInButton>
          </div>

          <Routes>
            {/* Redirect to home page when signed out */}
            <Route path="/" element={<Navigate to="/" />} />
          </Routes>
        </SignedOut>

        <div id="modal-root"></div>
      </div>
    </Router>
  );
}

export default App;
