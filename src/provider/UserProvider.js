import React, { useEffect, useState, createContext } from "react";
import { auth } from "../config/firebase/firebase-app";

export const UserContext = createContext();
export const UserProvider = (props) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [pending, setPending] = useState(true);
  console.log(props.children);
  useEffect(() => {
    auth.onAuthStateChanged((currentUser) => {
      setCurrentUser(currentUser);
      setPending(false);
      console.log(currentUser);
    });
  }, []);
  if (pending) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <h1 className="animate-pulse font-mono text-indigo-900 text-xl">
          Loading...
        </h1>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ currentUser }}>
      {props.children}
    </UserContext.Provider>
  );
};
