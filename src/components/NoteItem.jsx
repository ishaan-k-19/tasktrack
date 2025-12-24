import React, { useState, useRef, useEffect } from "react";
import useAsyncMutation from "../hooks/hooks";
import {
  useDeleteNoteMutation,
  useLoadNotesQuery,
  useUpdateNoteMutation,
} from "../redux/api/api";
import Canvas from "./Canvas";
import jsPDF from "jspdf";
import toast from "react-hot-toast";

const NoteItem = ({
  title,
  description,
  noteId,
  onClick,
  preview,
  onClose,
  canvasState
}) => {
  const [activeTab, setActiveTab] = useState("Type");
  const [deleteNote] = useAsyncMutation(useDeleteNoteMutation);
  const { refetch } = useLoadNotesQuery();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteData, setNoteData] = useState({ title, description, canvasState });
  const [updateNote] = useAsyncMutation(useUpdateNoteMutation);
  const canvasRef = useRef(null);
  const modalRef = useRef(null);

  const deleteHandler = async () => {
    await deleteNote("Deleting Note", noteId);
    refetch();
    handleClose();
  };



  const editHandler = () => {
    setIsModalOpen(true);
    setNoteData({ title, description, canvasState });
    if (description.startsWith("data:image")) {
      setActiveTab("Draw");
      if (canvasRef.current) {
        canvasRef.current.importCanvas(canvasState || []);
      }
    } else {
      setActiveTab("Type");
    }
  };


  const saveHandler = async () => {
    let updatedContent = noteData.description;
    let updatedCanvasState = noteData.canvasState;

    console.log(noteData)

    if (activeTab === "Draw" && canvasRef.current) {
      const canvasData = canvasRef.current.exportCanvas();
      if (canvasData) {
        updatedContent = canvasData.imageData; 
        updatedCanvasState = canvasData;
      } else {
        alert("Failed to save canvas data.");
        return;
      }
    }

    await updateNote("Updating Note...", {
      noteId,
      title: noteData.title,
      description: updatedContent,
      canvasState: updatedCanvasState,
    });

    setIsModalOpen(false);
    refetch();
    handleClose();
  };

  const handleClose = () => {
    onClose?.();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleOutsideClick = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      handleCancel();
    }
  };

  const handleEscapePress = (event) => {
    if (event.key === "Escape") {
      handleCancel();
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleEscapePress);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscapePress);
    };
  }, [isModalOpen]);

  const downloadHandler = async () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(title, 10, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    let yOffset = 30;

    if (description.startsWith("data:image")) {
      const imgData = description;
      const imgWidth = 180;
      const imgHeight = 280;
      doc.addImage(imgData, "JPEG", 10, yOffset, imgWidth, imgHeight);
      yOffset += imgHeight + 10;
    } else {
      const lines = doc.splitTextToSize(description, 180);
      doc.text(lines, 10, yOffset);
    }

    doc.save(`${title}.pdf`);
    handleClose();
  };

  return (
    <>
      <div
        className={`relative ${
          preview
            ? "w-full md:max-w-4xl p-8 bg-neutral-800 rounded-xl shadow-md max-w-[22rem]"
            : "w-[21rem] p-6 pt-6 pb-3 bg-neutral-800 rounded-xl shadow"
        } flex flex-col justify-between ${
          preview ? "h-screen md:max-h-[40rem] max-h-[20rem]" : "h-screen max-h-[13.5rem]"
        }`}
      >
        <div
          className={`${!preview && "cursor-pointer h-screen"}`}
          onClick={!preview ? onClick : undefined}
        >
          <div className="flex justify-between">
            <h5
              className={`${
                preview ? "text-4xl" : "text-2xl"
              } mb-4 font-bold tracking-tight text-slate-400`}
            >
              {title}
            </h5>
            <button
              type="button"
              onClick={handleClose}
              className={`text-neutral-100 hover:bg-neutral-200 hover:text-neutral-900 rounded-lg text-sm h-2 md:w-8 md:h-8 flex justify-center items-center ${
                preview ? "block" : "hidden"
              }`}
            >
              <svg
                className="w-3 h-3"
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
            </button>
          </div>
          {description.startsWith("data:image") ? (
            <div
              className={`rounded-md transparent-scrollbar ${
                preview
                  ? "w-full bg-[#f9fafc] mb-3 overflow-y-auto object-contain md:max-h-[60vh] max-h-[11rem]"
                  : "mb-3 bg-[#f9fafc] w-full max-h-[5rem]"
              }`}
              style={{
                overflowY: preview ? "auto" : "hidden",
              }}
            >
              <img
                src={description}
                alt={title}
                className="object-contain w-full h-auto"
              />
            </div>
          ) : (
            <p
              className={`${
                preview
                  ? "text-lg font-normal text-neutral-100 overflow-y-auto max-h-[30rem] transparent-scrollbar h-screen text-clip text-wrap break-all"
                  : "mb-3 font-normal text-neutral-100 overflow-hidden break-words max-h-[4.8rem]"
              }`}
            >
              {description}
            </p>
          )}
        </div>
        <div className="text-neutral-400 flex gap-1">
          <button
            className="hover:bg-neutral-600 px-1 py-1 rounded-full"
            onClick={editHandler}
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
              className="lucide lucide-pencil"
            >
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
              <path d="m15 5 4 4" />
            </svg>
          </button>
          <button
            className="hover:bg-neutral-600 px-1 py-1 rounded-full"
            onClick={downloadHandler}
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
              className="lucide lucide-download"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </button>
          <button
            className="hover:bg-neutral-600 px-1 py-1 rounded-full"
            onClick={() => {
              const formattedText = `${title.toUpperCase()}\n\n${description}`;
              navigator.clipboard
                .writeText(formattedText)
                .then(() => toast.success("Copied to clipboard!"))
                .catch(() => toast.error("Failed to copy. Please try again."));
            }}
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
              className="lucide lucide-copy"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>

          <button
            className="hover:bg-neutral-600 px-1 py-1 rounded-full"
            onClick={deleteHandler}
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
              className="lucide lucide-trash-2"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" x2="10" y1="11" y2="17" />
              <line x1="14" x2="14" y1="11" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`relative ${
              activeTab === "Draw" ? "w-full max-w-7xl" : "w-full max-w-lg"
            } bg-neutral-800 rounded-lg shadow-md p-6`}
            ref={modalRef}
          >
            <div className="flex items-center justify-between border-b border-neutral-400 pb-4">
              <h3 className="text-xl font-medium text-neutral-200">
                Edit Note
              </h3>
              <button
                type="button"
                onClick={handleCancel}
                className="text-neutral-200 hover:bg-neutral-200 hover:text-neutral-900 rounded-lg text-sm w-8 h-8 flex justify-center items-center"
              >
                <svg
                  className="w-3 h-3"
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
              </button>
            </div>

            <div className="mb-4 border-b border-neutral-400">
              <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                <li className="mr-2">
                  <button
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
                      activeTab === "Type"
                        ? "text-blue-400 border-blue-400"
                        : "text-neutral-200 hover:text-neutral-300 border-transparent hover:border-neutral-300"
                    }`}
                    onClick={() => setActiveTab("Type")}
                  >
                    Type
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    className={`md:inline-block p-4 border-b-2 rounded-t-lg hidden ${
                      activeTab === "Draw"
                        ? "text-blue-400 border-blue-400"
                        : "text-neutral-200 hover:text-neutral-300 border-transparent hover:border-neutral-300"
                    }`}
                    onClick={() => setActiveTab("Draw")}
                  >
                    Draw
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-4 mt-4">
              {activeTab === "Type" && (
                <>
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={noteData.title}
                      onChange={(e) =>
                        setNoteData({ ...noteData, title: e.target.value })
                      }
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg"
                      placeholder="Enter title"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={noteData.description}
                      onChange={(e) =>
                        setNoteData({
                          ...noteData,
                          description: e.target.value,
                        })
                      }
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg"
                      placeholder="Enter description"
                    />
                  </div>
                </>
              )}

              {activeTab === "Draw" && (
                <>
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-neutral-700"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={noteData.title}
                      onChange={(e) =>
                        setNoteData({ ...noteData, title: e.target.value })
                      }
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg"
                      placeholder="Enter title"
                    />
                  </div>
                  <div
                    style={{
                      maxHeight: "60vh",
                      overflowY: "hidden",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <Canvas
                      ref={canvasRef}
                      key={noteData.id || "new"}
                      initialState={canvasState.lines}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={saveHandler}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="text-neutral-700 bg-neutral-300 hover:bg-neutral-200 focus:ring-4 focus:outline-none focus:ring-neutral-300 font-medium rounded-lg text-sm px-5 py-2.5"
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

export default NoteItem;
