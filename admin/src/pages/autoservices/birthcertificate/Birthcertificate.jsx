import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Birthcertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Background: Light Gray */}
      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        
        {/* Page Header Title */}
        <div className="text-center mb-8">
          <h1 className="text-[#00a65a] text-3xl font-extrabold mb-1">জন্ম নিবন্ধন অটো মেকার</h1>
          <p className="text-gray-500 font-medium text-sm">শুধু জন্ম নিবন্ধন নাম্বার দিয়ে জন্ম নিবন্ধন বের করুন</p>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* 1. Auto Load Section (White Card) */}
          <div className="mb-8 shadow-sm">
            <div className="bg-[#1abc9c] rounded-t-lg py-2.5 px-4">
               <h2 className="text-white text-center font-bold text-lg">জন্ম নিবন্ধন তথ্য</h2>
            </div>
            <div className="bg-white p-6 border border-gray-200 border-t-0 rounded-b-lg">
              <label className="text-xs font-bold text-gray-700 block mb-1">জন্ম নিবন্ধন নাম্বার</label>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-4 h-4 bg-[#1abc9c] rounded-sm"></div>
                  </div>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md py-2.5 pl-10 pr-3 focus:outline-none focus:ring-1 focus:ring-[#1abc9c] text-sm bg-white"
                    placeholder="01234567890123456"
                  />
                </div>
                <p className="text-[#00a65a] text-[11px] font-bold">আপনার ১৭ ডিজিটের জন্ম নিবন্ধন নাম্বার লিখুন</p>
                <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-3 rounded-full transition-all text-sm uppercase shadow-md">
                  অটো লোড
                </button>
              </div>
            </div>
          </div>

          {/* 2. Main Form Details (White Card) */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              
              {/* Left Column */}
              <div className="space-y-4">
                <InputField label="Register Office Address" placeholder="রেজিস্টার অফিসের ঠিকানা" required />
                <InputField label="Birth Registration Number" placeholder="XXXXXXXXXXXXXXXXX" required />
                <InputField label="Date of Registration" placeholder="DD/MM/YYYY" required />
                <InputField label="Date of Birth" placeholder="DD/MM/YYYY" required />
                
                <div className="flex flex-col">
                  <label className="text-[13px] font-bold text-gray-700 mb-1">Left Bar Code <span className="text-red-500">*</span></label>
                  <div className="flex gap-1">
                    <input className="flex-1 border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white" placeholder="XXXXX" />
                    <button className="bg-white border border-[#1abc9c] p-2 rounded text-[#1abc9c] hover:bg-teal-50 transition-colors">
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>

                <InputField label="নাম" placeholder="সম্পূর্ণ নাম বাংলায়" required />
                <InputField label="পিতার নাম" placeholder="পিতার নাম বাংলায়" required />
                <InputField label="পিতার জাতীয়তা" placeholder="পিতার জাতীয়তা বাংলায়" required />
                <InputField label="মাতার নাম" placeholder="মাতার নাম বাংলায়" required />
                <InputField label="মাতার জাতীয়তা" placeholder="মাতার জাতীয়তা বাংলায়" required />
                <InputField label="জন্মস্থান" placeholder="জন্মস্থান বাংলায়" required />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <InputField label="Upazila/Pourashava/City Corporation, Zila" placeholder="উপজেলা/পৌরসভা/সিটি কর্পোরেশন, জেলা" required />
                
                <div className="flex flex-col">
                  <label className="text-[13px] font-bold text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                  <select className="border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white">
                    <option>Select</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>

                <InputField label="Date of Issuance" placeholder="DD/MM/YYYY" required />
                <InputField label="Date of Birth in Word (Optional)" placeholder="Eleventh August two thousand three" />
                <InputField label="QR Link" placeholder="https://bdris.gov.bd/certificate/verify?key=..." required />
                <InputField label="Name" placeholder="Full Name in English" required />
                <InputField label="Father Name" placeholder="Father Name in English" required />
                <InputField label="Father Nationality" placeholder="Father Nationality in English" required />
                <InputField label="Mother Name" placeholder="Mother Name in English" required />
                <InputField label="Mother Nationality" placeholder="Mother Nationality in English" required />
                <InputField label="Place of Birth" placeholder="Place of Birth in English" required />
              </div>
            </div>

            {/* Address Textareas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div className="flex flex-col">
                <label className="text-[13px] font-bold text-gray-700 mb-1">স্থায়ী ঠিকানা <span className="text-red-500">*</span></label>
                <textarea className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:border-[#1abc9c] bg-white" placeholder="স্থায়ী ঠিকানা বাংলায়"></textarea>
              </div>
              <div className="flex flex-col">
                <label className="text-[13px] font-bold text-gray-700 mb-1">Permanent Address <span className="text-red-500">*</span></label>
                <textarea className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:border-[#1abc9c] bg-white" placeholder="Permanent Address in English"></textarea>
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-4 rounded shadow-md transition-all text-sm uppercase mt-10">
              Save & Download
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Reusable Input Component
function InputField({ label, placeholder, required = false }) {
  return (
    <div className="flex flex-col">
      <label className="text-[13px] font-bold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        className="border border-gray-300 rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-300 bg-white transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

export default Birthcertificate;