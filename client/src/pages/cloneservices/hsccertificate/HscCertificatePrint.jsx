import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function HscCertificatePrint() {
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

  // Helper function to format MongoDB $date objects or ISO strings
  const formatDate = (dateObj) => {
    if (!dateObj) return 'N/A';
    // Handle both { $date: "..." } and raw ISO strings
    const dateStr = dateObj.$date || dateObj;
    const date = new Date(dateStr);
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        setLoading(true);
        let response;
        if (id && id.startsWith('HSC')) {
          response = await api.get(`/api/user/hsc-certificate/receipt/${id}`);
        } else {
          response = await api.get(`/api/user/hsc-certificate/${id}`);
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
useEffect(() => {
  if (data) {
    const title = `HSC_Certificate_${data.rollNo || data.registrationNo || id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data, id]);
  const handlePrint = () => window.print();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <ApertureLoader />
      <p className="mt-4 text-gray-600 font-medium italic">Generating Official Document...</p>
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
    <div className="bg-zinc-200 min-h-screen py-5 print:p-0 print:bg-white flex flex-col items-center">
      {/* Action Toolbar */}
      <div className="w-full max-w-[297mm] flex justify-center mb-4 px-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-emerald-700 cursor-pointer text-white px-6 py-3 rounded shadow font-bold hover:bg-emerald-800 transition text-lg"
        >
          <Printer size={20}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Certificate Wrapper (Landscape) */}
      <div className="certificate-container relative bg-white w-[297mm] h-[210mm] shadow-2xl print:shadow-none overflow-hidden certificate-paper print:m-0 print:fixed print:top-0 print:left-0">
        
        {/* Background Frame */}
        <img 
          src="https://i.ibb.co.com/pjmN6R95/Screenshot-2026-01-14-193846-removebg-preview.png" 
          className="absolute inset-0 w-full h-full object-fill z-0" 
          alt="Frame" 
        />
        
        {/* Content Layer */}
        <div className="relative z-10 h-full w-full flex flex-col px-[90px] py-[40px] text-slate-900">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-[26px] font-extrabold tracking-tight uppercase font-serif leading-none">
              BOARD OF INTERMEDIATE AND SECONDARY EDUCATION, {data.board || 'DHAKA'}
            </h1>
            <h2 className="text-[21px] font-extrabold tracking-[4px] uppercase font-serif mt-1">
              BANGLADESH
            </h2>
          </div>

          <div className='flex justify-between items-center mt-2'>
            <div className="font-semibold">
              <p>Serial No. DBH <span className="text-[#8B2323] font-bold font-serif text-[20px] ml-1">{data.serialNo?.replace('DBH ', '')}</span></p>
              <p className="text-[15px]">DBHSC : <span className="font-bold">{data.dbhscNo}</span></p>
            </div>

            <div className="flex justify-center my-1">
              <img 
                src="https://i.ibb.co.com/wFFm03FQ/Screenshot-2026-01-14-192809-removebg-preview.png" 
                alt="Gov Logo" 
                className="h-[100px] object-contain" 
              />
            </div>

            <div className="font-serif font-semibold text-right">
              <p>Registration No. <span className="font-bold border-b-2 border-slate-600 px-2 text-[17px]">{data.registrationNo}</span></p>
            </div>
          </div>
            
          <div className="mt-1 text-center">
            <h3 className="text-[20px] font-bold uppercase italic font-serif inline-block border-b-2 border-slate-700 leading-tight">
              HIGHER SECONDARY CERTIFICATE EXAMINATION, {data.examinationYear}
            </h3>
          </div>

          {/* Main Body */}
          <div className="mt-4 text-[20px] leading-[2.2] font-serif font-medium">
            <p className="italic flex items-end">
              <span className="whitespace-nowrap">This is to Certify that</span> 
              <span className="field-text font-bold text-[23px] ml-2 border-b-2 border-gray-200 flex-1 px-2 not-italic leading-none pb-1 uppercase">
                {data.studentName}
              </span>
            </p>
            
            <p className="italic flex items-end">
              <span className="whitespace-nowrap">Son / Daughter of</span> 
              <span className="field-text font-bold text-[20px] ml-2 border-b-2 border-gray-200 flex-1 px-2 not-italic leading-none pb-1 uppercase">
                {data.fatherName}
              </span>
            </p>

            <p className="italic flex items-end">
              <span className="whitespace-nowrap">and</span> 
              <span className="field-text font-bold text-[20px] ml-2 border-b-2 border-gray-200 flex-1 px-2 not-italic leading-none pb-1 uppercase">
                {data.motherName}
              </span>
            </p>

            <p className="italic flex items-end">
              <span className="whitespace-nowrap">of</span> 
              <span className="field-text font-bold text-[20px] ml-2 border-b-2 border-gray-100 flex-1 px-2 not-italic leading-none pb-1 uppercase">
                {data.collegeName || data.schoolName}
              </span>
            </p>

            <p className="italic flex items-end">
              <span className="whitespace-nowrap">bearing Roll</span> 
              <span className="not-italic font-extrabold border-b-2 border-gray-200 px-5 mx-1">{data.rollNo}</span> 
              <span className="whitespace-nowrap mx-1">No.</span> 
              <span className="not-italic font-extrabold border-b-2 border-gray-200 px-7 mx-1">{data.centerCode || '420121'}</span>
              <span className="whitespace-nowrap flex-1">duly passed the</span>
            </p>

            <p className="italic">
              Higher Secondary Certificate (HSC) Examination in 
              <span className="not-italic font-extrabold border-b-2 border-gray-200 px-6 mx-1 uppercase">{data.group}</span> 
              group and secured 
              G.P.A <span className="not-italic font-extrabold text-[23px] border-b-2 border-gray-200 px-5 mx-1">{data.gpa}</span> on a scale of 5.00.
            </p>
          </div>

          {/* Date of Birth */}
          <div className="mt-5">
            <p className="text-[19px] italic font-serif font-medium">
              His/Her date of birth as recorded in his / her registration card is 
              <span className="field-text font-bold text-[19px] border-b-2 border-gray-200 ml-3 px-3 not-italic uppercase">
                {data.birthDateInWords}
              </span>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-auto flex justify-between items-end pb-12 font-serif">
            <div className="text-left font-semibold">
              <p className="font-bold text-[19px]">{data.board || 'Dhaka'}</p>
              <p className="text-[14px]">
                Date of Publication of Results : 
                <span className="font-bold italic ml-1">
                    {formatDate(data.resultPublicationDate)}
                </span>
              </p>
            </div>
            
            <div className="text-center">
               <div className="relative mb-0">
                  <p className="font-signature text-[34px] text-blue-900 -rotate-2 select-none h-10">
                    M. Shamim
                  </p>
               </div>
               <div className="border-t-2 border-slate-800 pt-1 w-[240px]">
                    <p className="font-bold text-[14px] text-nowrap italic uppercase">Controller of Examinations</p>
               </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600&family=Great+Vibes&display=swap');

        .font-serif { font-family: 'EB Garamond', serif; }
        .field-text { font-family: 'EB Garamond', serif; }
        .font-signature { font-family: 'Great Vibes', cursive; }

        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .certificate-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 297mm !important;
            height: 210mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            visibility: visible !important;
          }

          img {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

export default HscCertificatePrint;