import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  X, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import Header from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';

function Smartcard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for Image Previews
  const [previews, setPreviews] = useState({
    pdf: null,
    nid: null,
    sign: null
  });

  // Refs for hidden file inputs
  const pdfInputRef = useRef(null);
  const nidInputRef = useRef(null);
  const signInputRef = useRef(null);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Handle File Change and Create Preview
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear Image
  const clearFile = (e, type) => {
    e.stopPropagation(); // Prevent triggering the click-to-upload on the parent
    setPreviews(prev => ({ ...prev, [type]: null }));
  };

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[93vh] bg-[#f8f9fa] p-3 md:p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-[#00a65a] rounded-full"></div>
          <h1 className="text-[#00a65a] text-xl font-bold">নতুন স্মার্ট এনআইডি</h1>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-8 w-full mx-auto">
          
          {/* PDF Upload Section - Clickable Box */}
          <div className="flex justify-center mb-8">
            <input 
              type="file" 
              ref={pdfInputRef} 
              className="hidden" 
              accept=".pdf" 
              onChange={(e) => handleFileChange(e, 'pdf')}
            />
            <div 
              onClick={() => pdfInputRef.current.click()}
              className="group border-2 border-dashed border-[#1abc9c] bg-teal-50/30 rounded-xl p-8 flex flex-col items-center justify-center w-full max-w-md cursor-pointer hover:bg-teal-50 transition-all duration-300"
            >
              <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <FileText size={40} className="text-[#1abc9c]" />
              </div>
              <p className="text-[#1abc9c] text-center font-bold text-lg">
                {previews.pdf ? "ফাইল লোড হয়েছে" : "সাইন কপি লোড করুন"}
              </p>
              <p className="text-gray-400 text-sm mt-1 text-center">এখানে ক্লিক করে ফাইল সিলেক্ট করুন</p>
            </div>
          </div>

          {/* Image Upload Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            
            {/* NID Photo - Full Box Clickable */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 flex items-center gap-1">
                এনআইডি ছবি <span className="text-red-500">*</span>
              </label>
              <input 
                type="file" 
                ref={nidInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'nid')}
              />
              <div 
                onClick={() => nidInputRef.current.click()}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm cursor-pointer group"
              >
                <div className="bg-[#fcfcfc] h-48 flex flex-col items-center justify-center relative border-b border-gray-100 overflow-hidden">
                  {previews.nid ? (
                    <img src={previews.nid} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon size={48} className="mb-2 text-[#1abc9c] transition-colors" />
                      <span className="text-gray-400 font-bold text-xs tracking-widest uppercase">No Image Selected</span>
                    </>
                  )}
                  
                  {/* Action Overlay */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-[#1abc9c] text-white p-2 rounded-lg ">
                      <Upload size={18} />
                    </div>
                    {previews.nid && (
                      <button 
                        onClick={(e) => clearFile(e, 'nid')}
                        className="bg-white text-red-500 p-2 rounded-lg shadow-md border border-red-50 hover:bg-red-50 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full py-3 text-sm font-medium text-gray-600 text-center bg-[#1abc9c] text-white transition-all">
                  এখানে ক্লিক করে ছবি আপলোড করুন
                </div>
              </div>
            </div>

            {/* Signature - Full Box Clickable */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 flex items-center gap-1">
                স্বাক্ষর <span className="text-gray-400 font-normal">(ঐচ্ছিক)</span>
              </label>
              <input 
                type="file" 
                ref={signInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => handleFileChange(e, 'sign')}
              />
              <div 
                onClick={() => signInputRef.current.click()}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm cursor-pointer group"
              >
                <div className="bg-[#fcfcfc] h-48 flex flex-col items-center justify-center relative border-b border-gray-100 overflow-hidden">
                  {previews.sign ? (
                    <img src={previews.sign} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon size={48} className=" mb-2 :text-[#1abc9c] transition-colors" />
                      <span className="text-gray-400 font-bold text-xs tracking-widest uppercase">No Signature Selected</span>
                    </>
                  )}
                  
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className="bg-[#1abc9c] text-white p-2 rounded-lg">
                      <Upload size={18} />
                    </div>
                    {previews.sign && (
                      <button 
                        onClick={(e) => clearFile(e, 'sign')}
                        className="bg-white text-red-500 p-2 rounded-lg shadow-md border border-red-50 hover:bg-red-50 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="w-full py-3 text-sm font-medium text-gray-600 text-center bg-[#1abc9c] text-white transition-all">
                  এখানে ক্লিক করে স্বাক্ষর আপলোড করুন
                </div>
              </div>
            </div>
          </div>

          {/* Alert Box */}
          <div className="bg-amber-50 text-amber-800 text-[13px] p-4 rounded-lg mb-8 border border-amber-100 flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p>
              যদি ছবির ব্যাকগ্রাউন্ড সঠিকভাবে সরানো না হয় তাহলে আসল ছবিটি ডাউনলোড করুন এবং 
              <a href="https://remove.bg" target="_blank" rel="noreferrer" className="text-red-600 font-bold underline px-1 hover:text-red-700">remove.bg</a> 
              থেকে ব্যাকগ্রাউন্ড সরান।
            </p>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputField label="নাম (বাংলা)" placeholder="সম্পূর্ণ নাম বাংলায়" required />
            <InputField label="নাম (ইংরেজী)" placeholder="সম্পূর্ণ নাম ইংরেজীতে" required />
            <InputField label="এনআইডি নম্বর" placeholder="এনআইডি নাম্বার" required />
            <InputField label="পিন নম্বর" placeholder="পিন নাম্বার" required />
            <InputField label="পিতার নাম" placeholder="পিতার নাম বাংলায়" required />
            <InputField label="মাতার নাম" placeholder="মাতার নাম বাংলায়" required />
            <InputField label="জন্মস্থান" placeholder="জন্মস্থান (অঞ্চল)" required />
            <InputField label="জন্ম তারিখ" placeholder="20 Mar 1987" required />
            <InputField label="রক্তের গ্রুপ" placeholder="B+" />
            <InputField label="প্রদানের তারিখ" placeholder="24/12/2025" required />
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold mb-2 block">ঠিকানা <span className="text-red-500">*</span></label>
            <textarea 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]/20 focus:border-[#1abc9c] transition-all min-h-[100px] bg-gray-50/30"
              placeholder="বাসা/হোল্ডিং, গ্রাম/রাস্তা, ডাকঘর, উপজেলা, জেলা..."
            />
          </div>

          <button className="w-full mt-10 bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 uppercase tracking-wide">
            Save & Download Details
          </button>
        </div>
      </main>
    </div>
  );
}

function InputField({ label, placeholder, type = "text", required = false }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold mb-2 flex items-center gap-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input 
        type={type} 
        placeholder={placeholder}
        className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1abc9c]/20 focus:border-[#1abc9c] transition-all bg-gray-50/30 placeholder:text-gray-400"
      />
    </div>
  );
}

export default Smartcard;