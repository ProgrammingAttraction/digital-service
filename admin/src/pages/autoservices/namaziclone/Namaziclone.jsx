import React, { useState } from 'react';
import { User, MapPin, Landmark, DollarSign, Plus, Minus } from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Namaziclone() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        {/* Page Title */}
        <div className="mb-4">
          <h1 className="text-[#1abc9c] text-lg font-bold">নামজারি ক্লোন</h1>
        </div>

        <div className="max-w-full space-y-6">
          
          {/* 1. Basic Information Section (মৌলিক তথ্য) */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <Landmark size={18} className="text-[#1abc9c]" />
              <h2 className="text-[#1abc9c] font-bold text-sm">মৌলিক তথ্য</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <IconInputField label="ক্রমিক নং:" icon="#" placeholder="753968362519" />
              <IconInputField label="চালান নং:" icon="📄" placeholder="759292" />
              <IconInputField label="পরিশোধের সাল:" icon="📅" placeholder="2023-2024" />
              <IconInputField label="পরিশোধের তারিখ (EN):" icon="📅" placeholder="dd-mm-yyyy" />
              
              <div className="md:col-span-1">
                <IconInputField label="সিটি কর্পোরেশন / পৌর / ইউনিয়ন ভূমি অফিসের নাম:" icon="🏢" placeholder="ভূমি অফিসের নাম" />
              </div>
              <IconInputField label="মৌজার ও জে. এল. নং:" icon="🗺️" placeholder="মৌজার নাম" />
              <IconInputField label="উপজেলা / থানা:" icon="📍" placeholder="উপজেলা" />
              <IconInputField label="জেলা:" icon="🌍" placeholder="জেলা" />
              <IconInputField label="হোল্ডিং নম্বর:" icon="🏠" placeholder="২১৪৮" />
              <IconInputField label="খতিয়ান নং:" icon="📄" placeholder="২১৮৬" />
            </div>
          </section>

          {/* 2. Owner Information (মালিকের তথ্য) */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 p-3 border-b bg-gray-50 border-gray-200 rounded-t-lg">
              <User size={18} className="text-[#1abc9c]" />
              <h2 className="text-[#1abc9c] font-bold text-sm">মালিকের তথ্য</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border border-gray-100 p-3 rounded mb-4">
                <div className="md:col-span-1">
                  <InputField label="ক্রম" placeholder="1" />
                </div>
                <div className="md:col-span-6">
                  <InputField label="মালিকের নাম" placeholder="মালিকের নাম লিখুন" />
                </div>
                <div className="md:col-span-4">
                  <InputField label="মালিকের অংশ" placeholder="অংশ লিখুন" />
                </div>
                <div className="md:col-span-1">
                  <button className="w-full bg-red-500 text-white py-2 rounded flex justify-center items-center">
                    <Minus size={16} />
                  </button>
                </div>
              </div>
              <button className="flex items-center gap-1 bg-[#1abc9c] text-white px-4 py-1.5 rounded text-xs font-bold mx-auto">
                <Plus size={14} /> মালিক যোগ করুন
              </button>
            </div>
          </section>

          {/* 3. Land Information (জমির তথ্য) */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 p-3 border-b bg-gray-50 border-gray-200 rounded-t-lg">
              <MapPin size={18} className="text-[#1abc9c]" />
              <h2 className="text-[#1abc9c] font-bold text-sm">জমির তথ্য</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border border-gray-100 p-3 rounded mb-4">
                <div className="md:col-span-1">
                  <InputField label="ক্রম" placeholder="1" />
                </div>
                <div className="md:col-span-3">
                  <InputField label="দাগ নং" placeholder="নং লিখুন" />
                </div>
                <div className="md:col-span-3">
                  <InputField label="জমির শ্রেণী" placeholder="পুকুর (কৃষি ২)" />
                </div>
                <div className="md:col-span-4">
                  <InputField label="জমির পরিমাণ" placeholder="জমির পরিমাণ (শতক)" />
                </div>
                <div className="md:col-span-1">
                  <button className="w-full bg-red-500 text-white py-2 rounded flex justify-center items-center">
                    <Minus size={16} />
                  </button>
                </div>
              </div>
              <button className="flex items-center gap-1 bg-[#1abc9c] text-white px-4 py-1.5 rounded text-xs font-bold mx-auto">
                <Plus size={14} /> জমি যোগ করুন
              </button>
            </div>
          </section>

          {/* 4. Payment Details (আদায়ের বিবরণ) */}
          <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
              <DollarSign size={18} className="text-[#1abc9c]" />
              <h2 className="text-[#1abc9c] font-bold text-sm">আদায়ের বিবরণ</h2>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <IconInputField label="তিন বৎসরের ঊর্ধ্বের বকেয়া" icon="৳" placeholder="০" />
              <IconInputField label="গত তিন বৎসরের বকেয়া" icon="৳" placeholder="০" />
              <IconInputField label="বকেয়ার সুদ ও ক্ষতিপূরণ" icon="৳" placeholder="০" />
              <IconInputField label="হাল দাবি" icon="৳" placeholder="০" />
              <IconInputField label="মোট দাবি" icon="৳" placeholder="০" />
              <IconInputField label="মোট আদায়" icon="৳" placeholder="০" />
              <IconInputField label="মোট বকেয়া" icon="৳" placeholder="০" />
              <InputField label="মন্তব্য" placeholder="(ঐচ্ছিক)" />
            </div>
          </section>

          {/* Footer Action */}
          <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-3 rounded-md shadow-md transition-all text-sm">
            Save & Download
          </button>
        </div>
      </main>
    </div>
  );
}

// Custom Input with Left-side Icon
function IconInputField({ label, icon, placeholder }) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-bold text-gray-600 mb-1">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-400 text-xs">{icon}</span>
        <input 
          className="w-full border border-gray-300 rounded px-3 py-1.5 pl-8 text-xs focus:outline-none focus:border-[#1abc9c] bg-white transition-all"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

// Standard Input
function InputField({ label, placeholder }) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-bold text-gray-600 mb-1">{label}</label>
      <input 
        className="border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c] bg-white"
        placeholder={placeholder}
      />
    </div>
  );
}

export default Namaziclone;