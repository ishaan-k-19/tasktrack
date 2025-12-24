import React, { useState } from "react";
import useAsyncMutation from "../hooks/hooks";
import { useDeleteTaskMutation, useLoadUserQuery, useUpdateTaskMutation } from "../redux/api/api";

const Task = ({ title, description, status, taskId }) => {
  const [completed, setCompleted] = useState(status);
  const [updateTask] = useAsyncMutation(useUpdateTaskMutation); 
  const [deleteTask] = useAsyncMutation(useDeleteTaskMutation); 
  const { refetch } = useLoadUserQuery();

  const handleCheckbox = async () => {
    setCompleted(!completed);
    await updateTask("updating Task...",taskId);
    refetch(); 
  };

  const deleteHandler = async () => {
    await deleteTask("Deleting Task", taskId);
    refetch(); 
  };

  return (
    <div className="flex items-center justify-between p-3">
      <div className="w-3/4">
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-neutral-400">{description}</p>
      </div>
      <div className="flex items-center gap-5">
      <input
        type="checkbox"
        checked={completed}
        onChange={handleCheckbox}
        className="min-w-5 min-h-5 text-white bg-neutral-100 border-neutral-300 rounded focus:ring-blue-500 focus:ring-2"
        />
      <button
        className="bg-red-600 text-[#f4f7f9] p-2 rounded-full hover:bg-[#2d2522] flex items-center justify-center ml-4"
        onClick={deleteHandler}
        >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
    </div>
    </div>
  );
};

export default Task;