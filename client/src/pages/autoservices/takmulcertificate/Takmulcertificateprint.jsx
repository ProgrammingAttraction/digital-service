import React, { useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';
import { QRCodeSVG } from 'qrcode.react';

function Takmulcertificateprint() {
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
        let response;
        if (id && (id.startsWith('TAK') || id.startsWith('POL'))) {
          response = await api.get(`/api/user/takmul-certificate/receipt/${id}`);
        } else {
          response = await api.get(`/api/user/takmul-certificate/${id}`);
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
    const title = `Takmul_Certificate_${data.certificateNumber || data.passportNumber || id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data, id]);
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><ApertureLoader /></div>;
  if (error || !data) return <div className="text-center p-10 text-red-500">{error}</div>;

  const getArabicWorkType = (work) => {
    const mapping = {
      'General Labor': 'عامل عادي',
      'Painting': 'الدهان',
      'Plumbing': 'سباك',
      'Electricity': 'كهربائي'
    };
    return mapping[work] || work;
  };

  const qrVerificationUrl = `https://pacc.sa`;

  return (
    <div className="bg-neutral-200 min-h-screen py-10 print:p-0 print:bg-white flex flex-col items-center">
      
      {/* Print Button Wrapper */}
      <div className="w-[297mm] mb-4 flex justify-center items-center print:hidden">
        <button 
          onClick={handlePrint}
      className="flex items-center gap-2 bg-emerald-700 cursor-pointer text-white px-6 py-3 rounded shadow font-bold hover:bg-emerald-800 transition text-lg"
            >
              <Printer size={20}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Main Certificate Container */}
      <div className='p-[15px]'>
        <div 
          id="certificate-container"
          className="certificate-container bg-white relative overflow-hidden shadow-2xl print:shadow-none"
        >
          {/* THE FIX: Pattern is now constrained by absolute positioning to match the border insets */}
          <div className="absolute inset-6 opacity-[0.18] pointer-events-none security-pattern overflow-hidden"></div>
          
          {/* Background Layer 2: Center Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
             <img 
               src="https://i.ibb.co.com/MkPRDcMb/images-removebg-preview.png" 
               alt="watermark" 
               className="w-[450px] grayscale" 
             />
          </div>

          {/* Double Gold Border */}
          <div className="absolute inset-5 border border-[#c5a059] pointer-events-none opacity-40"></div>
          <div className="absolute inset-6 border-[1.5px] border-[#c5a059] pointer-events-none opacity-60"></div>

          <div className="relative z-10 p-16 px-20 h-full flex flex-col">
            
            {/* Header Section */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img src="https://i.ibb.co.com/BHy6CGy9/unnamed-removebg-preview.png" alt="HRSD Logo" className="w-11" />
                <div className="text-[10px] font-bold text-[#2a5d5d] leading-tight">
                  Human Resources and<br />Social Development
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-[11px] font-bold text-[#2a5d5d] leading-tight text-right">
                  الاعتمـاد المهـنــي<br />
                  <span className="font-semibold text-[#5a8a8a] text-[9px]">Professional Accreditation</span>
                </div>
                <img src="https://i.ibb.co.com/MkPRDcMb/images-removebg-preview.png" alt="Accreditation Logo" className="w-14" />
              </div>
            </div>

            {/* Titles */}
            <div className="text-center mt-2 mb-10">
              <h1 className="arabic-font text-[30px] font-bold text-[#2d3e4e] mb-0.5">شهادة الاعتماد المهني</h1>
              <h2 className="text-[12px] font-bold text-[#4c5b6b] tracking-[0.2em] uppercase">Professional Accreditation Certificate</h2>
            </div>

            {/* Intro Text */}
            <div className="flex justify-between text-[11px] text-gray-600 font-medium px-4">
              <p className="w-[45%]">The Ministry of Human Resource and Social Development hereby certifies that</p>
              <p className="w-[45%] text-right arabic-font text-[15px]">تشهد وزارة الموارد البشرية والتنمية الاجتماعية بأن</p>
            </div>

            {/* User Information */}
            <div className="flex justify-between items-center mt-6 px-4">
              <div className="space-y-2 text-[13px]">
                <p><span className="text-gray-400 w-24 inline-block">Mr.:</span> <span className="font-bold text-gray-800 uppercase tracking-tight">{data.name}</span></p>
                <p><span className="text-gray-400 w-24 inline-block">Nationality:</span> <span className="font-bold text-gray-800">{data.nationality}</span></p>
                <p><span className="text-gray-400 w-24 inline-block">Passport No.:</span> <span className="font-bold text-gray-800 uppercase">{data.passportNumber}</span></p>
              </div>
              <div className="space-y-2 text-[13px] text-right arabic-font">
                <p><span className="font-bold text-gray-800">{data.name}</span> <span className="text-gray-400 w-24 inline-block">:السيد</span></p>
                <p><span className="font-bold text-gray-800">{data.nationality === 'Bangladesh' ? 'بنغلاديش' : data.nationality}</span> <span className="text-gray-400 w-24 inline-block">:الجنسية</span></p>
                <p><span className="font-bold text-gray-800">{data.passportNumber}</span> <span className="text-gray-400 w-24 inline-block">:رقم الجواز</span></p>
              </div>
            </div>

            {/* Verification Statement */}
            <div className="flex justify-between text-[11px] mt-8 px-4 text-gray-600">
              <p className="w-[48%] leading-relaxed">Has successfully passed the skills verification test, and his\her skills have been verified in the field of</p>
              <p className="w-[48%] text-right arabic-font text-[15px] leading-relaxed">قد اجتاز اختبار الفحص المهني وتم التحقق من مهاراته في مجال</p>
            </div>

            {/* Profession Display */}
            <div className="flex justify-between items-start mt-6 px-4">
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-800">{data.workType}</p>
                <p className="text-base font-bold text-gray-400 tracking-[0.2em] mt-0.5">1ZRWLCF</p>
              </div>
              <div className="text-right arabic-font">
                <p className="text-3xl font-bold text-gray-800">{getArabicWorkType(data.workType)}</p>
                <p className="text-base font-bold text-gray-400 tracking-[0.2em] mt-0.5">1ZRWLCF</p>
              </div>
            </div>

            {/* Success Message */}
            <div className="flex justify-between mt-12 px-4 text-[12px] font-bold text-gray-500">
              <p>Wishing you Continuous Success</p>
              <p className="arabic-font text-[15px]">مع تمنياتنا بدوام التوفيق والنجاح</p>
            </div>

            {/* Footer Area */}
            <div className="mt-auto flex px-4 justify-between items-end pb-4">
              <div className="w-[30%] space-y-0.5 text-[10px] font-bold text-gray-700">
                <p>Certificate Number: {data.certificateNumber}</p>
                <p>Issue Date: {data.issueDate}</p>
                <p>Expiry Date: {data.expiryDate}</p>
                <p className="text-[8px] text-gray-400 font-normal mt-3">Verify the validity of the certificate through QR code or on the platform pacc.sa</p>
              </div>

              <div className="w-[40%] flex justify-center items-center gap-6 mb-1">
                  <img src="https://i.ibb.co.com/S7NX569p/Screenshot-2026-01-14-013052-removebg-preview.png" alt="Seal" className="w-16" />
                  <div className="bg-white p-1">
                      <QRCodeSVG 
                        value={qrVerificationUrl} 
                        size={68} 
                        level="H" 
                        fgColor="#008374"
                      />
                  </div>
              </div>

              <div className="w-[30%] space-y-0.5 text-[10px] text-right arabic-font font-bold text-gray-700">
                <p>{data.certificateNumber} :رقم الشهادة</p>
                <p>{data.issueDate} :تاريخ الإصدار</p>
                <p>{data.expiryDate} :تاريخ الانتهاء</p>
                <p className="text-[8px] text-gray-400 font-normal mt-3">pacc.sa أو عبر المنصة QR بإمكانك التحقق من صحة الشهادة من خلال رمز الـ</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .arabic-font { font-family: 'Noto Naskh Arabic', serif; }
        
        .certificate-container {
          width: 297mm;
          height: 210mm;
          font-family: 'Inter', sans-serif;
          background-color: #fff;
          box-sizing: border-box;
          overflow: hidden; /* Added to ensure nothing goes outside the main box */
        }

        .security-pattern {
          /* Changed positioning to start inside the border */
          background-image: url("data:image/svg+xml,%3Csvg width='1200' height='800' viewBox='0 0 1200 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23777' stroke-width='0.5' stroke-opacity='0.5'%3E%3Ccircle cx='1400' cy='400' r='40'/%3E%3Ccircle cx='1400' cy='400' r='80'/%3E%3Ccircle cx='1400' cy='400' r='120'/%3E%3Ccircle cx='1400' cy='400' r='160'/%3E%3Ccircle cx='1400' cy='400' r='200'/%3E%3Ccircle cx='1400' cy='400' r='240'/%3E%3Ccircle cx='1400' cy='400' r='280'/%3E%3Ccircle cx='1400' cy='400' r='320'/%3E%3Ccircle cx='1400' cy='400' r='360'/%3E%3Ccircle cx='1400' cy='400' r='400'/%3E%3Ccircle cx='1400' cy='400' r='440'/%3E%3Ccircle cx='1400' cy='400' r='480'/%3E%3Ccircle cx='1400' cy='400' r='520'/%3E%3Ccircle cx='1400' cy='400' r='560'/%3E%3Ccircle cx='1400' cy='400' r='600'/%3E%3Ccircle cx='1400' cy='400' r='640'/%3E%3Ccircle cx='1400' cy='400' r='680'/%3E%3Ccircle cx='1400' cy='400' r='720'/%3E%3Ccircle cx='1400' cy='400' r='760'/%3E%3Ccircle cx='1400' cy='400' r='800'/%3E%3Ccircle cx='1400' cy='400' r='840'/%3E%3Ccircle cx='1400' cy='400' r='880'/%3E%3Ccircle cx='1400' cy='400' r='920'/%3E%3Ccircle cx='1400' cy='400' r='960'/%3E%3Ccircle cx='1400' cy='400' r='1000'/%3E%3Ccircle cx='1400' cy='400' r='1040'/%3E%3Ccircle cx='1400' cy='400' r='1080'/%3E%3Ccircle cx='1400' cy='400' r='1120'/%3E%3Ccircle cx='1400' cy='400' r='1160'/%3E%3Ccircle cx='1400' cy='400' r='1200'/%3E%3Ccircle cx='1400' cy='400' r='1240'/%3E%3Ccircle cx='1400' cy='400' r='1280'/%3E%3Ccircle cx='1400' cy='400' r='1320'/%3E%3Ccircle cx='1400' cy='400' r='1360'/%3E%3Ccircle cx='1400' cy='400' r='1400'/%3E%3Ccircle cx='1400' cy='400' r='1440'/%3E%3Ccircle cx='1400' cy='400' r='1480'/%3E%3Ccircle cx='1400' cy='400' r='1520'/%3E%3Ccircle cx='1400' cy='400' r='1560'/%3E%3Ccircle cx='1400' cy='400' r='1600'/%3E%3Ccircle cx='1400' cy='400' r='1640'/%3E%3Ccircle cx='1400' cy='400' r='1680'/%3E%3Ccircle cx='1400' cy='400' r='1720'/%3E%3Ccircle cx='1400' cy='400' r='1760'/%3E%3Ccircle cx='1400' cy='400' r='1800'/%3E%3Ccircle cx='1400' cy='400' r='1840'/%3E%3Ccircle cx='1400' cy='400' r='1880'/%3E%3Ccircle cx='1400' cy='400' r='1920'/%3E%3Ccircle cx='1400' cy='400' r='1960'/%3E%3Ccircle cx='1400' cy='400' r='2000'/%3E%3C/g%3E%3C/svg%3E");
          background-position: right center;
          background-repeat: no-repeat;
          background-size: cover;
        }

 @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body { 
            margin: 0; 
            padding: 0; 
            background: white !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          .certificate-container {
            width: 297mm;
            height: 210mm;
            border: none;
            box-shadow: none;
            position: absolute;
            top: 0;
            left: 0;
            margin: 0;
            padding: 0;
            page-break-after: avoid;
            overflow: hidden;
          }
        }
  }
      `}</style>
    </div>
  );
}

export default Takmulcertificateprint;