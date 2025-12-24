import React, { useState } from 'react';
import useAsyncMutation from '../../hooks/hooks';
import { useVerifyMutation } from '../../redux/api/api';

const VerifyAccountModal = ({ isModalOpen }) => {
  const [otp, setOtp] = useState('');
  const [verify,  isLoading ] = useAsyncMutation(useVerifyMutation);

  const handleVerify = async () => {
    if (otp) {
        await verify("Verifying you Account...", otp );
    }
  };

  return (
    isModalOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-xl font-medium text-neutral-900">Verify Your Account</h3>
          </div>

          <div className="space-y-4 mt-4">
            <p className="text-sm text-neutral-600">Check your email for an OTP to verify your account.</p>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-neutral-700">
                Enter OTP
              </label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-2 p-2 w-full border border-neutral-300 rounded-lg"
                placeholder="Enter your OTP"
                maxLength={6}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={handleVerify}
              disabled={!otp || isLoading}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-blue-400"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default VerifyAccountModal;
