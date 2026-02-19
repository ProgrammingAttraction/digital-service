import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Birthcertificateprint() {
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
        if (id && id.startsWith('ABTH')) {
          response = await api.get(`/api/user/users/birth-certificate/receipt/${id}`);
        } else {
          response = await api.get(`/api/user/users/birth-certificate/${id}`);
        }

        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('Certificate not found');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateData();
  }, [id]);

  // Automatically trigger print when data is loaded
  useEffect(() => {
    if (!loading && data) {
      // Small timeout ensures the DOM is fully rendered before printing
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, data]);
useEffect(() => {
    if (data) {
      const title = `Birth_Certificate_${id}`;
      document.title = title;
    }
    // Reset title when leaving the page
    return () => { document.title = "Digital Service"; };
  }, [data,id]);
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const dateStr = typeof dateString === 'object' ? dateString.$date || dateString : dateString;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        const parts = dateString.split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts;
          const newDate = new Date(year, month - 1, day);
          if (!isNaN(newDate.getTime())) {
            return `${newDate.getDate().toString().padStart(2, '0')}/${(newDate.getMonth() + 1).toString().padStart(2, '0')}/${newDate.getFullYear()}`;
          }
        }
        return dateString;
      }
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    } catch (error) {
      return dateString;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-poppins">
      <ApertureLoader />
      <p className="mt-4 text-gray-600 font-medium">Generating Document...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center font-poppins">
      <p className="text-red-500 font-bold">{error || 'Something went wrong'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded cursor-pointer hover:bg-gray-700 transition">
        <ArrowLeft size={18} /> Go Back
      </button>
    </div>
  );

  const getQRCodeUrl = () => data.qrLink || `https://bdris.gov.bd/certificate/verify?key=${data.birthRegistrationNumber || data.ubrn || ''}`;

  return (
    <div className="bg-zinc-200 min-h-screen py-8 print:p-0 print:bg-white font-poppins">
      <div className="bg-white mx-auto w-[210mm] h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-[210mm] print:h-[297mm] text-black relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-[0.25] pointer-events-none" style={{ backgroundImage: `url('https://i.ibb.co.com/3ysZXc6g/64e001976c30d173726388.png')`, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', backgroundSize: '500px' }} />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="w-[110px]">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(getQRCodeUrl())}`} alt="QR" className="w-28 h-28 p-1 bg-white" />
              <p className="text-[15px] text-center text-gray-500 mt-1 font-medium tracking-[2px]">DZIH</p>
            </div>

            <div className="text-center flex-1 px-2">
              <img src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" alt="Logo" className="w-16 mx-auto mb-1" />
              <h1 className="text-[17px] mb-[2px] font-bold leading-tight text-nowrap">Government of the People's Republic of Bangladesh</h1>
              <h2 className="text-[15px] mt-[8px] leading-tight">Office of the Registrar, Birth and Death Registration</h2>
              <p className="text-[15px] mt-[8px]">{data.registerOfficeAddress || "Joyka Union Parishad"}</p>
              <p className="text-[15px] mt-[8px] ">{data.permanentAddressEnglish?.split(',').slice(-2).join(', ') || "Karimganj, Kishoreganj"}</p>
              <p className="text-[14px] mt-1">(Rule 9, 10)</p>
            </div>

            <div className="flex flex-col items-end pt-2">
              <img src={`https://barcode.tec-it.com/barcode.ashx?data=${data.leftBarcode || data.birthRegistrationNumber || ''}&code=Code128&dpi=96`} alt="Barcode" className="w-[130px] h-10 " />
            </div>
          </div>

          <div className="text-center my-6">
            <h3 className="text-[17px] font-semibold inline-block pb-1 px-4">জন্ম নিবন্ধন সনদ / Birth Registration Certificate</h3>
          </div>

          <div className="grid grid-cols-3 gap-0 mb-8 mt-4 py-3 ">
            <div className='text-gray-700'>
              <p className="text-[13px] font-semibold tracking-tighter">Date of Registration</p>
              <p className="text-[14px] font-semibold">{formatDate(data.dateOfRegistration)}</p>
            </div>
            <div className="text-center ">
              <p className="text-[14px] font-normal tracking-tighter ">Birth Registration Number</p>
              <p className="text-[17px] font-semibold tracking-wider">{data.birthRegistrationNumber || 'N/A'}</p>
            </div>
            <div className="text-right text-gray-700">
              <p className="text-[13px] font-semibold tracking-tighter">Date of Issuance</p>
              <p className="text-[14px] font-semibold">{formatDate(data.dateOfIssuance)}</p>
            </div>
          </div>

          <div className="space-y-2 text-[14px]">
            {/* Date of Birth & Sex */}
            <div className="flex">
              <div className="w-1/2 flex">
                <span className="w-32">Date of Birth</span>
                <span className="mr-2">:</span>
                <span>{formatDate(data.dateOfBirth)}</span>
              </div>
              <div className="w-1/2 flex justify-end">
                <span className="mr-2">Sex</span>
                <span className="mr-2">:</span>
                <span className="w-20">{data.gender}</span>
              </div>
            </div>

            {/* In Word */}
            <div className="flex">
              <span className="w-32">In Word</span>
              <span className="mr-2">:</span>
              <span className="italic">{data.dateOfBirthInWords}</span>
            </div>

            {/* Name */}
            <div className="flex py-1 mt-[30px]">
              <div className="w-1/2 flex">
                <span className="w-32">নাম</span>
                <span className="mr-2">:</span>
                <span>{data.nameBangla}</span>
              </div>
              <div className="w-1/2 flex">
                <span className="w-32">Name</span>
                <span className="mr-2">:</span>
                <span>{data.nameEnglish}</span>
              </div>
            </div>

            {/* Mother */}
            <div className="flex py-1">
              <div className="w-1/2 flex">
                <span className="w-32">মাতা</span>
                <span className="mr-2">:</span>
                <span>{data.motherNameBangla}</span>
              </div>
              <div className="w-1/2 flex">
                <span className="w-32">Mother</span>
                <span className="mr-2">:</span>
                <span>{data.motherNameEnglish}</span>
              </div>
            </div>

            {/* Mother Nationality */}
            <div className="flex py-1">
              <div className="w-1/2 flex">
                <span className="w-32">মাতার জাতীয়তা</span>
                <span className="mr-2">:</span>
                <span>বাংলাদেশী</span>
              </div>
              <div className="w-1/2 flex">
                <span className="w-32">Nationality</span>
                <span className="mr-2">:</span>
                <span>Bangladeshi</span>
              </div>
            </div>

            {/* Father */}
            <div className="flex py-1">
              <div className="w-1/2 flex">
                <span className="w-32">পিতা</span>
                <span className="mr-2">:</span>
                <span>{data.fatherNameBangla}</span>
              </div>
              <div className="w-1/2 flex">
                <span className="w-32">Father</span>
                <span className="mr-2">:</span>
                <span>{data.fatherNameEnglish}</span>
              </div>
            </div>

            {/* Father Nationality */}
            <div className="flex py-1">
              <div className="w-1/2 flex">
                <span className="w-32">পিতার জাতীয়তা</span>
                <span className="mr-2">:</span>
                <span>বাংলাদেশী</span>
              </div>
              <div className="w-1/2 flex">
                <span className="w-32">Nationality</span>
                <span className="mr-2">:</span>
                <span>Bangladeshi</span>
              </div>
            </div>

            {/* Birth Place */}
            <div className="flex py-1">
              <div className="w-1/2 flex">
                <span className="w-32">জন্মস্থান</span>
                <span className="mr-2">:</span>
                <span>{data.birthPlaceBangla}</span>
              </div>
              <div className="w-1/2 flex">
                <span className="w-32">Place of Birth</span>
                <span className="mr-2">:</span>
                <span>{data.birthPlaceEnglish}</span>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="flex py-1">
              <div className="w-1/2 flex">
                <span className="w-32">স্থায়ী ঠিকানা</span>
                <span className="mr-2">:</span>
                <span className="pr-2">{data.permanentAddressBangla}</span>
              </div>
              <div className="w-1/2 flex">
                <span className="w-32">Permanent Address</span>
                <span className="mr-2">:</span>
                <span>{data.permanentAddressEnglish}</span>
              </div>
            </div>
          </div>

          <div className="mt-[160px] flex justify-between items-end px-6">
            <div className="text-center">
              <p className="text-[17px] ">Seal & Signature</p>
              <p className="text-[13px] font-medium">Assistant to Registrar</p>
              <p className="text-[14px] text-gray-600">(Preparation, Verification)</p>
            </div>
            <div className="text-center">
              <p className="text-[17px]">Seal & Signature</p>
              <p className="text-[14px] ">Registrar</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 left-0 right-0 text-center">
          <p className="text-[10px] text-gray-700  pt-4 mx-16">
            This certificate is generated from bdris.gov.bd, and to verify this certificate, please scan the above QR Code & Bar Code.
          </p>
        </div>
      </div>
<style>{`
        /* Import a standard Bengali font and Serif font */
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;700&display=swap');

        .font-certificate { 
            /* Priority: Times New Roman for English, Noto Serif for Bengali */
            font-family: 'Times New Roman', Times, 'Noto Serif Bengali', serif; 
        }

        @media print {
          @page { size: A4 portrait; margin: 0 !important; }
          html, body { height: 100%; margin: 0 !important; padding: 0 !important; overflow: hidden; }
          .print-hidden { display: none !important; }
          body { -webkit-print-color-adjust: exact; }
          .bg-white { background-color: white !important; -webkit-print-color-adjust: exact; box-shadow: none !important; }
          img { -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}

export default Birthcertificateprint;