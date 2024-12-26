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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_MAPBOX_TOKEN,  
  authDomain: process.env.AUTH_DOMAIN,  
  projectId: process.env.PROJECT_ID,  
  storageBucket: process.env.STORAGE_BUCKET,  
  messagingSenderId: process.env.MESSAGING_SENDER_ID,  
  appId: process.env.APP_ID, 
};

initializeApp(firebaseConfig);

function App() {
  const { user } = useUser();

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
          <h2 className="text-designs">Welcome to MoneyTree 🌱</h2>
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
