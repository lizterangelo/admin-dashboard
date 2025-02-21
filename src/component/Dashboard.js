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

  // Fetch redeem codes from Firestore
  useEffect(() => {
    firestore
      .collection("redeemCodes")
      .get()
      .then((snapshot) => {
        const fetchedCodes = [];
        snapshot.forEach((doc) => {
          fetchedCodes.push({
            id: doc.id,
            isUsed: doc.data().isUsed,
          });
        });
        setCodes(fetchedCodes);
        setCodesLoaded(true);
      })
      .catch((error) => {
        alert(error);
      });
  }, []);

  // Simple function to generate a redeem code
  const generateRedeemCode = async () => {
    try {
      const docRef = await firestore.collection("redeemCodes").add({
        isUsed: false,
      });
      alert("Redeem code generated with ID: " + docRef.id);
      // Optionally, add the new code to the table without reloading:
      setCodes((prevCodes) => [...prevCodes, { id: docRef.id, isUsed: false }]);
    } catch (error) {
      alert("Error generating redeem code: " + error.message);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 box-border w-full">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8 pb-20">
          <h2 className="px-2 pb-6 pt-10 text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl text-center">
            Dashboard <span className="text-indigo-600">Admin</span>
          </h2>
          <div className="flex justify-between my-2">
            <h2 className="text-gray-500">
              <span className="font-medium text-gray-900">User: </span>
              {currentUser.email} {currentUser.name}
            </h2>
            <button
              onClick={() => auth.signOut()}
              className="bg-red-200 hover:bg-red-300 font-bold py-1 px-2 text-red-600 rounded"
            >
              Logout
            </button>
          </div>
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200" ref={tableRef}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redeem Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used
                  </th>
                </tr>
              </thead>
              {codesLoaded ? (
                <tbody className="bg-white divide-y divide-gray-200">
                  {codes.map((code, index) => (
                    <tr key={code.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {code.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {code.isUsed.toString()}
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
          {/* Simple Redeem Code Generate Button */}
          <button
            onClick={generateRedeemCode}
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded"
          >
            Generate Redeem Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
