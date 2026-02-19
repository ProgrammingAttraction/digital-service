import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function TaxReturnAcknowledgementPrint() {
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
        const response = await api.get(`/api/user/tax-acknowledgement/receipt/${id}`);
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Acknowledgement certificate not found');
        }
      } catch (err) {
        setError('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificateData();
  }, [id]);

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

  // TIN Digits logic
  const tinDigits = (data.tinNumber || "462134435748").toString().replace(/\s/g, '').split('');

  return (
    <div className="bg-zinc-200 min-h-screen py-10 print:p-0 print:bg-white poppins-font">
      {/* Action Toolbar */}
      <div className="w-full flex justify-center mb-6 print:hidden">
        <div className="flex gap-4">
          <button 
            onClick={handlePrint} 
          className="flex items-center gap-2 bg-emerald-700 text-white px-8 py-3 rounded shadow-lg font-bold hover:bg-emerald-800 transition"
        >
          <Printer size={20}/> প্রিন্ট করুন
          </button>

        </div>
      </div>

      {/* Certificate Paper */}
      <div className="certificate-container bg-white mx-auto w-[210mm] min-h-[297mm] p-[10mm_20mm] shadow-2xl print:shadow-none relative text-[#222]">
        
        {/* Header Section */}
        <div className="relative flex flex-col items-center mb-4">
          <div className="absolute right-0 top-0">
            <img 
              src="https://i.ibb.co.com/MknKMQsn/Screenshot-2026-01-14-190519-removebg-preview.png" 
              alt="eReturn" 
              className="h-10 object-contain"
            />
          </div>

          <img 
            src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" 
            alt="Govt Logo" 
            className="h-20 w-20 mb-2"
          />

          <div className="text-center leading-tight">
            <h1 className="text-[15.5px] font-bold">Government of the People's Republic of Bangladesh</h1>
            <h2 className="text-[15.5px] font-bold">National Board of Revenue</h2>
            <h3 className="text-[14px] font-medium">(Income Tax Office)</h3>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h4 className="text-[15px] font-bold underline underline-offset-4 decoration-1">
            Acknowledgement Receipt/Certificate of Return of Income
          </h4>
          <p className="text-[15px] font-bold mt-2">
            Assessment Year: <span className="font-normal">{data.assessmentYear || '2025-2026'}</span>
          </p>
        </div>

        {/* Information Fields */}
        <div className="space-y-3.5 text-[14px]">
          <div className="flex">
            <span className="w-60 font-medium">Name of the Taxpayer:</span>
            <span className="font-bold uppercase">{data.taxpayerName || 'NAYMA JAHAN HAQUE'}</span>
          </div>

          <div className="flex">
            <span className="w-60 font-medium">NID / Passport No (if No NID):</span>
            <span className="font-normal">{data.nidNumber || '5109836808'}</span>
          </div>

          {/* TIN with boxes and individual gaps */}
          <div className="flex items-center">
            <span className="w-12 font-medium">TIN:</span>
            <div className="flex gap-2 ml-4">
              {tinDigits.map((digit, index) => (
                <div key={index} className="w-7 h-8 border border-black flex items-center justify-center font-bold text-[14.5px]">
                  {digit}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between max-w-[98%] pt-1">
            <div className="flex">
              <span className="mr-2 font-medium">Circle:</span>
              <span className="font-normal">{data.circle || 'Circle-02 (Noakhali Sadar)'}</span>
            </div>
            <div className="flex">
              <span className="mr-2 font-medium">Taxes Zone:</span>
              <span className="font-normal">{data.taxZone || 'Noakhali'}</span>
            </div>
          </div>
        </div>

        {/* Financial Section */}
        <div className="mt-7 space-y-2 text-[14px]">
          <div className="flex">
            <span className="w-52">Total Income Shown:</span>
            <span className="font-normal">{Number(data.totalIncome || 240000).toLocaleString('en-IN')} Taka</span>
          </div>
          <div className="flex">
            <span className="w-52">Total Tax Paid:</span>
            <span className="font-normal">{Number(data.totalTaxPaid || 0).toLocaleString('en-IN')} Taka</span>
          </div>
        </div>

        {/* Register Table */}
        <div className="mt-7">
          <table className="w-full border-collapse border border-gray-600 text-[14px]">
            <tbody>
              <tr>
                <td className="border border-gray-600 px-3 py-2 w-2/3">Serial No. of Return Register</td>
                <td className="border border-gray-600 px-3 py-2 text-center font-medium">
                  {data.returnRegisterSerialNo || '8365264892'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-600 px-3 py-2">Volume No. of Return Register</td>
                <td className="border border-gray-600 px-3 py-2 text-center font-medium">
                  {data.returnRegisterVolumeNo || ''}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-600 px-3 py-2">Date of Return Submission</td>
                <td className="border border-gray-600 px-3 py-2 text-center font-medium">
                  {data.returnSubmissionDate || '15/01/2026'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Seals/Signatures */}
        <div className="mt-20 flex justify-between px-4">
          <div className="text-center">
            <div className="h-20 w-20 flex items-center justify-center text-[12px] text-gray-400 mb-1">
              {/* Optional space for Seal image */}
            </div>
            <p className="text-[13px] text-gray-700">Seal of Tax Office</p>
          </div>
          <div className="text-center">
            <div className="h-20 mb-1"></div>
            <div className="pt-1 w-64">
              <p className="text-[12px] text-left leading-tight">
                Signature and Seal of the Official Receiving the Return
              </p>
            </div>
          </div>
        </div>

        {/* QR Section */}
        <div className="mt-12 flex flex-col items-center">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://api.etaxnbr.gov.bd/filingservice/v3/api/verify-psr?tin=${data.receiptId}6`} 
            alt="Verification QR" 
            className="w-24 h-24 mb-6"
          />
          <p className="text-[14px] font-bold italic mb-8">System generated document. No signature required.</p>
        </div>

        {/* Verification Link */}
        <div className="absolute bottom-12 left-0 right-0 text-center">
          <p className="text-[13px]">
            Please Visit: <span className="font-bold">"https://etaxnbr.gov.bd"</span> website to get Income Tax Certificate in Online
          </p>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        .poppins-font {
          font-family: 'Poppins', sans-serif;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .certificate-container {
            width: 210mm;
            height: 297mm;
            padding: 10mm 20mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default TaxReturnAcknowledgementPrint;