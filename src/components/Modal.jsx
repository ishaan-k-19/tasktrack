import React, { useState } from "react";

const Modal = ({ 
  modalTitle, 
  onConfirm, 
  openButtonName = "Add Task", 
  isLoading = false,
  feilds = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
}

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-12 py-4 focus:outline-none flex items-center gap-2 absolute bottom-4 right-[43%] shadow-md"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-plus"
        >
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
        {openButtonName}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="text-xl font-medium text-neutral-900">{modalTitle}</h3>
              <button
                type="button"
                onClick={handleClose}
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
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-neutral-700">Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 p-2 w-full border border-neutral-300 rounded-lg"
                  placeholder="Enter title"
                />
            </div>
            </div>


            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
              >
                {isLoading ? "Processing..." : openButtonName}
              </button>
              <button
                onClick={handleClose}
                className="py-2.5 px-5 text-sm font-medium text-neutral-900 focus:outline-none bg-white rounded-lg border border-neutral-200 hover:bg-neutral-100 hover:text-blue-700"
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

export default Modal;
