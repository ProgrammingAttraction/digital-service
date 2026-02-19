import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Servercopyprint3() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const api = axios.create({
    baseURL: base_url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'userid': userId
    }
  });

  useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/user/server-copy/${id}`);
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Server copy not found');
        }
      } catch (err) {
        setError('সার্ভার কপি লোড করতে ব্যর্থ হয়েছে');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCertificateData();
  }, [id, base_url, token, userId]);
  useEffect(() => {
    if (data) {
      const title = `NID_Server_Copy_${id}`;
      document.title = title;
    }
    // Reset title when leaving the page
    return () => { document.title = "Digital Service"; };
  }, [id]);
  const handlePrint = () => window.print();

  const DataRow = ({ label, value, isBold = false }) => (
    <tr className="border-b-[1px] border-gray-100">
      <td className="py-[3px] px-[8px] text-[#333] print:text-[12px] text-[13px] w-[40%] font-normal ">
        {label}
      </td>
      <td className={`py-[3px] px-[8px] text-[#000] border-l-[1px] border-gray-100 print:text-[10px] text-[13px]  ${isBold ? 'font-bold' : 'font-normal'}`}>
        {value || ''}
      </td>
    </tr>
  );

  const SectionHeader = ({ title }) => (
    <tr>
      <td colSpan="2" className=" py-[4px] px-[8px] print:text-[13px] border-b-[1px] border-gray-100 text-[14px] font-bold text-[#000]">
        {title}
      </td>
    </tr>
  );

  if (loading) return <div className="flex justify-center items-center min-h-screen"><ApertureLoader /></div>;
  if (error || !data) return <div className="text-center p-10 text-red-500">{error || 'Data Not Found'}</div>;

  return (
    <div className=" min-h-screen py-4 print:p-0 print:bg-white">
      {/* Action Toolbar */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-center print:hidden px-2">
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 bg-emerald-700 cursor-pointer text-white px-6 py-2 rounded shadow-lg font-bold hover:bg-emerald-800 transition"
        >
          <Printer size={20}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Main A4 Document */}
      <div 
        className="bg-white mx-auto w-[210mm] h-[297mm] shadow-xl print:shadow-none print:m-0 print:border-none relative flex flex-col overflow-hidden" 
        id="printable-area"
      >
        
        {/* Top Header Section */}
        <div className="flex flex-col items-center pt-8 pb-4">
          <img 
            src="https://i.ibb.co.com/cXtpcfYq/66f4f2e6f3bae584205817.png" 
            alt="Gov Logo" 
            className="w-16 h-16 mb-1"
          />
          <div className="text-center leading-[1.8]">
            <h2 className="text-[15px] font-bold">বাংলাদেশ নির্বাচন কমিশন</h2>
            <h2 className="text-[15px] ">নির্বাচন কমিশন সচিবালয়</h2>
            <h2 className="text-[15px]">জাতীয় পরিচয় নিবন্ধন অনুবিভাগ</h2>
          </div>
        </div>

        {/* --- WIDTH ADJUSTED HERE (w-[82%]) --- */}
        <div className="w-[82%] mx-auto h-[1px] bg-gray-300 mb-3"></div>

        {/* Profile Image & Name Section - WIDTH ADJUSTED */}
        <div className="w-[82%] mx-auto bg-[#BBE6ED] flex flex-col items-center pt-3">
          <div className="w-[100px] h-[120px] rounded-[10px] shadow-md overflow-hidden bg-white mb-2">
            <img 
              src={data.photo || data.nidImage} 
              alt="User" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-full py-1 border-t border-gray-100 text-center ">
              <p className="font-semibold text-[14px] uppercase">{data.nameEnglish}</p>
          </div>
        </div>

        {/* Data Tables - WIDTH ADJUSTED */}
        <div className="w-[82%] mx-auto mt-2 bg-[#BBE6ED]">
          <table className="w-full border-collapse">
            <tbody>
              <SectionHeader title="জাতীয় পরিচিতি তথ্য" />
              <DataRow label="জাতীয় পরিচয় পত্র নম্বর" value={data.nationalId} />
              <DataRow label="পিন নম্বর" value={data.pinNumber} />
              <DataRow label="ফরম নম্বর" value={data.formNumber || ""} />
              <DataRow label="ভোটার নম্বর" value={data.voterNumber} />
              <DataRow label="ভোটার এলাকা" value={data.voterArea} />

              <SectionHeader title="ব্যক্তিগত তথ্য" />
              <DataRow label="নাম (বাংলা)" value={data.nameBangla} />
              <DataRow label="নাম (ইংরেজি)" value={data.nameEnglish} />
              <DataRow label="জন্ম তারিখ" value={data.birthDate} />
              <DataRow label="পিতার নাম" value={data.fatherName} />
              <DataRow label="মাতার নাম" value={data.motherName} />
              <DataRow label="স্বামী/স্ত্রীর নাম" value={data.spouseName || ""} />

              <SectionHeader title="অন্যান্য তথ্য" />
              <DataRow label="লিঙ্গ" value={data.gender === 'male' ? 'পুরুষ' : 'মহিলা'} />
              <DataRow label="শিক্ষাগত যোগ্যতা" value={data.education || ''} />
              <DataRow label="জন্মস্থান" value={data.birthPlace} />

              <SectionHeader title="বর্তমান ঠিকানা" />
              <tr className="border border-gray-100">
                <td colSpan="2" className="px-2 py-1.5 text-[13px] leading-tight">
                  {data.currentAddress}
                </td>
              </tr>

              <SectionHeader title="স্থায়ী ঠিকানা" />
              <tr className="border border-gray-100 ">
                <td colSpan="2" className="px-2 py-1.5 text-[13px] leading-tight">
                  {data.permanentAddress}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-auto pb-10 text-center">
          <p className="text-red-600 text-[11px] font-bold">
            উপরে প্রদর্শিত তথ্যসমূহ জাতীয় পরিচয়পত্র সংশ্লিষ্ট, ভোটার তালিকার সাথে সরাসরি সম্পর্কযুক্ত নয়।
          </p>
          <p className="text-black text-[10px] font-semibold">
            This is Software Generated Report From Bangladesh Election Commission, Signature & Seal Aren't Required.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { 
            size: A4; 
            margin: 0; 
          }
          body { 
            margin: 0;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .print-hidden { display: none !important; }
          #printable-area {
            width: 210mm !important;
            height: 297mm !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Servercopyprint3;