import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Task from "../components/Task";
import { useAddTaskMutation, useLoadUserQuery } from "../redux/api/api";
import toast from "react-hot-toast";
import useAsyncMutation from "../hooks/hooks";
import VerifyAccountModal from "../components/dialog/VerifyAccountModal";

const Home = () => {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false); 
  const [addTask, isLoading] = useAsyncMutation(useAddTaskMutation);
  const { user } = useSelector((state) => state.auth);
  const { refetch } = useLoadUserQuery();

  useEffect(() => {
    if (user?.verified) {
      setIsModalOpen(false);
      refetch();
    }
  }, [user?.verified, refetch]);

  const handleAddTask = async () => {
    if (!title || !description) {
      toast.error("Please fill out all fields.");
      return;
    }

    try {
      await addTask("Adding Task...", { title, description });
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      refetch();
    } catch (error) {
      toast.error("Failed to add task.");
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setIsModalOpen(false);
  };


  const filteredTasks = user?.tasks.filter(
    (task) => showCompleted || !task.completed
  );

  return (
    <>
      {!user?.verified ? (
        <VerifyAccountModal isModalOpen={!user?.verified} refetch={refetch} />
      ) : (
        <>
          <div className="flex justify-center md:px-20 px-2">
            <div className="flex flex-col items-center max-w-5xl bg-neutral-800 mt-5 md:mt-10 py-2 text-white w-full rounded-lg h-[calc(100vh-10rem)] shadow-lg">

              <h1 className="text-2xl md:text-3xl my-5 font-medium">ToDo's</h1>

              <div className="self-end px-10 mb-4">
                <label className="flex items-center space-x-2 text-white">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={() => setShowCompleted(!showCompleted)}
                    className="form-checkbox w-3 h-3 "
                    />
                  <span>Show Completed Tasks</span>
                </label>
              </div>

              <div className="flex flex-col self-start px-3 md:px-10 w-full overflow-y-scroll transparent-scrollbar pb-20">
                {filteredTasks?.length === 0 && <p className="text-center text-2xl mt-20 text-neutral-400">No Tasks Yet</p>}
                {filteredTasks?.map((item) => (
                  <Task
                    key={item._id}
                    title={item.title}
                    description={item.description}
                    status={item.completed}
                    taskId={item._id}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-12 py-4 focus:outline-none flex items-center gap-2 absolute bottom-4 shadow-md"
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
              Add Task
            </button>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="relative w-full max-w-lg bg-neutral-800 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between border-b pb-4 border-neutral-500">
                  <h3 className="text-xl font-medium text-neutral-200">
                    Add New Task
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-neutral-400 hover:bg-neutral-200 hover:text-neutral-800 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
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
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-neutral-200"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg"
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-neutral-100"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg"
                      placeholder="Enter description"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={handleAddTask}
                    disabled={!title || !description || isLoading}
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-blue-400"
                  >
                    {isLoading ? "Adding..." : "Add Task"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="py-2.5 px-5 text-sm font-medium text-neutral-800 focus:outline-none bg-neutral-300 rounded-lg border border-neutral-200 hover:bg-neutral-100 hover:text-blue-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Home;
