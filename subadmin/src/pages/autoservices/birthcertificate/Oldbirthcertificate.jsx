import React, { useState } from 'react';
import Header from '../../../components/header/Header';
import Sidebar from '../../../components/sidebar/Sidebar';

function Oldbirthcertificate() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [language, setLanguage] = useState('bn'); // 'bn' for Bangla, 'en' for English

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  // Comprehensive Translation Object
  const t = {
    bn: {
      title: "নতুন জন্মনিবন্ধন",
      name: "নাম",
      fatherName: "পিতার নাম",
      motherName: "মাতার নাম",
      union: "ইউনিয়ন / সিটি কর্পোরেশন",
      cityCorp: "সিটি কর্পোরেশন",
      addr1: "ঠিকানা ১",
      addr2: "ঠিকানা ২",
      addr3: "ঠিকানা ৩",
      regBookNo: "নিবন্ধন বহি নম্বর",
      issueDate: "সনদ প্রদানের তারিখ",
      regDate: "নিবন্ধনের তারিখ",
      birthRegNo: "জন্ম নিবন্ধন নাম্বার",
      dob: "জন্ম তারিখ",
      dobWord: "জন্ম তারিখ কথায়",
      childOrder: "সন্তানের ক্রম",
      birthPlace: "জন্মস্থান",
      gender: "লিঙ্গ",
      male: "পুরুষ",
      female: "মহিলা",
      permAddr: "স্থায়ী ঠিকানা",
      line1: "১ম লাইন",
      line2: "২য় লাইন",
      fatherNid: "পিতার জাতীয় পরিচয়পত্র নম্বর",
      fatherBrn: "পিতার জন্ম নিবন্ধন নম্বর",
      fatherNat: "পিতার জাতীয়তা",
      motherNid: "মাতার জাতীয় পরিচয়পত্র নম্বর",
      motherBrn: "মাতার জন্ম নিবন্ধন নম্বর",
      motherNat: "মাতার জাতীয়তা",
      nationalityVal: "বাংলাদেশী",
      saveBtn: "Save & Download",
      placeholders: {
        name: "সম্পূর্ণ নাম",
        father: "পিতার নাম",
        mother: "মাতার নাম",
        addr1: "অঞ্চল - ৪, ঢাকা উত্তর সিটি কর্পোরেশন",
        addr2: "সিটি কর্পোরেশন; ঢাকা উত্তর সিটি কর্পোরেশন",
        addr3: "জেলা: ঢাকা, বাংলাদেশ।",
        date: "দিন/মাস/বছর",
        dobWord: "পহেলা জানুয়ারী দুই হাজার",
        childOrder: "সন্তানের ক্রম",
        birthPlace: "জন্মস্থান",
        nid: "জাতীয় পরিচয়পত্র নম্বর",
        brn: "জন্ম নিবন্ধন নম্বর"
      }
    },
    en: {
      title: "New Birth Registration",
      name: "Name",
      fatherName: "Father's Name",
      motherName: "Mother's Name",
      union: "Union / City Corporation",
      cityCorp: "City Corporation",
      addr1: "Address 1",
      addr2: "Address 2",
      addr3: "Address 3",
      regBookNo: "Register Book Number",
      issueDate: "Date of Issuance",
      regDate: "Date of Registration",
      birthRegNo: "Birth Registration Number",
      dob: "Date of Birth",
      dobWord: "Date of Birth in Words",
      childOrder: "Order of Child",
      birthPlace: "Place of Birth",
      gender: "Gender",
      male: "Male",
      female: "Female",
      permAddr: "Permanent Address",
      line1: "Line 1",
      line2: "Line 2",
      fatherNid: "Father's NID Number",
      fatherBrn: "Father's Birth Reg Number",
      fatherNat: "Father's Nationality",
      motherNid: "Mother's NID Number",
      motherBrn: "Mother's Birth Reg Number",
      motherNat: "Mother's Nationality",
      nationalityVal: "Bangladeshi",
      saveBtn: "Save & Download",
      placeholders: {
        name: "Full Name in English",
        father: "Father's Name in English",
        mother: "Mother's Name in English",
        addr1: "Zone - 4, Dhaka North City Corporation",
        addr2: "City Corporation; Dhaka North City Corporation",
        addr3: "District: Dhaka, Bangladesh.",
        date: "DD/MM/YYYY",
        dobWord: "First January Two Thousand",
        childOrder: "Serial of Child",
        birthPlace: "Place of Birth",
        nid: "NID Number",
        brn: "Birth Registration Number"
      }
    }
  };

  const current = t[language];

  return (
    <div className="font-anek text-gray-700 lg:ml-72 mt-[9vh]">
      <Header toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      <main className="min-h-[91vh] bg-[#f4f6f9] p-4 md:p-6">
        <div className="w-full mx-auto bg-white p-6 border border-gray-200 shadow-sm rounded-[10px]">
          
          <h2 className="text-[#1abc9c] font-bold text-lg mb-4 ml-2">{current.title}</h2>

          <div className="flex flex-col gap-6">
            
            {/* Language Switcher Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-gray-100">
              <button 
                onClick={() => setLanguage('bn')}
                className={`py-2 text-center font-bold cursor-pointer transition-all ${language === 'bn' ? 'bg-[#1abc9c] text-white rounded-t-md' : 'bg-gray-50 text-gray-500 border-b border-gray-200'}`}
              >
                বাংলা
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`py-2 text-center font-bold cursor-pointer transition-all ${language === 'en' ? 'bg-[#1abc9c] text-white rounded-t-md' : 'bg-gray-50 text-gray-500 border-b border-gray-200'}`}
              >
                English
              </button>
            </div>

            {/* Form Fields Section 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InputField label={current.name} placeholder={current.placeholders.name} />
              <InputField label={current.fatherName} placeholder={current.placeholders.father} />
              <InputField label={current.motherName} placeholder={current.placeholders.mother} />
              
              <div className="flex flex-col">
                <label className="text-[13px] text-gray-600 mb-1 font-semibold">{current.union}</label>
                <select className="border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white text-gray-600">
                  <option>{current.cityCorp}</option>
                </select>
              </div>
            </div>

            {/* Address Triplets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label={current.addr1} placeholder={current.placeholders.addr1} />
              <InputField label={current.addr2} placeholder={current.placeholders.addr2} />
              <InputField label={current.addr3} placeholder={current.placeholders.addr3} />
            </div>

            {/* Registration Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InputField label={current.regBookNo} placeholder="205" />
              <InputField label={current.issueDate} placeholder={current.placeholders.date} />
              <InputField label={current.regDate} placeholder={current.placeholders.date} />
              <InputField label={current.birthRegNo} placeholder="12345678912345678" />
            </div>

            {/* DOB Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label={current.dob} placeholder="01-01-2000" />
              <InputField label={current.dobWord} placeholder={current.placeholders.dobWord} />
              <InputField label={current.childOrder} placeholder={current.placeholders.childOrder} />
            </div>

            {/* Birthplace & Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <InputField label={current.birthPlace} placeholder={current.placeholders.birthPlace} />
              <div className="flex flex-col">
                <label className="text-[13px] text-gray-600 mb-1 font-semibold">{current.gender}</label>
                <select className="border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] bg-white text-gray-600">
                  <option>{current.male}</option>
                  <option>{current.female}</option>
                </select>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="space-y-4">
              <InputField label={current.permAddr} placeholder={current.line1} />
              <input 
                className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-400" 
                placeholder={current.line2} 
              />
            </div>

            {/* Father Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
              <InputField label={current.fatherNid} placeholder={current.placeholders.nid} />
              <InputField label={current.fatherBrn} placeholder={current.placeholders.brn} />
              <InputField label={current.fatherNat} placeholder={current.nationalityVal} />
            </div>

            {/* Mother Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField label={current.motherNid} placeholder={current.placeholders.nid} />
              <InputField label={current.motherBrn} placeholder={current.placeholders.brn} />
              <InputField label={current.motherNat} placeholder={current.nationalityVal} />
            </div>

            {/* Submit Button */}
            <div className="mt-4">
              <button className="w-full bg-[#1abc9c] hover:bg-[#16a085] text-white font-bold py-3.5 rounded-sm transition-all shadow-md uppercase tracking-wider cursor-pointer">
                {current.saveBtn}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Reusable Input Component
function InputField({ label, placeholder }) {
  return (
    <div className="flex flex-col w-full">
      <label className="text-[13px] text-gray-600 mb-1 font-semibold">
        {label}
      </label>
      <input 
        className="border border-gray-300 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#1abc9c] placeholder:text-gray-300 bg-white transition-all"
        placeholder={placeholder}
      />
    </div>
  );
}

export default Oldbirthcertificate;