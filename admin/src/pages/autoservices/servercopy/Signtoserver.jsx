import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  ImageIcon,
  CheckCircle2
} from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Signtoserver() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [copyType, setCopyType] = useState('old');
  
  // State for Previews and File Names
  const [fileData, setFileData] = useState({
    pdf: { preview: null, name: "No file chosen" },
    nid: { preview: null, name: "No file chosen" }
  });

  // Refs
  const pdfInputRef = useRef(null);
  const nidInputRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFileData(prev => ({ 
          ...prev, 
          [type]: { preview: reader.result, name: file.name } 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        {/* Top Label */}
        <div className="mb-4">
          <h1 className="text-[#1abc9c] text-lg font-bold">সাইন টু সার্ভার কপি</h1>
        </div>

        <div className="w-full bg-white p-6 border border-gray-200 shadow-sm rounded-lg">
          
          {/* PDF Upload Section (Top Center) */}
          <div className="flex flex-col items-center mb-6">
            <input 
              type="file" 
              ref={pdfInputRef} 
              className="hidden" 
              accept=".pdf" 
              onChange={(e) => handleFileChange(e, 'pdf')} 
            />
            <div 
              onClick={() => pdfInputRef.current.click()}
              className="border-2 border-dashed border-[#1abc9c] rounded-xl p-6 flex flex-col items-center justify-center w-full max-w-md cursor-pointer hover:bg-teal-50 transition-all"
            >
              <div className="text-[#1abc9c] mb-2">
                <FileText size={42} strokeWidth={1.5} />
              </div>
              <p className="text-[#1abc9c] font-bold text-sm">সাইন কপি লোড করতে</p>
              <p className="text-gray-400 text-xs mt-1">এখানে ক্লিক করুন</p>
            </div>
          </div>

          {/* Server Copy Type Section */}
          <div className="flex flex-col items-center mb-8">
            <h2 className="text-[#1abc9c] font-bold text-sm mb-3">সার্ভার কপি টাইপ</h2>
            <div className="flex flex-col gap-2 items-start">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input type="radio" name="type" checked={copyType === 'old'} onChange={() => setCopyType('old')} className="accent-[#1abc9c]" />
                Old (With QR Code)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input type="radio" name="type" checked={copyType === 'new_no_qr'} onChange={() => setCopyType('new_no_qr')} className="accent-[#1abc9c]" />
                New (Without QR Code)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input type="radio" name="type" checked={copyType === 'new_dark'} onChange={() => setCopyType('new_dark')} className="accent-[#1abc9c]" />
                New (Dark Background)
              </label>
            </div>
          </div>

          {/* Photo Preview Box */}
          <div className="flex justify-center mb-8">
             <div 
              onClick={() => nidInputRef.current.click()}
              className="w-24 h-28 border border-red-400 flex flex-col items-center justify-center text-[10px] text-red-500 font-bold cursor-pointer bg-gray-50 overflow-hidden"
             >
               <input type="file" ref={nidInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'nid')} />
               {fileData.nid.preview ? (
                 <img src={fileData.nid.preview} alt="NID" className="w-full h-full object-cover" />
               ) : (
                 "NO IMAGE"
               )}
             </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <InputField label="নাম (বাংলা )" placeholder="সম্পূর্ণ নাম বাংলায়" required />
            <InputField label="নাম (ইংরেজী)" placeholder="সম্পূর্ণ নাম ইংরেজীতে" required />
            <InputField label="এনআইডি নম্বর" placeholder="এনআইডি নাম্বার" required />
            <InputField label="পিন নম্বর" placeholder="পিন নাম্বার" required />
            <InputField label="ফরম নম্বর" placeholder="ফরম নাম্বার" required />
            <InputField label="ভোটার নম্বর" placeholder="ভোটার নাম্বার" required />
            <InputField label="ভোটার এরিয়া" placeholder="ভোটার এরিয়া" required />
            <InputField label="মোবাইল নম্বর" placeholder="মোবাইল নাম্বার" required />
            <InputField label="পিতার নাম" placeholder="পিতার নাম বাংলায়" required />
            <InputField label="মাতার নাম" placeholder="মাতার নাম বাংলায়" required />
            <InputField label="স্বামী/স্ত্রীর নাম" placeholder="স্বামী/স্ত্রীর নাম বাংলায়" />
            <InputField label="শিক্ষাগত যোগ্যতা" placeholder="শিক্ষাগত যোগ্যতা" required />
            <InputField label="জন্মস্থান" placeholder="জন্মস্থান (অঞ্চল)" required />
            <InputField label="জন্ম তারিখ" placeholder="20 Mar 1987" required />
            <InputField label="রক্তের গ্রুপ" placeholder="B+" />
            
            <div className="flex flex-col">
              <label className="text-[11px] font-bold text-gray-600 mb-1">লিঙ্গ <span className="text-red-500">*</span></label>
              <select className="border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c] bg-white">
                <option>Gender</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-gray-600 mb-1">বর্তমান ঠিকানা <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#1abc9c] min-h-[50px]"
                placeholder="বাসা/হোল্ডিং: (Holding), গ্রাম/রাস্তা: (গ্রাম, মৌজা), ডাকঘর: (Post Office - Postal Code), উপজেলা, সিটি কর্পোরেশন/পৌরসভা, জেলা"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-gray-600 mb-1">স্থায়ী ঠিকানা <span className="text-red-500">*</span></label>
              <textarea 
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#1abc9c] min-h-[50px]"
                placeholder="বাসা/হোল্ডিং: (Holding), গ্রাম/রাস্তা: (গ্রাম, মৌজা), ডাকঘর: (Post Office - Postal Code), উপজেলা, সিটি কর্পোরেশন/পৌরসভা, জেলা"
              />
            </div>
          </div>

          {/* Footer Action */}
          <div className="mt-8">
            <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-3 rounded text-sm transition-all shadow-sm">
              Save & Download
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function InputField({ label, placeholder, required = false }) {
  return (
    <div className="flex flex-col">
      <label className="text-[11px] font-bold text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        className="border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-300 bg-white"
        placeholder={placeholder}
      />
    </div>
  );
}

export default Signtoserver;