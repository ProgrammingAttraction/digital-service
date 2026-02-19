import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Servercopyunofficial2() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const [searchId, setSearchId] = useState(id || '');
  const [searchType, setSearchType] = useState('nid');

  const api = axios.create({
    baseURL: base_url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'userid': userId
    }
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId) {
      navigate(`/server-copy-unofficial/${searchId}`);
    }
  };

  useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/user/server-copy-unofficial/${id}`);
        const result = response.data.success ? response.data.data : response.data;

        if (result && result.nationalId) {
          setData(result);
          setSearchId(result.nationalId); // Sync search input with current data
        } else {
          setError('সার্ভার কপি খুঁজে পাওয়া যায়নি');
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError('সার্ভার কপি লোড করতে ব্যর্থ হয়েছে');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCertificateData();
  }, [id]);
useEffect(() => {
  if (data) {
    const title = `Unofficial_NID_${id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data]);

  const handlePrint = () => window.print();

  const DataRow = ({ label, value, isBold = false }) => (
    <tr className="border border-[#ccc]">
      <td className="py-[6px] px-[10px] text-[#333] print:text-[11px] text-[15px] w-[38%] font-normal bg-white">
        {label}
      </td>
      <td className={`py-[6px] px-[10px] text-[#000] print:text-[12px] text-[16px] bg-white ${isBold ? 'font-bold' : 'font-normal'}`}>
        {value || 'N/A'}
      </td>
    </tr>
  );

  const SectionHeader = ({ title }) => (
    <tr>
      <td colSpan="2" className="bg-[#b7ddec] py-[6px] px-[10px] print:text-[12px] text-[16px] font-bold text-[#222] border border-[#ccc]">
        {title}
      </td>
    </tr>
  );

  if (loading) return <div className="flex justify-center items-center min-h-screen"><ApertureLoader /></div>;
  if (error || !data) return <div className="text-center p-10 text-red-500 font-bold text-xl">{error || 'Data Not Found'}</div>;

  return (
    <div className="bg-zinc-200 min-h-screen py-5 print:p-0 print:bg-white">
      {/* Action Toolbar */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-center print:hidden px-2">
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 bg-emerald-700 cursor-pointer text-white px-8 py-3 rounded shadow-lg font-bold hover:bg-emerald-800 transition text-lg"
        >
          <Printer size={22}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Main A4 Document */}
      <div 
        className="bg-[#FBFBFB] mx-auto w-[210mm] min-h-[297mm] h-auto shadow-xl print:shadow-none print:m-0 border border-gray-300 print:border-none relative flex flex-col print-container" 
        id="printable-area"
      >
        
        {/* Full Width EC Header Banner */}
        <div className="w-full block">
          <img 
            src="https://i.ibb.co/7dKHmJKH/Screenshot-2026-02-08-200629.png" 
            alt="Bangladesh Election Commission Header" 
            className="w-full h-auto block m-0 p-0"
          />
          
          {/* SEARCH SECTION (Visible in Print, Buttons Hidden) */}
          <div className="w-full bg-white py-1 border-b relative border-gray-100 flex flex-col items-center">
              <h2 className="text-[#ff0099] font-bold text-[17px] mb-2 font-arial">Select Your Search Category</h2>
              
              <div className="flex flex-col items-start gap-1 mb-3 text-[12px] font-semibold">
                  <label className="flex items-center gap-2 text-[#008000] cursor-pointer">
                      <input type="radio" checked={searchType === 'nid'} onChange={() => setSearchType('nid')} className="accent-green-600" />
                      Search By NID / Voter No.
                  </label>
                  <label className="flex items-center gap-2 text-[#0070c0] cursor-pointer">
                      <input type="radio" checked={searchType === 'form'} onChange={() => setSearchType('form')} className="accent-blue-600" />
                      Search By Form No.
                  </label>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 mb-2">
                  <span className="text-red-600 font-bold text-[14px]">NID or Voter No*</span>
                  <input 
                      type="text" 
                      value={data.nationalId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="border border-gray-200 rounded-[3px] text-black px-2  py-[2px] w-48 text-[14px] focus:outline-none print:border"
                  />
                  <button type="submit" className="bg-[#28a745] text-white px-2 py-[3px] text-[14px] rounded-[4px]">
                      Submit
                  </button>
                  <button type="button" onClick={() => navigate('/')} className="bg-[#007bff] absolute top-[5px] right-[5px] text-white px-4 py-[3px] text-[14px] rounded-[4px]  ml-6 ">
                      Home
                  </button>
              </form>
          </div>
        </div>

        {/* Content Section - items-start ensures items don't stretch to full height */}
        <div className="px-10 py-6 flex gap-8 items-start flex-grow">
          
          {/* Left Column: Photo & QR - h-fit solves the white background stretch */}
          <div className="w-[160px] flex flex-col bg-white p-[5px] rounded-[5px] h-fit items-center border border-gray-100">
            <div className="w-[145px] h-[175px] p-0.5 bg-white mb-3">
              <img 
                src={data.photo || "https://via.placeholder.com/145x175?text=No+Photo"} 
                alt="NID User" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-bold text-center text-[14px] print:text-[11px] mb-3 uppercase leading-tight w-full break-words">
              {data.nameEnglish}
            </p>
            <div className="w-[110px] h-[110px] p-1">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `Name: ${data.nameEnglish}\nNID: ${data.nationalId}\nDOB: ${data.birthDate}`
                )}`} 
                alt="Verification QR" 
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Right Column: Information Tables */}
          <div className="flex-1">
            <table className="w-full border-collapse table-fixed">
              <tbody>
                <SectionHeader title="জাতীয় পরিচিতি তথ্য" />
                <DataRow label="জাতীয় পরিচয় পত্র নম্বর" value={data.nationalId} />
                <DataRow label="পিন নম্বর" value={data.pinNumber} />
                <DataRow label="ভোটার সিরিয়াল নাম্বার" value={data.voterSerial || "6173"} />
                <DataRow label="ভোটার এলাকা" value={data.voterArea} />

                <SectionHeader title="ব্যক্তিগত তথ্য" />
                <DataRow label="নাম (বাংলা)" value={data.nameBangla}  />
                <DataRow label="নাম (ইংরেজি)" value={data.nameEnglish} />
                <DataRow label="জন্ম তারিখ" value={data.birthDate} />
                <DataRow label="পিতার নাম" value={data.fatherName} />
                <DataRow label="মাতার নাম" value={data.motherName} />

                <SectionHeader title="অন্যান্য তথ্য" />
                <DataRow label="লিঙ্গ" value={data.gender === 'Female' ? 'মহিলা' : 'পুরুষ'} />
                <DataRow label="জন্মস্থান" value={data.birthPlace} />

                <SectionHeader title="বর্তমান ঠিকানা" />
                <tr>
                  <td colSpan="2" className="p-3 text-[14px] print:text-[11px] leading-relaxed border border-[#ccc] bg-white">
                    {data.currentAddress || (data.presentAddress && data.presentAddress.addressLine)}
                  </td>
                </tr>

                <SectionHeader title="স্থায়ী ঠিকানা" />
                <tr>
                  <td colSpan="2" className="p-3 text-[14px] print:text-[11px] leading-relaxed border border-[#ccc] bg-white">
                    {data.permanentAddressLine || (data.permanentAddress && data.permanentAddress.addressLine)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="w-full text-center px-10 pb-10 mt-4">
          <p className="text-red-600 text-[13px] print:text-[10px] font-bold mb-1">
            উপরে প্রদর্শিত তথ্যসমূহ জাতীয় পরিচয়পত্র সংশ্লিষ্ট, ভোটার তালিকার সাথে সরাসরি সম্পর্কযুক্ত নয়।
          </p>
          <p className="text-gray-700 text-[12px] print:text-[9px]">
            This is Software Generated Report From Bangladesh Election Commission, Signature & Seal Aren't Required.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        
        * { box-sizing: border-box; }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body { 
            margin: 0; 
            padding: 0;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important;
          }
          .print-hidden { display: none !important; }
          
          input[type="text"] {
            border: 1px solid #999 !important;
            -webkit-appearance: none;
          }

          .print-container {
            padding-top: 5mm !important; 
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
          }
          table { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}

export default Servercopyunofficial2;