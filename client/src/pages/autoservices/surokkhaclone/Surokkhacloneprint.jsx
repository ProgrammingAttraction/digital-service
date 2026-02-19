import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Surokkhacloneprint() {
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
        if (id && id.startsWith('SUR')) {
          response = await api.get(`/api/user/surokkha-certificate/certificate/${id}`);
        } else {
          response = await api.get(`/api/user/surokkha-certificate/${id}`);
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };

  const getVerificationUrl = () => {
    return `https://surokkha.gov.bdi.ink/user/surokkha/verify/${data?.id || id}`;
  };
  useEffect(() => {
  if (data) {
    const title = `Surokkha_Certificate_${data.certificateNo || data.nationalId || id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data, id]);
  const handlePrint = () => window.print();

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <ApertureLoader />
      <p className="mt-4 text-gray-600 font-medium font-sans">Generating Certificate...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <p className="text-red-500 font-bold font-sans">{error || 'Something went wrong'}</p>
      <button onClick={() => navigate(-1)} className="mt-4 flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded">
        <ArrowLeft size={18} /> Go Back
      </button>
    </div>
  );

  return (
    <div className="bg-gray-200 min-h-screen py-10 print:bg-white print:py-0 font-sans">
      {/* Top Bar */}
      <div className="w-full flex justify-center items-center mx-auto mb-6 print:hidden px-4">
        <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-700 cursor-pointer text-white px-6 py-3 rounded shadow font-bold hover:bg-emerald-800 transition text-lg">
          <Printer size={20}/> প্রিন্ট করুন
        </button>
      </div>

      <div className="print-container">
        {/* PAGE 1: FULL CERTIFICATE */}
        <div className="bg-white mx-auto w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl print:shadow-none page-break relative box-border mb-10 print:mb-0">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.08]">
              <img 
                  src="https://i.ibb.co.com/Dgtn1qGk/63d61499208d4420322991-removebg-preview.png" 
                  alt="watermark" 
                  className="w-[500px] h-auto" 
              />
          </div>

          <div className="border-[1px] border-gray-200 h-full relative min-h-[275mm] flex flex-col z-10 box-border">
            {/* Header Section */}
            <div className="flex pt-[15px] justify-between items-start px-4">
              <img src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" alt="Gov Logo" className="h-[70px] w-auto" />
              <div className="text-center flex-1 px-2 pt-2">
                <h1 className="text-[16px] font-bold text-gray-900 leading-tight uppercase">Government of the People's Republic of Bangladesh</h1>
                <h2 className="text-[14px] font-semibold text-gray-800">Ministry of Health and Family Welfare</h2>
              </div>
              <img src="https://i.ibb.co.com/VZdJcvs/images-2-removebg-preview.png" alt="Mujib 100" className="h-[70px] w-auto" />
            </div>

            <div className="flex justify-center mb-2 pt-[10px]">
              <div className="pb-1">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getVerificationUrl())}`} 
                  alt="QR" 
                  className="w-[150px] h-[150px]" 
                />
              </div>
            </div>

            <div className="text-center mb-0 py-[8px] border-t-[1px] border-gray-200">
              <h3 className="text-[15px] text-gray-900 uppercase">COVID-19 Vaccination Certificate</h3>
              <p className="text-[15px] font-medium text-gray-700 font-bengali">(কোভিড-১৯ ভ্যাকসিন গ্রহণের সার্টিফিকেট)</p>
            </div>

            <div className="grid grid-cols-2 border-l-0 border-t border-dotted border-gray-400">
              {/* Beneficiary Details Column */}
              <div className="border-r border-b border-dotted border-gray-400">
                <div className="bg-[#f8f9fa] p-2 border-b border-dotted border-gray-400">
                  <h4 className=" text-[12px]">Beneficiary Details <span className="font-normal font-bengali">(টিকা গ্রহণকারীর বিবরণ)</span></h4>
                </div>
                <div className="text-[11px]">
                  {[
                    { label: 'Certificate No', labelBn: 'সার্টিফিকেট নং', value: data.certificateNo },
                    { label: 'NID Number', labelBn: 'জাতীয় পরিচয় পত্র নং', value: data.nationalId },
                    { label: 'Passport No', labelBn: 'পাসপোর্ট নং', value: data.passportNo || 'N/A' },
                    { label: 'Nationality', labelBn: 'জাতীয়তা', value: data.nationality || 'Bangladeshi' },
                    { label: 'Name', labelBn: 'নাম', value: data.name },
                    { label: 'Date of Birth', labelBn: 'জন্ম তারিখ', value: formatDate(data.dateOfBirth) },
                    { label: 'Gender', labelBn: 'লিঙ্গ', value: data.gender },
                  ].map((item, idx) => (
                    <div key={idx} className="flex border-b border-dotted text-right border-gray-400 last:border-b-0">
                      <div className="w-1/2 p-1.5 border-r border-dotted border-gray-400">
                        <span>{item.label}: <br/><span className="text-[9px] font-bengali">{item.labelBn}:</span></span>
                      </div>
                      <div className="w-1/2 p-1.5 flex items-center">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vaccination Details Column */}
              <div className="border-b border-dotted border-gray-400">
                <div className="bg-[#f8f9fa] p-2 border-b border-dotted border-gray-400">
                  <h4 className=" text-[12px]">Vaccination Details <span className="font-normal font-bengali">(টিকা প্রদানের বিবরণ)</span></h4>
                </div>
                <div className="text-[11px]">
                  {[
                    { label: 'Date of Vaccination (Dose 1)', labelBn: 'টিকা প্রদানের তারিখ (ডোজ ১)', value: formatDate(data.dose1Date) },
                    { label: 'Name of Vaccination (Dose 1)', labelBn: 'টিকার নাম (ডোজ ১)', value: data.dose1VaccineName },
                    { label: 'Date of Vaccination (Dose 2)', labelBn: 'টিকা প্রদানের তারিখ (ডোজ ২)', value: formatDate(data.dose2Date) },
                    { label: 'Name of Vaccination (Dose 2)', labelBn: 'টিকার নাম (ডোজ ২)', value: data.dose2VaccineName },
                  ].map((item, idx) => (
                    <div key={idx} className="flex border-b border-dotted text-right border-gray-400">
                      <div className="w-1/2 p-1.5 border-r border-dotted text-nowrap border-gray-400">
                        <span>{item.label}: <br/><span className="text-[9px] font-bengali">{item.labelBn}:</span></span>
                      </div>
                      <div className="w-1/2 p-1.5 flex items-center ">
                        {item.value}
                      </div>
                    </div>
                  ))}
                  
                  {/* Vaccination Center - Styled with border and flex to match above rows */}
                  <div className="flex border-b  justify-center items-center border-dotted text-right border-gray-400">
                    <div className="w-1/2 p-1.5 h-[91px] flex justify-end items-center border-r border-dotted border-gray-400">
                      <span>Vaccination Center: <br/><span className="text-[9px] font-bengali">(টিকা প্রদানের কেন্দ্র):</span></span>
                    </div>
                    <div className="w-1/2 p-1.5 h-[91px] flex text-left justify-start items-center  text-[10px] leading-tight">
                      {data.vaccinationCenter}
                    </div>
                  </div>

                  {/* Vaccinated By - Styled with border and flex to match above rows */}
                  <div className="flex text-right border-gray-400">
                    <div className="w-1/2 p-1.5 border-r border-dotted border-gray-400">
                      <span>Vaccinated By: <br/><span className="text-[9px] font-bengali">(টিকা প্রদানকারী):</span></span>
                    </div>
                    <div className="w-1/2 p-1.5 flex text-left items-start  text-[10px] leading-tight">
                      {data.vaccinatedBy}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Doses Table */}
            <div className="mt-4 flex justify-center">
              <div className="w-[65%] border border-dotted border-gray-400">
                  <div className=" text-center p-1 border-b border-dotted border-gray-400  text-[10px]">Other Doses <span className="font-bengali font-normal">(অন্যান্য ডোজসমূহ)</span></div>
                  <table className="w-full text-[9px] text-center border-collapse">
                      <thead>
                          <tr className="border-b border-dotted border-gray-400">
                              <th className="border-r border-dotted border-gray-400 py-1">Dose</th>
                              <th className="border-r border-dotted border-gray-400 py-1">Vaccine Name</th>
                              <th className="py-1">Date</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td className="border-r border-dotted border-gray-400 py-1 ">Dose-3</td>
                              <td className="border-r border-dotted border-gray-400 py-1 ">{data.dose3VaccineName || 'N/A'}</td>
                              <td className="py-1 font-bold">{data.dose3Date ? formatDate(data.dose3Date) : 'N/A'}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
            </div>

            <div className="mt-auto text-center">
              <div className='border-t-[1px] pt-[20px] border-gray-200 border-dotted py-[8px]'>
                  <p className="text-[13px]">To verify this certificate please visit <span className="">www.surokkha.gov.bd/verify</span> or scan the QR code.</p>
                  <p className="text-[13px] font-bengali">(এই সার্টিফিকেটটি যাচাই করার জন্য www.surokkha.gov.bd/verify ভিজিট করুন অথবা QR কোডটি স্ক্যান করুন)</p>
              </div>
              <div className=" py-[8px] border-t-[1px] border-gray-200">
                 <p className="text-[13px]">For any further assistance, please visit <span className="">www.dghs.gov.bd</span> or e-mail: <span className="">info@dghs.gov.bd</span></p>
                 <p className="text-[13px] font-bengali">(প্রয়োজনে www.dghs.gov.bd সাইটে ভিজিট করুন অথবা ইমেইল করুন: info@dghs.gov.bd)</p>
              </div>
              <div className='w-full bg-gray-100 p-[15px] border-b-[1px] border-dashed border-gray-300'></div>
              <div className="flex justify-center py-4">
                <img src="https://i.ibb.co.com/Zpf5vvjP/Screenshot-2026-01-14-171321.png" alt="Logos" className="h-[45px] object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2: PROVISIONAL CARD (保持原样) */}
        <div className="bg-white mx-auto w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none flex flex-col items-center justify-center page-break relative print:pt-[25mm] print:mt-0">
          <div className="w-[160mm] border-2 border-[#009444] flex overflow-hidden bg-white">
            <div className="w-[60%] p-[3px] border-r-2 border-[#009444] flex flex-col">
              <div className="p-2 pt-4">
                 <div className="flex justify-center gap-2 items-center mb-1">
                   <img src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" alt="logo" className="h-10 w-10" />
                 </div>
                 <div className="text-center">
                   <p className="text-[14px] font-semibold leading-tight">Government of the People's Republic of Bangladesh</p>
                   <p className="text-[12px] font-semibold">Ministry of Health and Family Welfare</p>
                 </div>
              </div>
              <div className="bg-[#009444] border-[1px] border-green-500 text-white py-2 text-center mt-2">
                   <h5 className="text-[16px] font-bold tracking-[2px] mb-0 leading-tight">COVID-19</h5>
                   <p className="text-[11px] font-bold leading-none">Provisional Vaccination Certificate</p>
              </div>
              <div className="flex flex-col items-center flex-1 pt-2">
                <p className="text-[9px] text-gray-700 self-start mb-1 px-2">Certificate No: <span className="">{data.certificateNo}</span></p>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(getVerificationUrl())}`} 
                  alt="QR" 
                  className="w-[90px] h-[90px]" 
                />
                <h6 className="font-bold text-[14px] uppercase text-gray-900 mt-2 mb-2">{data.name}</h6>
                <div className="w-full">
                  <table className="w-full text-[11px] border-collapse">
                    <tbody>
                      <tr className='bg-[#009444] text-white'>
                        <td className="px-3 py-1.5 w-[45%] text-right border-b border-r border-white">NID Number</td>
                        <td className="px-3 py-1.5  border-b border-white">{data.nationalId}</td>
                      </tr>
                      <tr className='bg-[#009444] text-white'>
                        <td className="px-3 py-1.5  text-right border-b border-r border-white">Passport No</td>
                        <td className="px-3 py-1.5 border-b border-white">{data.passportNo || 'N/A'}</td>
                      </tr>
                      <tr className='bg-[#009444] text-white'>
                        <td className="px-3 py-1.5 text-right border-b border-r border-white">Nationality</td>
                        <td className="px-3 py-1.5 border-b border-white">{data.nationality || 'Bangladeshi'}</td>
                      </tr>
                      <tr className='bg-[#009444] text-white'>
                        <td className="px-3 py-1.5 text-right border-b border-r border-white">Vaccine Name</td>
                        <td className="px-3 py-1.5 border-b border-white text-[10px]">{data.dose1VaccineName}</td>
                      </tr>
                      <tr className='bg-[#009444] text-white'>
                        <td className="px-3 py-1.5 text-right border-r border-white uppercase">Total Doses</td>
                        <td className="px-3 py-1.5 text-[12px]">{data.totalDoses || '3'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="w-[40%] flex flex-col p-[1px] justify-between items-center text-center bg-white">
              <div className="w-full h-[15%] border-b border-[#009444]"></div>
              <div className="flex-1 flex flex-col justify-center items-center px-4 space-y-4">
                <div className="w-full">
                  <p className="text-[13px]  text-gray-800 leading-tight">To verify this certificate please <br/> visit 
                      <span className="font-bold ml-1">www.surokkha.gov.bd/verify</span>
                  </p>
                  <p className="text-[13px] font-bold text-gray-800 mt-2"><span className='font-normal text-[14px]'>or</span><br/>scan the QR code.</p>
                </div>
                <div className='w-[80px] bg-gray-400 h-[2px]'></div>
                <div className="w-full pt-2">
                  <p className="text-[12px] text-gray-700 leading-snug font-medium">For any further assistance, please visit <span className=" font-bold">www.dghs.gov.bd</span> or e-mail: <span className="block font-bold">info@dghs.gov.bd</span></p>
                </div>
              </div>
              <div className="w-full border-t border-[#009444] py-6 flex justify-center">
                <img src="https://i.ibb.co.com/DZqqccb/Screenshot-2026-01-14-172627.png" alt="Card Partner" className="h-[50px] object-contain" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
        .font-bengali { font-family: 'Hind Siliguri', sans-serif; }
        .font-sans { font-family: 'Poppins', sans-serif; }
        
        @media print {
          @page { 
            size: A4; 
            margin: 0 !important; 
          }
          html, body {
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .page-break { 
            display: block;
            page-break-before: always;
            break-before: page;
            clear: both;
          }
          .page-break + .page-break {
            margin-top: 0 !important;
            border-top: none !important;
          }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .shadow-2xl { box-shadow: none !important; }
          .print-container { width: 100%; }
        }
      `}} />
    </div>
  );
}

export default Surokkhacloneprint;