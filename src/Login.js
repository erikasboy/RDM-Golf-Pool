import React, { useState } from "react";
import { auth, googleProvider } from "./firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Logged in successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert("Logged in with Google successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-900 text-white">
      <div className="bg-green-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Golf Pool App</h1>
        <form onSubmit={handleEmailLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-4 rounded-lg text-black"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 rounded-lg text-black"
          />
          <button
            type="submit"
            className="bg-gold-500 text-green-900 px-4 py-2 rounded-lg w-full"
          >
            Login with Email
          </button>
        </form>
        <button
          onClick={handleGoogleLogin}
          className="bg-gold-500 text-green-900 px-4 py-2 rounded-lg w-full mt-4"
        >
          Login with Google
        </button>
      </div>
    </div>
  );
};

export default Login;