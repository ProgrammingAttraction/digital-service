import React, { useState } from 'react';
import { RotateCcw, Info } from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Newbirthcertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Background */}
      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        <div className="max-w-7xl mx-auto bg-white p-6 border border-gray-200 shadow-sm rounded-[10px]">
          
          {/* Top Auto Load Section - Dashed Box */}
          <div className="flex justify-center mb-8">
            <button className="flex flex-col items-center justify-center border-2 border-dashed border-[#2ecc71] rounded-2xl p-6 px-16 bg-white hover:bg-green-50 transition-colors group">
              <div className="bg-[#a2ebd0] p-2 rounded-lg mb-2">
                 <Info className="text-[#16a085]" size={24} />
              </div>
              <span className="text-[#16a085] font-bold text-sm leading-relaxed text-center">
                স্বয়ংক্রিয়ভাবে ডাটা লোড করতে <br /> এখানে ক্লিক করুন
              </span>
            </button>
          </div>

          {/* Form Container */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              
              {/* Left Column */}
              <div className="space-y-4">
                <InputField label="Register Office Address" placeholder="রেজিস্টার অফিসের ঠিকানা" required />
                <InputField label="Birth Registration Number" placeholder="XXXXXXXXXXXXXXXXX" required />
                <InputField label="Date of Registration" placeholder="DD/MM/YYYY" required />
                <InputField label="Date of Birth" placeholder="DD/MM/YYYY" required />
                
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-gray-700 mb-1">Left Bar Code <span className="text-red-500">*</span></label>
                  <div className="flex gap-0">
                    <input className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c]" placeholder="XXXXX" />
                    <button className="bg-white border border-l-0 border-gray-300 px-3 rounded-r-md text-[#1abc9c] hover:bg-gray-50 transition-colors">
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
                <TextAreaField label="স্থায়ী ঠিকানা" placeholder="স্থায়ী ঠিকানা বাংলায়" required />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <InputField label="Upazila/Pourashava/City Corporation, Zila" placeholder="উপজেলা/পৌরসভা/সিটি কর্পোরেশন, জেলা" required />
                
                <div className="flex flex-col">
                  <label className="text-[13px] font-semibold text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label>
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white text-gray-500">
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
                <TextAreaField label="Permanent Address" placeholder="Permanent Address in English" />
              </div>
            </div>

            {/* Bottom Button */}
            <div className="pt-4">
              <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-medium py-3 rounded-md transition-colors shadow-sm">
                Save & Download
              </button>
            </div>
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
      <label className="text-[13px] font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-400"
        placeholder={placeholder}
      />
    </div>
  );
}

// Reusable Textarea Component
function TextAreaField({ label, placeholder, required = false }) {
  return (
    <div className="flex flex-col">
      <label className="text-[13px] font-semibold text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea 
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-400" 
        placeholder={placeholder}
      />
    </div>
  );
}

export default Newbirthcertificate;