import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function PoliceClearancePrint() {
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
        let response;
        if (id && id.startsWith('POL')) {
          response = await api.get(`/api/user/police-clearance/receipt/${id}`);
        } else {
          response = await api.get(`/api/user/police-clearance/${id}`);
        }

        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Certificate not found');
        }
      } catch (err) {
        setError('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateData();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };
// Add this page title effect after the above useEffect
useEffect(() => {
  if (data) {
    const title = `Police_Clearance_${data.referenceNo || data.passportNo || id}`;
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
    <div className="bg-zinc-200 min-h-screen py-8 print:p-0 print:bg-white">
      {/* Action Toolbar */}
      <div className="w-full flex justify-center items-center mx-auto mb-6 px-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-emerald-700 cursor-pointer text-white px-6 py-3 rounded shadow font-bold hover:bg-emerald-800 transition text-lg"
        >
          <Printer size={20}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Certificate Paper */}
      <div className="certificate-paper bg-white mx-auto w-[210mm] min-h-[297mm] p-[25mm] shadow-2xl print:shadow-none print:w-full print:p-[20mm] text-black relative">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-[18px] font-bold tracking-tight leading-[1.3] uppercase">
            GOVERNMENT OF THE PEOPLE'S REPUBLIC OF <br /> BANGLADESH
          </h1>
          <div className="pt-4 space-y-0.5">
            <p className="text-[14px] font-normal">{data.policeStation}</p>
            <p className="text-[14px] font-normal">{data.district}</p>
          </div>
        </div>

        {/* QR and Reference Row */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="w-28 h-28 p-1">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `Ref No: ${data.referenceNo}\nName: ${data.recipientName}\nPassport: ${data.passportNo}`
                )}`} 
                alt="QR Code" 
                className="w-full h-full"
              />
            </div>
            <p className="text-[15px] mt-2 text-gray-600">
              Ref No. <span className=" uppercase">{data.referenceNo}</span>
            </p>
          </div>
          
          <div className="text-right text-[15px]">
            <p>Dated: <span className=" uppercase">{formatDate(data.issueDate)}</span></p>
          </div>
        </div>

        {/* Document Title */}
        <div className="text-center mb-10">
          <h2 className="text-[16px] font-bold tracking-[0.05em] uppercase inline-block  pb-0.5">
            POLICE CLEARANCE CERTIFICATE
          </h2>
        </div>

        {/* Body Paragraph 1 */}
        <div className="text-[14px] leading-[1.7] text-justify mb-6 tracking-normal">
          <p>
            The character and antecedents of Mr. <span className="font-bold uppercase">{data?.recipientName}</span> Son of <span className="font-bold uppercase">{data.fatherName}</span> Village/ Area: <span className="font-bold uppercase">{data.villageArea}</span>, P/O: <span className="font-bold uppercase">{data.po}</span>, Post Code: <span className="font-bold uppercase">{data.postCode}</span>, P/S: <span className="font-bold uppercase">{data.psUpozila}</span>, District: <span className="font-bold uppercase">{data.district}</span> holder of Bangladesh International Passport No. <span className="font-bold uppercase">{data.passportNo}</span> Issued at <span className="font-bold uppercase">{data.issuePlace}</span> on <span className="font-bold uppercase">{formatDate(data.passportIssueDate || data.issueDate)}</span> have been verified and there is no adverse information against him/her on record.
          </p>
        </div>

        {/* Body Paragraph 2 */}
        <div className="text-[14px] leading-[1.7] text-justify mb-20">
          <p>
            This certificate is issued in pursuance of Ministry of Home Affairs Memo No. Nirdesh-2/75-Pt. 2152-Bohi(1), dated the 19th May, 1977.
          </p>
        </div>

        {/* Signature Section */}
        <div className="flex justify-between items-start mt-10">
          <div className="text-left w-[40%]">
            <div className="space-y-0 text-[16px] leading-tight">
              <p>Superintendent of Police</p>
              <p>District Special Branch {data.district}</p>
            </div>
          </div>
          
          <div className="text-center w-[20%]">
            <p className="text-[16px] font-medium italic">Seal.</p>
          </div>

          <div className="text-right w-[40%]">
            <div className="space-y-0 text-[16px] leading-tight">
              <p>Officer-in-Charge.</p>
              <p>{data.policeStation} Police Station.</p>
            </div>
          </div>
        </div>

        {/* Red Footer Note */}
        <div className="mt-[50px]   text-left w-full">
          <p className="text-red-500 italic text-[12px] leading-tight font-sans">
            This is a digital copy of the unsigned certificate issued by Bangladesh Police Online Police Clearance Management System. The printed original must contain seal and signature of the designated officials.
          </p>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&display=swap');

        .certificate-paper {
          font-family: 'Tinos', 'Times New Roman', Times, serif;
          color: #000000;
          -webkit-font-smoothing: antialiased;
        }

        .font-bold {
          font-weight: 700 !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: white !important;
            margin: 0;
          }
          .print-hidden {
            display: none !important;
          }
          .certificate-paper {
            box-shadow: none !important;
            width: 100% !important;
            height: 100vh !important;
            padding: 20mm !important;
          }
        }
      `}} />
    </div>
  );
}

export default PoliceClearancePrint;