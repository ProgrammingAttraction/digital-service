import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function NagorikSonodPrint() {
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
        if (id && id.startsWith('NGS')) {
          response = await api.get(`/api/user/nagorik-sonod/receipt/${id}`);
        } else {
          response = await api.get(`/api/user/nagorik-sonod/${id}`);
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
    const title = `নাগরিকত্ব_সনদ_${data.certificateNo || data.nidNumber || id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data, id]);
  const handlePrint = () => window.print();
  const toBn = (n) => n?.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <ApertureLoader />
      <p className="mt-4 text-gray-600 font-medium font-sans">সনদ তৈরি হচ্ছে...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans">
      <p className="text-red-500 font-bold">{error || 'Something went wrong'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded">
        <ArrowLeft size={18} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="bg-zinc-200 min-h-screen py-4 print:p-0 print:bg-white flex flex-col items-center">
      <div className="w-full flex justify-center mb-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-2 rounded shadow font-bold hover:bg-emerald-800 transition text-lg font-sans"
        >
          <Printer size={20}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Main Certificate Container */}
      <div className="certificate-container bg-white w-[210mm] h-[297mm] relative box-border overflow-hidden font-bengali">
        
        {/* The Dotted Border Frame (Handled via CSS below) */}

        {/* Inner Content Area - Adjusted padding to prevent overflow */}
        <div className="inner-box relative h-[calc(100%-60px)] m-[30px] border border-gray-400 p-6 flex flex-col box-border">
          
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none z-0">
            <img src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" alt="watermark" className="w-[350px]" />
          </div>

          {/* Header - Scaled down font sizes */}
          <div className="relative z-10 text-center">
            <div className="absolute left-0 top-0">
              <img src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" alt="Govt Logo" className="w-16 h-16" />
            </div>
            
            <p className="text-[12px] font-medium text-red-600">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</p>
            <h1 className="text-[28px] font-bold text-black mt-0">{data.municipalityName} ইউনিয়ন পরিষদ</h1>
            <p className="text-[13px] font-semibold">ডাক: {data.postOffice}, উপজেলা: {data.upazila}, জেলা: {data.district}</p>
            <p className="text-[12px]">ওয়েবসাইট : https://amarnothi.com</p>
            <p className="text-[12px]">ইমেইল : {data.municipalityEmail}</p>

            <div className="mt-4 flex justify-center">
                <div className="inline-block border-b-2 border-black px-4 pb-0.5">
                    <h2 className="text-[22px] font-bold text-red-600">নাগরিকত্ব সনদ</h2>
                </div>
            </div>
          </div>

          {/* Certificate Number Box */}
          <div className="mt-6 z-10">
            <div className="flex items-center">
                <span className="text-[15px] font-bold mr-2">সনদ নং-</span>
                <div className="flex border border-black">
                    {data.certificateNo?.split('').map((char, i) => (
                        <div key={i} className="w-6 h-7 border-r border-black last:border-r-0 flex items-center justify-center font-bold text-[14px]">
                            {toBn(char)}
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Main Body - Font size 18px to 16px to save space */}
          <div className="mt-6 z-10 text-[16px] space-y-2 leading-relaxed">
            <p className="mb-2">এই মর্মে প্রত্যায়ন পত্র প্রদান করা যাচ্ছে যে,</p>
            
            <div className="grid grid-cols-[160px_20px_1fr] items-center">
                <span className="font-medium">নাম</span><span>:</span><span className="">{data.name}</span>
            </div>
            <div className="grid grid-cols-[160px_20px_1fr] items-center">
                <span className="font-medium">পিতার নাম</span><span>:</span><span className="">{data.fatherName}</span>
            </div>
            <div className="grid grid-cols-[160px_20px_1fr] items-center">
                <span className="font-medium">মাতার নাম</span><span>:</span><span className="">{data.motherName}</span>
            </div>
            <div className="grid grid-cols-[160px_20px_1fr] items-center">
                <span className="font-medium">স্বামীর নাম</span><span>:</span><span>{data.spouseName }</span>
            </div>
            <div className="grid grid-cols-[160px_20px_1fr] items-start">
                <span className="font-medium">ঠিকানা</span><span>:</span><span>গ্রাম: {data.villageArea}, ব্রজেন্দ্রগঞ্জ-৩০৪০, শাল্লা, সুনামগঞ্জ</span>
            </div>
            <div className="grid grid-cols-[160px_20px_1fr] items-center">
                <span className="font-medium">ওয়ার্ড নং</span><span>:</span><span>{toBn(data.wardNo || '০১')}</span>
            </div>
            <div className="grid grid-cols-[160px_20px_1fr] items-center">
                <span className="font-medium">এনআইডি নম্বর</span><span>:</span><span>{toBn(data.nidNumber)}</span>
            </div>
            <div className="grid grid-cols-[160px_20px_1fr] items-center">
                <span className="font-medium">জন্ম তারিখ</span><span>:</span><span>{toBn(data.birthDate)}</span>
            </div>
            <div className="grid grid-cols-[160px_20px_1fr] items-center">
                <span className="font-medium">ইস্যু তারিখ</span><span>:</span><span>{toBn(data.issueDate)}</span>
            </div>

            <p className="mt-6">
                অত্র ইউনিয়নের একজন স্থায়ী বাসিন্দা। তিনি জন্মগতভাবে বাংলাদেশী এবং আমার পরিচিত। 
                আমি তাহার সর্বাঙ্গীন মঙ্গল ও উন্নতি কামনা করি।
            </p>
          </div>

          {/* Bottom section forced to bottom */}
          <div className="mt-auto z-10">
            <div className="flex justify-end mb-6">
                <div className="text-center">
                    <div className="w-40 border-t border-black pt-1 font-bold text-[14px]">চেয়ারম্যান স্বাক্ষর</div>
                </div>
            </div>

            {/* Instruction Box - Compacted */}
            <div className="border-t border-black pt-2 flex items-center justify-between">
                <div className="flex gap-4 ">
                  <div className="bg-white">
   <img 
  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `Name: ${data.name}\nNID: ${data.nidNumber}\nCertificate No: ${data.certificateNo}`
  )}`} 
  alt="QR Code" 
  className="w-[110px]"
/>
                  </div>
                  <div className="text-[14px] space-y-0.5 leading-tight">
                      <p className="font-bold underline">নির্দেশাবলী:</p>
                      <p>১) সার্টিফিকেট টি ১৬ ডিজিটের সনদ নাম্বার দিয়ে ওয়েবসাইট থেকে যাচাই করুন অথবা QR code টি Scan করুন</p>
                      <p>২) যে কোন ধরনের তথ্য নেওয়ার জন্য ইমেইল করুন।</p>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
   <style>{`
        /* Importing Kalpurush style font */
        @import url('https://fonts.cdnfonts.com/css/kalpurush');
        
        .font-kalpurush {
          font-family: 'Kalpurush', 'SutonnyMJ', Arial, sans-serif;
        }

        .certificate-container {
            padding: 0;
            background-color: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        /* Border with decorative circles as seen in image */
        .certificate-container::before {
            content: "";
            position: absolute;
            top: 10px; left: 10px; right: 10px; bottom: 10px;
            pointer-events: none;
        }

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; -webkit-print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .bg-zinc-200 { background-color: white !important; }
          .certificate-container { 
            box-shadow: none !important; 
            margin: 0 !important;
            width: 210mm; 
            height: 297mm;
          }
        }
      `}</style>
    </div>
  );
}

export default NagorikSonodPrint;