import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { userExists, userNotExists } from "../redux/auth";
import { server } from "../constants/config";
import { useLoadUserQuery, useUpdatePasswordMutation } from "../redux/api/api";
import useAsyncMutation from "../hooks/hooks";

const ProfileDropdown = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    name: "",
    avatar: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const {refetch} = useLoadUserQuery();

  const dropdownRef = useRef();

  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  const openModal = (type) => {
    setModalType(type);
    setFormData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      name: user?.name || "",
      avatar: user?.avatar?.url || "",
    });
    setIsModalOpen(true);
  };

  const [updatePassword] = useAsyncMutation(useUpdatePasswordMutation);

  const closeModal = () => setIsModalOpen(false);

  const handleLogout = async () => {
    const toastId = toast.loading("Logging Out...");
    try {
      const { data } = await axios.get(`${server}/api/v1/logout`, {
        withCredentials: true,
      });
      dispatch(userNotExists());
      toast.success(data.message, { id: toastId });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong", {
        id: toastId,
      });
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleFormSubmit = async () => {
    if (modalType === "changePassword") {
      if( formData.newPassword !== formData.confirmPassword ) {
        toast.error("New Password and Confirm Password did not match")
        return;
      }
      updatePassword("Updating Password...", formData)
      closeModal();
    } else if (modalType === "editProfile") {
      const toastId = toast.loading("Updating Profile...");
      setIsLoading(true);

      const config = {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      try {
        const response = await axios.put(
          `${server}/api/v1/updateprofile`,
          formData,
          config
        );

        toast.success(response.data.message, { id: toastId });
        closeModal();

      } catch (error) {
        toast.error(error?.response?.data?.message || "Something went wrong", {
          id: toastId,
        });
      } finally {
        setIsLoading(false);
      }
    }
    refetch();
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <div className="relative text-neutral-50 bg-neutral-800" ref={dropdownRef}>
        <button
          id="dropdownAvatarNameButton"
          onClick={toggleDropdown}
          className="flex items-center text-base font-medium text-white rounded-full hover:text-neutral-100"
          type="button"
        >
          <img
            className="w-8 h-8 me-2 rounded-full"
            src={user?.avatar?.url}
            alt="user avatar"
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 mt-2 bg-neutral-100 divide-y divide-neutral-300 rounded-lg w-[22rem] right-0 shadow-md">
            <div className="px-4 py-3 text-sm text-neutral-900 flex flex-col items-center">
              <img
                className="w-28 h-28 rounded-full shadow-md mb-5"
                src={user?.avatar?.url}
                alt="User avatar"
              />
              <div className="font-medium text-lg">{user?.name}</div>
              <div className="truncate text-neutral-500">{user?.email}</div>
            </div>
            <ul className="py-2 text-sm text-neutral-700">
              <li>
                <button
                  onClick={() => openModal("editProfile")}
                  className="block w-full text-left px-4 py-2 hover:bg-neutral-800 hover:text-neutral-100 rounded-md"
                >
                  Edit Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => openModal("changePassword")}
                  className="block w-full text-left px-4 py-2 hover:bg-neutral-800 hover:text-neutral-100 rounded-md"
                >
                  Change Password
                </button>
              </li>
            </ul>
            <div className="py-2">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-800 hover:text-neutral-100 rounded-md"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-medium text-neutral-900">
                {modalType === "editProfile"
                  ? "Edit Profile"
                  : "Change Password"}
              </h3>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:bg-neutral-200 hover:text-neutral-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
              >
                <svg
                  className="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            <div className="space-y-4 mt-4">
              {modalType === "editProfile" ? (
                <>
                  <div className="relative flex justify-center mb-4">
                    <img
                      className="w-32 h-32 rounded-full shadow-md"
                      src={
                        formData.avatar instanceof File
                          ? URL.createObjectURL(formData.avatar)
                          : formData.avatar
                      }
                      alt="Current Avatar"
                    />

                    <label
                      htmlFor="avatar"
                      className="absolute inset-0 w-32 h-32 rounded-full bg-neutral-800 opacity-0 hover:opacity-40 flex items-center justify-center cursor-pointer transition-opacity left-[36%]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="30"
                        height="30"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-pencil text-white"
                      >
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                        <path d="m15 5 4 4" />
                      </svg>
                    </label>

                    <input
                      type="file"
                      id="avatar"
                      name="avatar"
                      accept="image/*"
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          avatar: e.target.files[0],
                        }))
                      }
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg text-neutral-700"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={user?.email}
                      disabled
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg bg-neutral-100 disabled:text-neutral-400"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <label
                      htmlFor="oldPassword"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Old Password
                    </label>
                    <input
                      type={showPasswords.oldPassword ? "text" : "password"}
                      id="oldPassword"
                      name="oldPassword"
                      value={formData.oldPassword}
                      onChange={handleInputChange}
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg text-neutral-800"
                    />
                    <button
                type="button"
                onClick={() => togglePasswordVisibility("oldPassword")}
                className="absolute inset-y-0 right-0 top-5 flex items-center px-3 text-sm text-neutral-600 hover:text-neutral-800 focus:outline-none"
              >
                {showPasswords.oldPassword ? "Hide" : "Show"}
              </button>
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
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg text-neutral-800"
                    />
                    <button
                type="button"
                onClick={() => togglePasswordVisibility("newPassword")}
                className="absolute inset-y-0 right-0 top-5 flex items-center px-3 text-sm text-neutral-600 hover:text-neutral-800 focus:outline-none"
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
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg text-neutral-800"
                    />
                    <button
                type="button"
                onClick={() => togglePasswordVisibility("confirmPassword")}
                className="absolute inset-y-0 right-0 top-5 flex items-center px-3 text-sm text-neutral-600 hover:text-neutral-800 focus:outline-none"
              >
                {showPasswords.confirmPassword ? "Hide" : "Show"}
              </button>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={handleFormSubmit}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Save
              </button>
              <button
                onClick={closeModal}
                className="text-red-600 bg-white hover:bg-neutral-100 border border-neutral-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileDropdown;
