import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Manualbirthcertificateprint() {
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
        if (id && (id.startsWith('BTH') || id.startsWith('DTH'))) {
          // If it's a receipt ID (starts with BTH or DTH)
          response = await api.get(`/api/user/birth-certificate/receipt/${id}`);
        } else {
          // If it's a MongoDB _id
          response = await api.get(`/api/user/birth-certificate/${id}`);
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

  const formatDate = (dateObj) => {
    if (!dateObj) return '';
    const dateString = dateObj.$date || dateObj;
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };
useEffect(() => {
  if (data) {
    const title = `Birth_Certificate_${data.birthRegistrationNumber || id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data, id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-poppins">
      <ApertureLoader />
      <p className="mt-4 text-gray-600 font-medium">Generating Document...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center font-poppins">
      <p className="text-red-500 font-bold">{error || 'Something went wrong'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded">
        <ArrowLeft size={18} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="bg-zinc-200 min-h-screen py-8 print:p-0 print:bg-white font-poppins">
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
      <div className="bg-white mx-auto w-[210mm] h-[297mm] p-[15mm] shadow-2xl print:shadow-none print:w-[210mm] print:h-[297mm] text-black relative overflow-hidden">
        
        {/* Watermark Logo */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.10] pointer-events-none"
          style={{
            backgroundImage: `url('https://i.ibb.co.com/3ysZXc6g/64e001976c30d173726388.png')`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '500px',
          }}
        />

        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex justify-between items-start mb-4">
            <div className="w-[110px]">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
                  `https://bdris.gov.bd/certificate/verify?key=${data.verificationKey || data.birthRegistrationNumber}`
                )}`} 
                alt="QR" 
                className="w-24 h-24 p-1 bg-white"
              />
              <p className="text-[13px] text-center text-gray-500 mt-1 font-medium tracking-[2px]">BVLS</p>
            </div>

            <div className="text-center flex-1 px-2">
              <img src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" alt="Logo" className="w-16 mx-auto mb-1" />
              <h1 className="text-[18px] mb-[2px] font-semibold leading-tight">{data.governmentHeader?.english || "Government of the People's Republic of Bangladesh"}</h1>
              <h2 className="text-[12px] font-semibold leading-tight">{data.officeOfRegistrar?.english || "Office of the Registrar of Births & Deaths"}</h2>
              <p className="text-[13px] font-medium">{data.unionParishad?.english || data.zoneCityCorporation?.english || "Zone - 6, Dhaka South City Corporation"}</p>
              <p className="text-[13px] font-medium">{data.upazila?.english || data.cityCorporation?.english || "Dhaka South City Corporation, Dhaka"}</p>
              <p className="text-[12px] italic mt-1">({data.rule?.english || "Under the Birth and Death Registration Act, 2004 (Act No. XXIX of 2004)"})</p>
            </div>

            <div className="w-[150px] flex flex-col items-end pt-2">
              <img src="https://i.ibb.co.com/LD38tb8Z/Screenshot-2026-01-17-021951.png" alt="Barcode" className="w-full h-11 object-contain" />
            </div>
          </div>

          {/* Certificate Title */}
          <div className="text-center my-6">
            <h3 className="text-[17px] font-bold inline-block pb-1 px-4">
              {data.certificateTitle?.bangla || "জন্ম নিবন্ধন সার্টিফিকেট"} / {data.certificateTitle?.english || "Birth Registration Certificate"}
            </h3>
          </div>

          {/* Top Info Grid */}
          <div className="grid grid-cols-3 gap-0 mb-8 mt-4 py-3">
            <div className="">
              <p className="text-[13px] font-medium tracking-tighter">Date of Registration</p>
              <p className="text-[14px] font-medium">{formatDate(data.dateOfRegistration)}</p>
            </div>
            <div className="px-2 text-center">
              <p className="text-[13px] font-medium tracking-tighter">Birth Registration Number</p>
              <p className="text-[16px] font-extrabold tracking-wider">{data.birthRegistrationNumber}</p>
            </div>
            <div className="px-2 text-right">
              <p className="text-[13px] text-gray-500 tracking-tighter">Date of Issuance</p>
              <p className="text-[14px]">{formatDate(data.dateOfIssuance)}</p>
            </div>
          </div>

          {/* Body Information */}
          <div className="space-y-4 text-[13px]">
            <div className="flex justify-between items-center pb-1">
              <div className="flex gap-4 w-1/2">
                <span className="font-semibold text-gray-600 w-32">Date of Birth:</span>
                <span className="font-medium">{formatDate(data.dateOfBirth)}</span>
              </div>
              <div className="flex gap-4 w-1/2 justify-end">
                <span className="font-semibold text-gray-600">Sex:</span>
                <span className="">{data.sex?.english || data.sex || "Male"}</span>
              </div>
            </div>

            {data.dateOfBirthInWords?.english && (
              <div className="flex gap-4 pb-1">
                <span className="font-semibold text-gray-600 w-32">In Word:</span>
                <span className="font-medium italic text-gray-800">{data.dateOfBirthInWords.english}</span>
              </div>
            )}

            {[
              { labelBn: "নাম", labelEn: "Name", value: data.name },
              { labelBn: "লিঙ্গ", labelEn: "Sex", value: data.sex },
              { labelBn: "মাতা", labelEn: "Mother", value: data.motherName },
              { labelBn: "মাতার জাতীয়তা", labelEn: "Nationality", value: data.motherNationality },
              { labelBn: "পিতা", labelEn: "Father", value: data.fatherName },
              { labelBn: "পিতার জাতীয়তা", labelEn: "Nationality", value: data.fatherNationality },
              { labelBn: "জন্মস্থান", labelEn: "Place of Birth", value: data.placeOfBirth },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-6 py-1.5">
                <div className="flex-1 flex gap-3">
                   <span className="font-bold w-28 text-gray-800">{row.labelBn}:</span>
                   <span className="flex-1 font-medium">{row.value?.bangla || row.value || 'N/A'}</span>
                </div>
                <div className="flex-1 flex gap-3 pl-4 ">
                   <span className="font-medium w-28 text-gray-800">{row.labelEn}:</span>
                   <span className="flex-1 font-medium">{row.value?.english || row.value || 'N/A'}</span>
                </div>
              </div>
            ))}
            
            {/* Permanent Address */}
            <div className="flex items-center gap-6 py-1.5">
              <div className="flex-1 flex gap-3">
                <span className="font-bold w-28 text-gray-800">স্থায়ী ঠিকানা:</span>
                <span className="flex-1 font-medium">{data.permanentAddress?.bangla || data.permanentAddress || 'N/A'}</span>
              </div>
              <div className="flex-1 flex gap-3 pl-4 ">
                <span className="font-medium w-28 text-gray-800">Permanent Address:</span>
                <span className="flex-1 font-medium">{data.permanentAddress?.english || data.permanentAddress || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="mt-16 flex justify-between items-end px-6">
            <div className="text-center">
              <div className="w-48 pt-2">
                <p className="text-[12px] font-medium">{data.sealSignature?.english || "Seal & Signature"}</p>
                <p className="text-[12px] font-bold">{data.assistantRegistrar?.english || "Assistant to Registrar"}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{data.preparationVerification?.english || "(Preparation, Verification)"}</p>
              </div>
            </div>
            
            <div className="text-center">
              <div className="w-48 pt-2">
                <p className="text-[12px] font-medium">{data.sealSignature?.english || "Seal & Signature"}</p>
                <p className="text-[12px] font-bold">{data.registrar?.english || "Registrar"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Locked Footer */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-[10px] text-gray-400 leading-tight pt-3 px-16">
            {data.verificationNote?.english || "This certificate is generated from bdris.gov.bd, and to verify this certificate, please scan the above QR Code & Bar Code."}
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          html, body {
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden;
          }
          .print-hidden {
            display: none !important;
          }
          /* This removes the date/URL/Page headers browsers add */
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}

export default Manualbirthcertificateprint;