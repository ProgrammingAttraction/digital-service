import React, { useState } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Nidverify() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiView, setApiView] = useState(0);
  const [specialApiView, setSpecialApiView] = useState("বিশেষ");
  const [nid, setNid] = useState("4455015366");
  const [dob, setDob] = useState("(0-0)-2000");
  const [selectedObjectType, setSelectedObjectType] = useState("");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        {/* Page Title */}
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6">
          
  
        </div>
      </main>
    </div>
  );
}

export default Nidverify;