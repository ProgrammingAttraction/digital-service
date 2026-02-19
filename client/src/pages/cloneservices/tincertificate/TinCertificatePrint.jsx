import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function TinCertificatePrint() {
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
        if (id && id.startsWith('TIN')) {
          response = await api.get(`/api/user/tin-certificate/receipt/${id}`);
        } else {
          response = await api.get(`/api/user/tin-certificate/${id}`);
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
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')}, ${date.getFullYear()}`;
  };
useEffect(() => {
  if (data) {
    const title = `TIN_Certificate_${data.tinNumber || id}`;
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
    <div className="bg-zinc-200 min-h-screen py-10 print:p-0 print:bg-white">
      {/* Import Poppins Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; }
          .print-hidden { display: none !important; }
          .certificate-container { 
            margin: 0 !important; 
            box-shadow: none !important; 
            width: 210mm !important; 
            height: 297mm !important; 
          }
        }

        .gov-font {
          font-family: 'Poppins', sans-serif;
          color: #000;
        }

        .certificate-container {
          width: 210mm;
          height: 297mm;
          background-color: white;
          margin: 0 auto;
          padding: 12mm;
          box-sizing: border-box;
          position: relative;
        }

        .inner-border {
          border: 1px solid #000;
          outline: 3px double #000;
          outline-offset: -10px;
          height: 100%;
          width: 100%;
          padding: 30px 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .watermark {
          position: absolute;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 480px;
          opacity: 0.3;
          pointer-events: none;
          z-index: 0;
        }

        .ultra-thick-qr {
          image-rendering: pixelated;
          filter: drop-shadow(0.5px 0 0 #000) 
                  drop-shadow(-0.5px 0 0 #000) 
                  drop-shadow(0 0.5px 0 #000) 
                  drop-shadow(0 -0.5px 0 #000)
                  contrast(200%);
          mix-blend-mode: multiply;
        }
      `}</style>

      {/* Toolbar */}
      <div className="w-full flex justify-center mb-6 print:hidden">
        <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-700 text-white px-10 py-3 rounded-md shadow-lg font-bold hover:bg-emerald-800 transition">
          <Printer size={20}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Document Content */}
      <div className="certificate-container gov-font shadow-2xl">
        <div className="inner-border">
          
          <img 
            src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" 
            alt="watermark" 
            className="watermark"
          />

          <div className="relative z-10 text-center mb-6">
            <img 
              src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" 
              alt="Govt Logo" 
              className="w-24 h-24 mx-auto mb-2"
            />
            <h1 className="text-[18px] font-bold">Government of the People's Republic of Bangladesh</h1>
            <h2 className="text-[18px] font-bold">National Board of Revenue</h2>
            <h3 className="text-[17px] font-normal mt-5">Taxpayer's Identification Number (TIN) Certificate</h3>
            <div className="mt-4">
              <span className="text-[20px] font-bold border-b-2 border-black pb-0.5 tracking-wider">
                TIN : {data.tinNumber}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex-grow">
            <div className="mb-6 text-[15.5px] leading-relaxed">
              <p>
                This is to Certify that <span className="font-semibold">{data.name}</span> is a Registered Taxpayer of National Board of Revenue under the jurisdiction of <span className="font-semibold">Taxes Circle-{data.taxesCircle}, Taxes Zone {data.taxesZone}, {data.city}.</span>
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[16px] font-semibold mb-2">Taxpayer's Particulars :</h4>
              <ParticularRow label="1) Name" value={data.name} />
              <ParticularRow label="2) Father's Name" value={data.fatherName} />
              <ParticularRow label="3) Mother's Name" value={data.motherName} />
              <ParticularRow label="4.a) Current Address" value={data.currentAddress} />
              <ParticularRow label="4.b) Permanent Address" value={data.permanentAddress} />
              <ParticularRow label="5) Previous TIN" value={data.previousTin || "Not Applicable"} />
              <ParticularRow label="6) Status" value={data.taxpayerType || "Individual"} />
            </div>

            <div className="mt-10 text-[14px]">
              <p>Date : <span className="font-normal">{formatDate(data.issueDate)}</span></p>
            </div>
          </div>

          <div className="relative z-10 mt-auto">
            <div className="flex justify-between items-center gap-[25px]">
              {/* Left Side Note */}
              <div className="w-[32%]">
                <h5 className="text-[12px] font-semibold mb-1 underline">Please Note:</h5>
                <div className="text-[8px] space-y-1 leading-tight text-gray-900">
                  <p>1. A Taxpayer is liable to file the Return of Income under section 166 of the Income Tax Act, 2023.</p>
                  <p>2. Failure to file Return of Income under Section 166 is liable to-</p>
                  <p className="pl-3">(a) Penalty under section 266; and</p>
                  <p className="pl-3">(b) Prosecution under section 311 of the Income Tax Act, 2023.</p>
                </div>
              </div>

              {/* Ultra-Thick QR Code Container */}
   {/* Ultra-Thick QR Code Container */}
{/* Ultra-Thick QR Code Container */}
<div className="flex flex-col items-center justify-center flex-grow">
  {/* Added relative position here to anchor the NBR text */}
  <div className="bg-white overflow-hidden relative">
    <img 
      src={`https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(
        `Taxpayer's Name : ${data.name}\n` +
        `Father's Name : ${data.fatherName}\n` +
        `TIN : ${data.tinNumber}\n` +
        `Date : ${formatDate(data.issueDate)}\n` +
        `Zone : ${data.taxesZone}, ${data.city}\n` +
        `Circle : Circle-${data.taxesCircle}`
      )}&margin=0&ecc=H&format=png&color=000000`} 
      alt="QR" 
      className="w-48 h-48 ultra-thick-qr" 
    />
    
    {/* NBR Center Text overlay */}
    <div className="absolute top-1/2 left-1/2 flex justify-center items-center gap-[1px] -translate-x-1/2 -translate-y-1/2 rounded-sm">
      <div className="text-[10px] font-semibold text-white bg-red-600 leading-none select-none">
        N
      </div>
        <div className="text-[10px] font-semibold text-white bg-red-600 leading-none select-none">
        B
      </div>
        <div className="text-[10px] font-semibold text-white bg-red-600 leading-none select-none">
        R
      </div>
    </div>
  </div>
</div>
              {/* Right Side Signature Area */}
              <div className="w-[35%] text-[8px] text-left leading-tight">
                <p className="font-bold text-[8px] mb-1">Deputy Commissioner of Taxes</p>
                <p>Taxes Circle-{data.taxesCircle}</p>
                <p>Taxes Zone {data.taxesZone}, {data.city}</p>
                <p>Address : 209/A-B Shahid Syed Nazrul Islam Sharani,</p>
                <p>Purana Paltan, Dhaka-1000. Phone : 02-55112417</p>
              </div>
            </div>

            <div className="text-center mt-8">
              <p className="text-[8px] border-b border-gray-400 inline-block ">
                N. B: This is a system generated certificate and requires no manual signature.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ParticularRow({ label, value }) {
  return (
    <div className="flex items-start text-[14.5px] mb-[10px]">
      <div className="flex-shrink-0 font-normal">{label} </div>
      <div className='font-semibold mx-[4px]'>:</div>
      <div className="flex-grow font-semibold">{value}</div>
    </div>
  );
}

export default TinCertificatePrint;