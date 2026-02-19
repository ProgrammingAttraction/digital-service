import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Servercopyunofficial1() {
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
        const response = await api.get(`/api/user/server-copy-unofficial/${id}`);
        // Based on your JSON, we check for response.data.success or the nested extractedData.success
        console.log(response.data)
        if (response.data) {
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
  }, [id]);
useEffect(() => {
  if (data) {
    const title = `Unofficial_Server_Copy_${id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data]);

  const handlePrint = () => window.print();

  const DataRow = ({ label, value }) => (
    <tr className="border border-gray-300">
      <td className="py-[5px] px-2 text-black text-[14px] font-bold w-[30%] border-r border-gray-300 bg-white">
        {label}
      </td>
      <td className="py-[5px] px-2 text-black text-[14px] bg-white">
        {value || ''}
      </td>
    </tr>
  );

  const SectionHeader = ({ title }) => (
    <tr>
      <td colSpan="2" className="bg-[#bce6ec] py-[4px] px-2 text-[16px] font-bold text-black border border-gray-300">
        {title}
      </td>
    </tr>
  );

  if (loading) return <div className="flex justify-center items-center min-h-screen"><ApertureLoader /></div>;
  if (error || !data) return <div className="text-center p-10 text-red-500">{error || 'Data Not Found'}</div>;

  return (
    <div className="bg-zinc-100 min-h-screen py-4 print:p-0 print:bg-white">
      {/* Action Toolbar */}
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-center print:hidden">
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 bg-emerald-700 text-white px-8 py-2 rounded shadow-lg font-bold hover:bg-emerald-800 transition"
        >
          <Printer size={18}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Main A4 Document */}
      <div className="bg-white mx-auto w-[210mm] min-h-[297mm] px-[12mm] py-[3mm] shadow-2xl print:shadow-none print:m-0 relative">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-1">
          <img 
            src="https://i.ibb.co.com/cXtpcfYq/66f4f2e6f3bae584205817.png" 
            alt="Gov Logo" 
            className="w-16 h-16 mb-2"
          />
          <div className="text-center leading-snug">
            <h1 className="text-[17px] text-black">বাংলাদেশ নির্বাচন কমিশন</h1>
            <h2 className="text-[16px] text-black">নির্বাচন কমিশন সচিবালয়</h2>
            <h3 className="text-[16px] text-black">জাতীয় পরিচয় নিবন্ধন অনুবিভাগ</h3>
          </div>
        </div>

        <hr className="border-t border-gray-400 my-2" />

        {/* User Photo */}
        <div className="flex justify-center mb-6">
          <div className="rounded-sm shadow-2xl">
            <img 
              src={data.photo} 
              alt="User" 
              className="w-[110px] h-[125px] object-cover rounded-sm shadow-inner"
            />
          </div>
        </div>

        {/* Info Table */}
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            <SectionHeader title="জাতীয় পরিচিতি তথ্য" />
            <DataRow label="জাতীয় পরিচয় পত্র নম্বর" value={data.nationalId} />
            <DataRow label="পিন নম্বর" value={data.pinNumber} />
            <DataRow label="ভোটার নম্বর" value={data.oldNid} />
            <DataRow label="ভোটার এরিয়া" value={data.voterArea} />

            <SectionHeader title="ব্যক্তিগত তথ্য" />
            <DataRow label="নাম (বাংলা)" value={data.nameBangla} />
            <DataRow label="নাম (ইংরেজি)" value={data.nameEnglish} />
            <DataRow label="জন্ম তারিখ" value={data.birthDate} />
            <DataRow label="পিতার নাম" value={data.fatherName} />
            <DataRow label="মাতার নাম" value={data.motherName} />

            <SectionHeader title="অন্যান্য তথ্য" />
            <DataRow label="লিঙ্গ" value={data.gender} />
            <DataRow label="জন্মস্থান" value={data.birthPlace} />

            <SectionHeader title="বর্তমান ঠিকানা" />
            <tr className="border border-gray-300">
              <td colSpan="2" className="py-2 px-2 text-[14px] leading-normal border-gray-300 bg-white">
                {data.presentAddress?.addressLine || data.currentAddress}
              </td>
            </tr>

            <SectionHeader title="স্থায়ী ঠিকানা" />
            <tr className="border border-gray-300">
              <td colSpan="2" className="py-2 px-2 text-[14px] leading-normal border-gray-300 bg-white">
                {data.permanentAddress?.addressLine || data.permanentAddressLine}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer Info */}
        <div className="mt-3 text-center">
          <p className="text-red-600 text-[16px] font-medium">
            উপরে প্রদর্শিত তথ্যসমূহ জাতীয় পরিচয়পত্র সংশ্লিষ্ট, ভোটার তালিকার সাথে সরাসরি সম্পর্কযুক্ত নয়।
          </p>
          <p className="text-black text-[13px] font-semibold">
            This is Software Generated Report From Bangladesh Election Commission, Signature & Seal Aren't Required.
          </p>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}

export default Servercopyunofficial1;