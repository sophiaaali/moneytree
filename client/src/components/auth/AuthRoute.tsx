/**
 * AuthRoute Component
 * 
 * This component manages access to gated content based on the user's login status.
 * It checks if a login cookie exists to automatically set the user as logged in 
 * upon initial load, preventing the need for the user to manually log in if they've 
 * already authenticated in the past.
 * 
 * @component
 * @param {AuthRouteProps} props - The properties passed to this component.
 * @property {React.ReactNode} props.gatedContent - The content that is conditionally 
 * rendered based on the login status of the user.
 */

import { useState } from "react";
import { getLoginCookie } from "../../utils/cookie"; // Utility to check login cookie status
import LoginLogout from "./LoginLogout"; // Component to handle login/logout actions

interface AuthRouteProps {
  /** 
   * Content to display only if the user is logged in.
   * This content is conditionally rendered based on the `loggedIn` state.
   */
  gatedContent: React.ReactNode;
}

function AuthRoute(props: AuthRouteProps) {
  // State to track if the user is logged in or not.
  const [loggedIn, setLogin] = useState(false);

  // If a login cookie is present and user isn't already logged in, update state to logged in.
  if (!loggedIn && getLoginCookie() !== undefined) {
    setLogin(true);
  }

  return (
    <>
      {/* Renders login/logout component and passes current login state and updater function */}
      <LoginLogout loggedIn={loggedIn} setLogin={setLogin} />

      {/* Conditionally render gated content if logged in */}
      {loggedIn ? props.gatedContent : null}
    </>
  );
}

export default AuthRoute;
