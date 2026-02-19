import React, { useState } from 'react';
import Home from './home/Home';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="font-anek ">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
      <main className='min-h-[93vh] bg-gray-100'>
        <Home />
      </main>
    </div>
  );
}

export default Dashboard;