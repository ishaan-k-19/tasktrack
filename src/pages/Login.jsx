import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { userExists } from "../redux/auth";
import { useForgotPasswordMutation, useResetPasswordMutation } from "../redux/api/api";
import useAsyncMutation from "../hooks/hooks";
import { server } from "../constants/config";
import axios from "axios";


const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const [forgotPassword, forgotPasswordLoading, forgotPasswordData ] = useAsyncMutation(useForgotPasswordMutation);
  const [resetPassword, resetLoading, resetData] = useAsyncMutation(useResetPasswordMutation);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true); 

    try {
        const response = await axios.post(
            `${server}/api/v1/login`, 
            { email, password },
            { withCredentials: true } 
        );



        if (response.data.success) {
            dispatch(userExists(response.data.user)); 
            navigate('/'); 
            toast.success("Login successful");
        } else {
            toast.error(response.data.message);
        }
    } catch (error) {
        toast.error("Invalid Email or Password");
        console.error(error); 
    } finally {
        setIsLoading(false); 
    }
};
const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
};

  return (
    <div className="flex justify-center items-center">
      <div className="w-full max-w-sm p-4 bg-neutral-800  rounded-lg shadow sm:p-6 md:p-8 mt-28">
        <form className="space-y-6" onSubmit={handleLogin}>
          <h5 className="text-2xl font-medium text-neutral-100">Sign in to TaskTrack</h5>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-neutral-100">
              Your email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-50 border border-neutral-300 text-neutral-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-neutral-100">
              Your password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-neutral-50 border border-neutral-300 text-neutral-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-sm text-neutral-600 hover:text-neutral-800 focus:outline-none"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="text-sm text-slate-400 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <button
            type="submit"
            className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login to your account"}
          </button>
          <div className="text-sm font-medium text-neutral-100">
            Not registered?{" "}
            <Link to="/register" className="text-slate-400 hover:underline">
              Create account
            </Link>
          </div>
        </form>
      </div>

      {isResetModalOpen && (
        <ResetPasswordModal
          closeModal={() => setIsResetModalOpen(false)}
          forgotPassword={forgotPassword}
          resetPassword={resetPassword}
          forgotPasswordData={forgotPasswordData}
          forgotPasswordLoading={forgotPasswordLoading}
          resetLoading={resetLoading}
          resetData={resetData}
        />
      )}
    </div>
  );
};

const ResetPasswordModal = ({
  closeModal,
  forgotPassword,
  resetPassword,
  forgotPasswordData,
  forgotPasswordLoading,
  resetLoading,
  resetData,
}) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    await forgotPassword("Sending Email...", email);
    setStep(2);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!otp) {
      toast.error("OTP is required.");
      return;
    }

    setIsLoading(true);

    await resetPassword("Resetting Password", { email, newPassword, otp });
    if (resetData) {
      closeModal();
    }
    setIsLoading(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-neutral-800">
          {step === 1 ? "Reset Password" : "Set New Password"}
        </h2>
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700"
              >
                Registered Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 p-2 border border-gray rounded-lg w-full"
                placeholder="Enter your registered email"
              />
            </div>
            <button
              type="submit"
              className="w-full text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2"
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? "Verifying..." : "Submit"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-neutral-700"
              >
                OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="mt-1 p-2 border border-neutral-300 rounded-lg w-full"
                placeholder="Enter OTP"
                maxLength={6}
              />
            </div>
            <div className="relative">
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-neutral-700"
              >
                New Password
              </label>
              <input
                type={showPasswords.newPassword ? "text" : "password"}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="mt-1 p-2 border border-neutral-300 rounded-lg w-full"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("newPassword")}
                className="absolute inset-y-0 right-0 flex top-5 items-center px-3 text-sm text-neutral-600 hover:text-neutral-800 focus:outline-none"
              >
                {showPasswords.newPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="relative">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-neutral-700"
              >
                Confirm Password
              </label>
              <input
                type={showPasswords.confirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 p-2 border border-neutral-300 rounded-lg w-full"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirmPassword")}
                className="absolute inset-y-0 right-0 top-5 flex items-center px-3 text-sm text-neutral-600 hover:text-neutral-800 focus:outline-none"
              >
                {showPasswords.confirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            <button
              type="submit"
              className="w-full text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2"
              disabled={resetLoading}
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={closeModal}
          className="mt-4 text-red-500 hover:text-neutral-700 text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Login;