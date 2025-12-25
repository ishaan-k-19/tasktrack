import React, { useState, useRef } from "react";
import NoteItem from "../components/NoteItem";
import { useAddNoteMutation, useLoadNotesQuery } from "../redux/api/api";
import useAsyncMutation from "../hooks/hooks";
import Canvas from "../components/Canvas";
import toast from "react-hot-toast";

const Notes = () => {
  const [activeTab, setActiveTab] = useState("Type");
  const { refetch, isLoading, data } = useLoadNotesQuery();
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addNote, loading, noteData] = useAsyncMutation(useAddNoteMutation);
  const canvasRef = useRef();
  const [selectedNote, setSelectedNote] = useState(null);

  const handleAddNote = async () => {
    let finalDescription = description;
    let canvasState = null;

    if (activeTab === "Draw" && canvasRef.current) {
      const canvasData = canvasRef.current.exportCanvas();
      if (canvasData) {
        canvasState = canvasData;
        finalDescription = canvasData.imageData;
      } else {
        alert("Failed to retrieve canvas data.");
        return;
      }
    }

    if (!title || (!finalDescription && !canvasState)) {
      alert("Please fill out all fields.");
      return;
    }

    await addNote("Adding Note...", {
      title,
      description: finalDescription,
      canvasState,
    });

    setIsModalOpen(false);
    if (noteData.success) {
      setTitle("");
      setDescription("");
      refetch();
    } else {
      alert(noteData.message || "Failed to add note.");
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setIsModalOpen(false);
  };

  const handleNoteClick = (note) => {
    setSelectedNote(note);
  };

  const handleClosePreview = () => {
    setSelectedNote(null);
  };



  return (
    <>
      {isLoading ? (
        <div className="text-center text-xl">Loading...</div>
      ) : (
        <div className=" flex flex-col items-center">
          <h1 className="text-center text-3xl md:text-5xl mt-5 font-semibold text-neutral-800">
            My Notes
          </h1>
          {data?.notes?.length === 0 && (
            <p className="mt-20 text-center text-3xl text-neutral-500">
              No Notes Yet
            </p>
          )}
          <div className="px-10 flex-col md:flex-row flex gap-6 my-8 flex-wrap overflow-y-auto pb-16 md:self-start ">
            {data &&
              data.notes.map((note) => (
                <NoteItem
                  key={note._id}
                  title={note.title}
                  description={note.content}
                  noteId={note._id}
                  onClick={() => handleNoteClick(note)}
                  canvasState={note.canvasState}
                />
              ))}
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-12 py-4 focus:outline-none flex items-center gap-2 fixed bottom-4 shadow-md"
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
            Add Note
          </button>
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div
            className={`relative ${
              activeTab === "Draw" ? "w-full max-w-7xl" : "w-full max-w-lg"
            } bg-neutral-800 rounded-lg shadow-md p-6 text-neutral-100`}
          >
            <div className="flex items-center justify-between border-b border-neutral-400 pb-4">
              <h3 className="text-xl font-medium text-neutral-100">
                Add New Note
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
                <span className="sr-only">Close modal</span>
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
                    className={`inline-block p-4 border-b-2 rounded-t-lg ${
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
                      className="block text-sm font-medium text-neutral-200"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg text-neutral-800"
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
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg text-neutral-800"
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
                      className="block text-sm font-medium text-neutral-800"
                    >
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-2 p-2 w-full border border-neutral-300 rounded-lg text-neutral-800"
                      placeholder="Enter title"
                    />
                  </div>
                  <div
                    style={{
                      maxHeight: "70vh",
                      overflowY: "auto",
                      overflowX: "auto",
                      WebkitOverflowScrolling: "touch",
                      border: "1px solid #e5e7eb",
                      backgroundColor: "#f9fafb",
                      borderRadius: "8px",
                    }}
                  >
                    <Canvas ref={canvasRef} />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={handleAddNote}
                disabled={!title || loading}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 disabled:bg-blue-400"
              >
                {loading ? "Adding..." : "Add Note"}
              </button>
              <button
                onClick={handleCancel}
                className="py-2.5 px-5 text-sm font-medium text-neutral-900 focus:outline-none bg-neutral-300 rounded-lg border border-neutral-200 hover:bg-neutral-100 hover:text-blue-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <NoteItem
            title={selectedNote.title}
            description={selectedNote.content}
            noteId={selectedNote._id}
            preview={true}
            onClose={handleClosePreview}
            canvasState={selectedNote.canvasState}
          />
        </div>
      )}
    </>
  );
};

export default Notes;
