import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function TaxReturnPrint() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
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
        const response = await api.get(`/api/user/tax-return/receipt/${id}`);
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Tax Return certificate not found');
        }
      } catch (err) {
        setError('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificateData();
  }, [id]);
useEffect(() => {
  if (data) {
    const title = `Tax_Return_Certificate_${data.tinNumber || data.referenceNo || id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data, id]);
  const handlePrint = () => window.print();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <ApertureLoader />
      <p className="mt-4 text-gray-600 font-medium">Generating Document...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="text-red-500 font-bold">{error || 'Something went wrong'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded">
        <ArrowLeft size={18} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="bg-zinc-100 min-h-screen py-10 print:p-0 print:bg-white overflow-x-hidden">
      {/* Action Toolbar */}
      <div className="w-full flex justify-center mb-6 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-emerald-700 text-white px-8 py-3 rounded shadow-lg font-bold hover:bg-emerald-800 transition"
        >
          <Printer size={20}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Certificate Paper */}
      <div className="certificate-container bg-white mx-auto w-[210mm] min-h-[297mm] p-[10mm_20mm] shadow-2xl print:shadow-none print:w-[210mm] print:h-[297mm] text-[#222] font-sans relative border border-gray-200 print:border-none ">
        
        {/* Top Right Logo & Ref */}
        <div className="flex flex-col items-end mb-2">
          <img 
            src="https://i.ibb.co.com/MknKMQsn/Screenshot-2026-01-14-190519-removebg-preview.png" 
            alt="eReturn" 
            className="h-10 object-contain"
          />
          <p className="text-[14px] mt-1 font-medium">Reference Number: {data.referenceNo}</p>
        </div>

        {/* Header Section */}
        <div className="text-center flex flex-col items-center mb-6">
          <img 
            src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" 
            alt="Gov Logo" 
            className="w-16 h-16 mb-2"
          />
          <div className="space-y-0.5">
            <h1 className="text-[16px] font-normal">Government of the People's Republic of Bangladesh</h1>
            <h2 className="text-[16px] font-normal">National Board of Revenue</h2>
            <h3 className="text-[16px] font-normal">Income Tax Department</h3>
            
            <div className="pt-4">
              <h4 className="text-[16px] font-normal">Income Tax Certificate</h4>
              <p className="text-[16px]">Assessment Year: {data.assessmentYear || '2025-2026'}</p>
            </div>
          </div>
        </div>

        {/* Data Grid Section */}
        <div className="space-y-2.5 mt-6 text-[15px]">
          {[
            { label: "Taxpayer's Name", value: data.taxpayerName || "Md. Ruhul Amin" },
            { label: "Taxpayer's Identification Number (TIN)", value: data.tinNumber || "532101871952" },
            { label: "Father's Name", value: data.fathersName || "Md. Hasan Ali" },
            { label: "Mother's Name", value: data.mothersName || "Rabiya Begum" },
            { label: "Current Address", value: data.currentAddress || "House# 04, Road# 18, Block# B, Bauniabandh, Mirpur, Section-11, Pallabi, Dhaka-1216., Pallabi, Dhaka" },
            { label: "Permanent Address", value: data.permanentAddress || "House# 04, Road# 18, Block# B, Bauniabandh, Mirpur, Section-11, Pallabi, Dhaka-1216., Pallabi, Dhaka" },
            { label: "Status", value:"Individual -> Bangladeshi -> Having NID" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-start">
              <div className="w-[300px] flex-shrink-0">{item.label}</div>
              <div className="w-[20px] text-center">:</div>
              <div className="flex-1 font-normal">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Summary Paragraph */}
        <div className="mt-10 text-[15px] leading-[1.6]">
          <p>
            This is to certify that <span className="font-medium">{data.taxpayerName || "Md. Ruhul Amin"}</span> is a registered taxpayer of Taxes Circle-{data.circle || '114'}, Taxes Zone-{data.taxZone || '06'}, Dhaka. The taxpayer has filed the return of income for the Assessment Year {data.assessmentYear || '2025-2026'}. Shown Total Income {data.totalIncome?.toLocaleString() || '3,20,000'} BDT and Paid Tax {data.totalTaxPaid || '0'} BDT.
          </p>
        </div>

        {/* QR Code - Pushed towards bottom but kept in one page */}
    {/* QR Code Section */}
<div className="flex-grow flex flex-col justify-center items-center mt-8">
  <div className="p-1 mb-2">
    <img 
      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
        `TIN:${data.tinNumber || '532101871952'}, Reference No:${data.referenceNo}`
      )}`} 
      alt="Verification QR" 
      className="w-24 h-24"
    />
  </div>
</div>

        {/* Footer */}
        <div className=" mb-4 mt-[40px] text-center">
          <p className="text-[14px]  text-gray-800">This is a system generated certificate, and requires no signature.</p>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body {
          font-family: 'Roboto', sans-serif;
          margin: 0;
          padding: 0;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          
          body {
            background: white;
            width: 210mm;
            height: 297mm;
          }

          .certificate-container {
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm 20mm !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-after: avoid;
            page-break-before: avoid;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default TaxReturnPrint;