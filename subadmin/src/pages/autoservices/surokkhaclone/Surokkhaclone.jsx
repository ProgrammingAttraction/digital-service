import React, { useState } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Surokkhaclone() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        {/* Page Title Header */}
        <div className="mb-4">
          <h1 className="text-[#1abc9c] text-lg font-bold">সুরক্ষা ক্লোন</h1>
        </div>

        <div className="w-full bg-white p-6 border border-gray-200 shadow-sm rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Left Column: Beneficiary Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Beneficiary Information</h2>
              
              <InputField label="Certificate No :" placeholder="BD836970258988" />
              
              <div className="flex flex-col">
                <label className="text-[13px] font-semibold text-gray-700 mb-1">Choose any :</label>
                <div className="flex items-center gap-4 py-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="idType" defaultChecked className="accent-[#1abc9c]" /> NID No.
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="idType" className="accent-[#1abc9c]" /> Birth No.
                  </label>
                </div>
              </div>

              <InputField label="Name:" placeholder="Full Name" />
              <InputField label="National ID :" placeholder="N/A" />
              <InputField label="Birth No:" placeholder="N/A" />
              <InputField label="Passport No.:" placeholder="N/A" />
              <InputField label="Date of Birth:" placeholder="24-12-2025" />
              
              <div className="flex flex-col">
                <label className="text-[13px] font-semibold text-gray-700 mb-1">Gender:</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[13px] font-semibold text-gray-700 mb-1">Nationality:</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white">
                  <option>Bangladeshi</option>
                </select>
              </div>

              <InputField label="vaccination By :" placeholder="Directorate General of Health Services (DGHS)" />
            </div>

            {/* Right Column: Vaccination Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Vaccination Details</h2>
              
              <InputField label="Date of vaccination (Dose 1):" placeholder="12-06-2022" />
              
              <div className="flex flex-col">
                <label className="text-[13px] font-semibold text-gray-700 mb-1">Name of vaccine:</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white">
                  <option>Pfizer (Pfizer-BioNTech)</option>
                  <option>AstraZeneca</option>
                  <option>Sinopharm</option>
                </select>
              </div>

              <InputField label="Other vaccine Name:" placeholder="" />
              
              <InputField label="Date of vaccination (Dose 2):" placeholder="12-07-2022" />
              
              <div className="flex flex-col">
                <label className="text-[13px] font-semibold text-gray-700 mb-1">Name of vaccine:</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white">
                  <option>Pfizer (Pfizer-BioNTech)</option>
                </select>
              </div>

              <InputField label="Other vaccine Name:" placeholder="" />
              
              <InputField label="Date of vaccination (Dose 3):" placeholder="11-08-2022" />
              
              <div className="flex flex-col">
                <label className="text-[13px] font-semibold text-gray-700 mb-1">Name of vaccine:</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white">
                  <option>Pfizer</option>
                </select>
              </div>

              <InputField label="Other vaccine Name:" placeholder="" />

              <div className="flex flex-col">
                <label className="text-[13px] font-semibold text-gray-700 mb-1">vaccination Center:</label>
                <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white">
                  <option>Dhaka Medical College Hospital</option>
                </select>
              </div>

              <InputField label="Other vaccination Center :" placeholder="" />
              <InputField label="Total Dose Given :" placeholder="Total Dose Given" />
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-10">
            <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-3 rounded-md transition-all shadow-sm">
              Save & Download
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputField({ label, placeholder }) {
  return (
    <div className="flex flex-col">
      <label className="text-[13px] font-semibold text-gray-700 mb-1">{label}</label>
      <input 
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-300 bg-white"
        placeholder={placeholder}
      />
    </div>
  );
}

export default Surokkhaclone;