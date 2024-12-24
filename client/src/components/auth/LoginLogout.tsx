import React, { useEffect, useState } from "react";
import {
  useUser,
  SignInButton,
  SignOutButton,
  UserButton,
  useClerk,
} from "@clerk/clerk-react";
import { addLoginCookie, removeLoginCookie } from "../../utils/cookie";

export interface ILoginPageProps {
  loggedIn: boolean;
  setLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

const LoginLogout: React.FunctionComponent<ILoginPageProps> = (props) => {
  const { isSignedIn, user } = useUser();
  const clerk = useClerk();
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (isSignedIn && user) {
      const isBrownEmail = user.emailAddresses.some((email) =>
        email.emailAddress.endsWith("@brown.edu")
      );

      if (isBrownEmail) {
        addLoginCookie(user.id);
        props.setLogin(true);
        setErrorMessage("");
      } else {
        props.setLogin(false);
        setErrorMessage(
          "Access restricted to Brown University email addresses only."
        );
      }
    } else {
      props.setLogin(false);
      removeLoginCookie();
    }
  }, [isSignedIn, user, props]);

  return (
    <div className="login-logout">
      <div className="App-header">
        <h1 aria-label="Page Header">Maps</h1>
        <div className="auth-controls">
          {isSignedIn ? (
            <>
              <UserButton />
              <SignOutButton>Sign Out</SignOutButton>
            </>
          ) : (
            <SignInButton mode="modal">Sign In</SignInButton>
          )}
        </div>
      </div>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </div>
  );
};

export default LoginLogout;

// /**
//  * LoginLogout Component
//  * 
//  * This component manages user authentication through Clerk, checking if the user 
//  * is signed in and if their email address meets specific criteria for access.
//  * Upon a valid sign-in, a login cookie is set to persist the session, and access is granted 
//  * to users with an "@brown.edu" email address. An error message is displayed for unauthorized domains.
//  * 
//  * @component
//  * @param {ILoginPageProps} props - Properties passed to this component.
//  * @property {boolean} props.loggedIn - Current login state of the user.
//  * @property {React.Dispatch<React.SetStateAction<boolean>>} props.setLogin - 
//  * Function to update the login state based on user authentication.
//  */

// import React, { useEffect, useState } from "react";
// import {
//   useUser,
//   SignInButton,
//   SignOutButton,
//   UserButton,
//   useClerk,
// } from "@clerk/clerk-react";
// import { addLoginCookie, removeLoginCookie } from "../../utils/cookie";

// export interface ILoginPageProps {
//   /** 
//    * Boolean representing whether the user is logged in. 
//    * Determines gated content accessibility in parent components.
//    */
//   loggedIn: boolean;
  
//   /** 
//    * Function to update the `loggedIn` state based on the user’s authentication status.
//    * Accepts a boolean to set login status within the parent component.
//    */
//   setLogin: React.Dispatch<React.SetStateAction<boolean>>;
// }

// const LoginLogout: React.FunctionComponent<ILoginPageProps> = (props) => {
//   const { isSignedIn, user } = useUser();
//   const clerk = useClerk();

//   useEffect(() => {
//     if (isSignedIn && user) {
//       // Since we no longer restrict by email domain, simply set the login status and add the cookie
//       addLoginCookie(user.id);
//       props.setLogin(true);
//     } else {
//       props.setLogin(false);
//       removeLoginCookie();
//     }
//   }, [isSignedIn, user, props]);

//   return (
//     <div className="login-logout">
//       <div className="App-header">
//         <h1 aria-label="Page Header">Maps</h1>
//         <div className="auth-controls">
//           {isSignedIn ? (
//             <>
//               <UserButton /> 
//               <SignOutButton>Sign Out</SignOutButton>
//             </>
//           ) : (
//             <SignInButton mode="modal">Sign In</SignInButton> 
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LoginLogout;
