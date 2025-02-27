import { useEffect, useRef, useState, Fragment, useContext } from "react";
import "../style/buttonplus.css";
import { Dialog, Transition } from "@headlessui/react";
import { auth, firestore } from "../config/firebase/firebase-app";
import { UserContext } from "../provider/UserProvider";

function Dashboard() {
  const { currentUser } = useContext(UserContext);
  const [codes, setCodes] = useState([]);
  const [codesLoaded, setCodesLoaded] = useState(false);
  const tableRef = useRef(null);

  // Modal state for generating codes
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [numToGenerate, setNumToGenerate] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal state for delete all codes
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Sorting state
  const [sortColumn, setSortColumn] = useState(null); // "code", "date", or "used"
  const [sortDirection, setSortDirection] = useState("desc"); // "desc" or "asc"

  // Function to fetch redeem codes from Firestore (including the createdAt field)
  const refreshRedeemCodes = () => {
    firestore
      .collection("redeemCodes")
      .orderBy("createdAt", "desc") // initially sorted by newest
      .get()
      .then((snapshot) => {
        const fetchedCodes = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          fetchedCodes.push({
            id: doc.id,
            isUsed: data.isUsed,
            createdAt: data.createdAt ? data.createdAt.toDate() : null,
          });
        });
        setCodes(fetchedCodes);
        setCodesLoaded(true);
      })
      .catch((error) => {
        alert(error);
      });
  };

  // Fetch redeem codes from Firestore on mount
  useEffect(() => {
    refreshRedeemCodes();
  }, []);

  // Toggle 'isUsed' status
  const toggleIsUsed = async (codeId, currentStatus) => {
    try {
      await firestore.collection("redeemCodes").doc(codeId).update({
        isUsed: !currentStatus,
      });
      setCodes((prevCodes) =>
        prevCodes.map((code) =>
          code.id === codeId ? { ...code, isUsed: !currentStatus } : code
        )
      );
    } catch (error) {
      alert("Error updating code status: " + error.message);
    }
  };

  // Delete a redeem code
  const deleteRedeemCode = async (codeId) => {
    try {
      await firestore.collection("redeemCodes").doc(codeId).delete();
      setCodes((prevCodes) => prevCodes.filter((code) => code.id !== codeId));
    } catch (error) {
      alert("Error deleting code: " + error.message);
    }
  };

  // Delete all redeem codes
  const handleDeleteAllConfirm = async () => {
    if (isDeleting) return; // Prevent multiple clicks
    if (deleteConfirmationText !== "CONFIRM") {
      alert("Please type 'CONFIRM' to proceed.");
      return;
    }
    setIsDeleting(true);
    try {
      const batch = firestore.batch();
      codes.forEach((code) => {
        const codeRef = firestore.collection("redeemCodes").doc(code.id);
        batch.delete(codeRef);
      });
      await batch.commit();
      setCodes([]);
      alert("All codes deleted successfully.");
      setIsDeleteAllModalOpen(false);
    } catch (error) {
      alert("Error deleting all codes: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Generate redeem codes based on user input
  const handleGenerateConfirm = async () => {
    if (isGenerating) return; // Prevent multiple clicks
    setIsGenerating(true);
    try {
      const newCodes = [];
      for (let i = 0; i < numToGenerate; i++) {
        const docRef = await firestore.collection("redeemCodes").add({
          isUsed: false,
          createdAt: new Date(), // Added timestamp
        });
        newCodes.push({ id: docRef.id, isUsed: false, createdAt: new Date() });
      }
      alert(`${numToGenerate} codes generated successfully.`);
      setCodes((prevCodes) => [...prevCodes, ...newCodes]);
      setIsGenerateModalOpen(false);
      setNumToGenerate(1);
    } catch (error) {
      alert("Error generating codes: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle sorting by toggling sort direction or setting a new column to sort by
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc");
    } else {
      setSortColumn(column);
      setSortDirection("desc"); // default to descending when switching columns
    }
  };

  // Create a sorted copy of codes based on the current sortColumn and sortDirection
  const sortedCodes = [...codes].sort((a, b) => {
    if (sortColumn === "date") {
      // Both dates must exist to compare; default to 0 otherwise
      if (a.createdAt && b.createdAt) {
        return sortDirection === "asc"
          ? a.createdAt - b.createdAt
          : b.createdAt - a.createdAt;
      }
      return 0;
    }
    if (sortColumn === "code") {
      return sortDirection === "asc"
        ? a.id.localeCompare(b.id)
        : b.id.localeCompare(a.id);
    }
    if (sortColumn === "used") {
      // Convert booleans to numbers (false=0, true=1)
      return sortDirection === "asc"
        ? Number(a.isUsed) - Number(b.isUsed)
        : Number(b.isUsed) - Number(a.isUsed);
    }
    return 0; // if no sort column is selected, keep original order
  });

  return (
    <div className="flex justify-center">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 box-border w-full">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8 pb-20">
          <h2 className="px-2 pb-6 pt-10 text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl text-center">
            Folderly Redeem Code Admin
          </h2>
          <div className="flex justify-between my-2">
            <h2 className="text-gray-500">
              <span className="font-medium text-gray-900">User: </span>
              {currentUser.email} {currentUser.name}
            </h2>
            <div>
              <button
                onClick={() => auth.signOut()}
                className="bg-red-200 hover:bg-red-300 font-bold py-1 px-2 text-red-600 rounded"
              >
                Logout
              </button>
              <button
                onClick={refreshRedeemCodes}
                className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded"
              >
                Refresh Redeem Codes
              </button>
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="ml-4 bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded"
              >
                Delete All Codes
              </button>
            </div>
          </div>
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table
              className="min-w-full divide-y divide-gray-200"
              ref={tableRef}
            >
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redeem Code{" "}
                    <button
                      onClick={() => handleSort("code")}
                      className="text-sm ml-1 text-blue-600 hover:text-blue-900"
                    >
                      {sortColumn === "code"
                        ? sortDirection === "desc"
                          ? "↓"
                          : "↑"
                        : "↕"}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Added{" "}
                    <button
                      onClick={() => handleSort("date")}
                      className="text-sm ml-1 text-blue-600 hover:text-blue-900"
                    >
                      {sortColumn === "date"
                        ? sortDirection === "desc"
                          ? "↓"
                          : "↑"
                        : "↕"}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used{" "}
                    <button
                      onClick={() => handleSort("used")}
                      className="text-sm ml-1 text-blue-600 hover:text-blue-900"
                    >
                      {sortColumn === "used"
                        ? sortDirection === "desc"
                          ? "↓"
                          : "↑"
                        : "↕"}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              {codesLoaded ? (
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedCodes.map((code, index) => (
                    <tr key={code.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {code.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {code.createdAt
                          ? code.createdAt.toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.isUsed.toString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleIsUsed(code.id, code.isUsed)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          {code.isUsed ? "Mark as Unused" : "Mark as Used"}
                        </button>
                        <button
                          onClick={() => deleteRedeemCode(code.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4">Loading...</td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* Floating Generate Button at bottom right */}
      <button
        onClick={() => setIsGenerateModalOpen(true)}
        className="fixed bottom-4 right-4 px-4 py-2 bg-green-500 text-white rounded shadow"
      >
        Generate Redeem Codes
      </button>

      {/* Modal for generating codes */}
      <Transition appear show={isGenerateModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsGenerateModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Generate Redeem Codes
                </Dialog.Title>
                <div className="mt-2">
                  <input
                    type="number"
                    min="1"
                    value={numToGenerate}
                    onChange={(e) =>
                      setNumToGenerate(parseInt(e.target.value))
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Enter the number of codes to generate.
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateConfirm}
                    disabled={isGenerating}
                    className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${
                      isGenerating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      {/* Modal for deleting all codes */}
      <Transition appear show={isDeleteAllModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => setIsDeleteAllModalOpen(false)}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            </Transition.Child>
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  Delete All Redeem Codes
                </Dialog.Title>
                <div className="mt-2">
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) =>
                      setDeleteConfirmationText(e.target.value)
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Type <strong>CONFIRM</strong> to proceed with deleting all codes.
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setIsDeleteAllModalOpen(false)}
                    className="mr-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAllConfirm}
                    disabled={isDeleting}
                    className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${
                      isDeleting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isDeleting ? "Deleting..." : "Delete All"}
                  </button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

export default Dashboard;
