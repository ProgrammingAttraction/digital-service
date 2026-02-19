import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  ImageIcon,
  Star,
  CheckCircle2
} from 'lucide-react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Oldnid() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for Previews and File Names
  const [fileData, setFileData] = useState({
    pdf: { preview: null, name: "No file chosen" },
    nid: { preview: null, name: "No file chosen" },
    sign: { preview: null, name: "No file chosen" }
  });

  // Refs for hidden file inputs
  const pdfInputRef = useRef(null);
  const nidInputRef = useRef(null);
  const signInputRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Handle File Change
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

  // Clear File
  const clearFile = (e, type) => {
    e.stopPropagation();
    setFileData(prev => ({ 
      ...prev, 
      [type]: { preview: null, name: "No file chosen" } 
    }));
  };

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[93vh] bg-[#f4f6f9] p-4 md:p-6">
               {/* Page Title */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-[#00a65a] rounded-full"></div>
          <h1 className="text-[#00a65a] text-xl font-bold">পুরাতন স্মার্ট এনআইডি</h1>
        </div>

    
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-8 w-full mx-auto">
    

          {/* PDF Upload Section */}
          <div className="flex justify-center mb-10">
            <input 
              type="file" 
              ref={pdfInputRef} 
              className="hidden" 
              accept=".pdf" 
              onChange={(e) => handleFileChange(e, 'pdf')} 
            />
            <div 
              onClick={() => pdfInputRef.current.click()}
              className="border-2 border-dashed border-[#1abc9c] bg-teal-50/30 rounded-xl p-10 flex flex-col items-center justify-center w-full max-w-lg cursor-pointer hover:bg-teal-50 transition-all"
            >
              <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                <FileText size={40} className="text-[#1abc9c]" />
              </div>
              <p className="text-[#1abc9c] text-center font-bold text-lg">
                {fileData.pdf.preview ? "ফাইল লোড হয়েছে" : "সাইন কপি লোড করতে"}
              </p>
              <p className="text-gray-400 text-sm mt-1 text-center font-medium">এখানে ক্লিক করে ফাইল সিলেক্ট করুন</p>
            </div>
          </div>

          {/* Image Upload Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            
            {/* NID Photo Box */}
            <div className="flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                এনআইডি ছবি <span className="text-red-500">*</span>
              </label>
              <input type="file" ref={nidInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'nid')} />
              <div 
                onClick={() => nidInputRef.current.click()} 
                className="border border-gray-300 rounded-xl overflow-hidden shadow-sm cursor-pointer group"
              >
                <div className="bg-[#eeeeee] h-48 flex flex-col items-center justify-center relative border-b border-gray-300">
                  {fileData.nid.preview ? (
                    <img src={fileData.nid.preview} alt="NID" className="w-full h-full object-contain p-1" />
                  ) : (
                    <>
                      <ImageIcon size={48} className="mb-2 text-[#1abc9c]" />
                      <span className="text-gray-400 font-bold text-xs tracking-widest uppercase">No Image Selected</span>
                    </>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-white border p-1.5 rounded-lg text-blue-500 shadow-sm"><Upload size={16} /></div>
                    {fileData.nid.preview && (
                      <div onClick={(e) => clearFile(e, 'nid')} className="bg-white text-red-500 p-1.5 rounded-lg shadow-md border border-red-50 hover:bg-red-50"><X size={16} /></div>
                    )}
                  </div>
                </div>
                <div className="w-full py-3 text-sm font-medium text-center bg-[#1abc9c] text-white transition-all">
                  এখানে ক্লিক করে ছবি আপলোড করুন
                </div>
              </div>
            </div>

            {/* Signature Box */}
            <div className="flex flex-col">
              <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
                স্বাক্ষর <span className="text-gray-400 font-normal text-xs">(ঐচ্ছিক)</span>
              </label>
              <input type="file" ref={signInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'sign')} />
              <div 
                onClick={() => signInputRef.current.click()} 
                className="border border-gray-300 rounded-xl overflow-hidden shadow-sm cursor-pointer group"
              >
                <div className="bg-[#eeeeee] h-48 flex flex-col items-center justify-center relative border-b border-gray-300">
                  {fileData.sign.preview ? (
                    <img src={fileData.sign.preview} alt="Sign" className="w-full h-full object-contain p-1" />
                  ) : (
                    <>
                      <ImageIcon size={48} className="mb-2 text-[#1abc9c]" />
                      <span className="text-gray-400 font-bold text-xs tracking-widest uppercase">No Signature Selected</span>
                    </>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-white border p-1.5 rounded-lg text-blue-500 shadow-sm"><Upload size={16} /></div>
                    {fileData.sign.preview && (
                      <div onClick={(e) => clearFile(e, 'sign')} className="bg-white text-red-500 p-1.5 rounded-lg shadow-md border border-red-50 hover:bg-red-50"><X size={16} /></div>
                    )}
                  </div>
                </div>
                <div className="w-full py-3 text-sm font-medium text-center bg-[#1abc9c] text-white transition-all">
                  এখানে ক্লিক করে স্বাক্ষর আপলোড করুন
                </div>
              </div>
            </div>

          </div>

          {/* Alert Note */}
          <div className="bg-[#e1f5fe] text-[#00838f] text-[12px] md:text-[13px] p-3 rounded-md mb-8 border border-blue-100 flex items-center justify-center gap-2">
            <CheckCircle2 size={18} className="text-[#00a65a]" />
            <p>
              যদি ছবির ব্যাকগ্রাউন্ড সঠিকভাবে সরানো না হয় তাহলে আসল ছবিটি ডাউনলোড করুন এবং <a href="https://remove.bg" target="_blank" rel="noreferrer" className="text-red-600 font-bold underline px-1">remove.bg</a> থেকে ব্যাকগ্রাউন্ড সরান।
            </p>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <InputField label="নাম (বাংলা )" placeholder="সম্পূর্ণ নাম বাংলায়" required />
            <InputField label="নাম (ইংরেজী)" placeholder="সম্পূর্ণ নাম ইংরেজীতে" required />
            <InputField label="এনআইডি নম্বর ১০/১৭ ডিজিট" placeholder="পুরাতন এনআইডি নম্বর" required />
            <InputField label="পিন নম্বর" placeholder="পিন নাম্বার" required />
            
            <div className="flex flex-col">
               <div className="flex items-center gap-4 mb-2">
                  <label className="text-[13px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="guardian" defaultChecked className="accent-[#00a65a]" /> পিতা
                  </label>
                  <label className="text-[13px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer">
                    <input type="radio" name="guardian" className="accent-[#00a65a]" /> স্বামী
                  </label>
               </div>
               <input 
                className="border border-[#ced4da] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-400 bg-white"
                placeholder="(মহিলা বিবাহিত হলে স্বামীর নাম দিয়ে করুন)"
              />
            </div>

            <InputField label="মাতার নাম" placeholder="মাতার নাম বাংলায়" required />
            <InputField label="জন্মস্থান" placeholder="জন্মস্থান (অঞ্চল)" required />
            <InputField label="জন্ম তারিখ" placeholder="20 Mar 1987" required />
            <InputField label="রক্তের গ্রুপ" placeholder="B+" />
            <InputField label="প্রদানের তারিখ" placeholder="20/03/2010" required />
          </div>

          {/* Address Textarea */}
          <div className="mt-4">
            <label className="text-[13px] font-bold text-gray-700 mb-1 block">ঠিকানা <span className="text-red-500">*</span></label>
            <textarea 
              className="w-full border border-[#ced4da] rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] min-h-[90px] bg-white transition-all"
              placeholder="বাসা/হোল্ডিং, গ্রাম/রাস্তা, ডাকঘর, উপজেলা, জেলা..."
            />
          </div>

          {/* Action Button */}
          <button className="w-full mt-8 bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-4 rounded shadow-md transition-all uppercase tracking-wider text-sm flex items-center justify-center gap-2">
            Save & Download Details
          </button>
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
        className="border border-[#ced4da] rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-400 bg-white transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

export default Oldnid;