import React, { useState, useEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function TradeLicensePrint() {
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
    const fetchLicenseData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/user/trade-license/receipt/${id}`);
        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError('লাইসেন্স ডাটা পাওয়া যায়নি');
        }
      } catch (err) {
        setError('সার্ভার থেকে ডাটা লোড করতে ব্যর্থ হয়েছে');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchLicenseData();
  }, [id]);
useEffect(() => {
  if (data) {
    const title = `Trade_License_${data.licenseNumber || id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [data, id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <ApertureLoader />
    </div>
  );

  if (error || !data) return (
    <div className="text-center p-10 font-sans">
      <p className="text-red-600 font-bold mb-4">{error}</p>
      <button onClick={() => navigate(-1)} className="bg-gray-800 text-white px-6 py-2 rounded">
        ফিরে যান
      </button>
    </div>
  );

  return (
    <div className="bg-zinc-200 min-h-screen py-4 print:bg-white print:py-0">
      <div className="max-w-[210mm] mx-auto mb-4 flex justify-end print:hidden px-4">
        <button 
          onClick={handlePrint} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 rounded shadow-lg flex items-center gap-2 font-bold"
        >
          <Printer size={18}/> প্রিন্ট করুন
        </button>
      </div>

      {/* Main A4 Container */}
      <div className="bg-white mx-auto w-[210mm] h-[297mm] p-[10mm] shadow-2xl print:shadow-none relative box-border overflow-hidden" id="license-paper">
        
        {/* Single Green Border Frame */}
        <div className="border-[1px] border-gray-200 h-full w-full p-6 relative flex flex-col box-border">
            
            {/* Top Section: QR Code and Center Header */}
            <div className="relative w-full mb-2">
                {/* QR Code on Top Left */}
                <div className="absolute left-0 top-0">
                    <div className=" p-1 bg-white">
                        <QRCodeSVG value={`${window.location.origin}/verify/${id}`} size={80} />
                    </div>
                </div>

                {/* Header in Center */}
                <div className="text-center pt-2">
                    <h2 className="text-[#006400] text-[20px] font-bold leading-none">{data.union}</h2>
                    <h3 className="text-red-600 text-[18px] font-bold leading-tight mt-1">{data.postOffice}</h3>
                    <p className="text-[10px] text-gray-700">ওয়েবসাইট: www.upshaba.com.bd</p>
                    
                    <div className="my-2">
                        <img 
                          src="https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png" 
                          alt="Govt Logo" 
                          className="w-16 mx-auto"
                        />
                    </div>
                    
                    <h1 className="text-red-600 text-[22px]  font-black uppercase leading-none">ট্রেড লাইসেন্স</h1>
                </div>
            </div>

            {/* License Details and Number row */}
            <div className="flex justify-between items-end mt-2 mb-1">
                <div className="text-[12px] leading-tight">
                    <p className="font-bold">লাইসেন্স ইস্যুর বিবরণ:</p>
                    <p className="mt-4"><strong>ইস্যুর তারিখ:</strong> {data.issueDate}</p>
                </div>
                <div className="text-center pr-10">
                    <p className="text-[18px] font-black text-black">ট্রেড লাইসেন্স নং: <span className="text-red-600 ml-1">{data.licenseNumber}</span></p>
                </div>
                <div className="w-[80px]"></div> {/* Spacer to keep balance */}
            </div>

            {/* Law Preamble */}
            <p className="text-[10.5px] leading-[1.3] mt-2 text-justify font-medium">
                স্থানীয় সরকার (ইউনিয়ন পরিষদ) আইন, ২০০৯ (২০০৯ সালের ৬১ নং আইন) এর ধারা ৬৬ প্রদত্ত ক্ষমতাবলে সরকার প্রণীত আদর্শ কর তফসিল, ২০১৩ এর ৩ ও ১৭ নং অনুচ্ছেদ অনুযায়ী ব্যবসা, বৃত্তি, পেশা বা শিল্প প্রতিষ্ঠানের উপর আরোপিত কর আদায়ের লক্ষ্যে নির্ধারিত শর্তে নিম্নলিখিত ব্যক্তি/প্রতিষ্ঠানের অনুকূলে এই ট্রেড লাইসেন্সটি ইস্যু করা হলো:
            </p>

            {/* Information Grid */}
            <div className="mt-4 space-y-1.5 text-[12px]">
                <p><span className='font-medium'>১। ব্যবসা প্রতিষ্ঠানের নাম:</span> <span className="ml-2 font-bold uppercase">{data.businessName || data.applicantName}</span></p>
                <p><span className='font-medium'>২। স্বত্বাধিকারী/লাইসেন্সধারীর নাম:</span> <span className="ml-2 font-bold">{data.applicantName}</span></p>
                <p><span className='font-medium'>৩। পিতার নাম:</span> <span className="ml-2 font-bold">{data.fatherName}</span></p>
                <p><span className='font-medium'>৪। মাতার নাম:</span> <span className="ml-2 font-bold">{data.motherName}</span></p>
                <p><span className='font-medium'>৫। স্ত্রীর নাম (প্রযোজ্য ক্ষেত্রে):</span> <span className="ml-2 font-bold">{data.spouseName || '---'}</span></p>
                <p><span className='font-medium'>৬। ব্যবসার প্রকৃতি (একক/যৌথ):</span> <span className="ml-2 font-bold">একক</span></p>
                <p><span className='font-medium'>৭। ব্যবসার ধরণ:</span> <span className="ml-2 font-bold">{data.businessType || 'স্টুডিও এন্ড ভিডিও ক্যামেরা'}</span></p>
                <p><span className='font-medium'>৮। ব্যবসা প্রতিষ্ঠানের ঠিকানা:</span> <span className="ml-2 font-bold">{data.businessAddress || 'আমিগঞ্জ বাজার'}</span></p>
                <p><span className='font-medium'>৯। কর-অঞ্চল (প্রযোজ্য ক্ষেত্রে):</span> <span className="ml-2 font-bold">প্রযোজ্য নয়</span></p>
                <p><span className='font-medium'>১০। এন.আই.ডি / জন্ম নিবন্ধন নম্বর:</span> <span className="ml-2 font-bold">{data.nidNumber || '১৯৩০৬৯৯১০৪'}</span></p>
                <p><span className='font-medium'>১১। অর্থবছর:</span> <span className="ml-2 font-bold">২০২৪-২০২৫</span></p>
            </div>

            {/* Address Boxes */}
            <div className="grid grid-cols-2 gap-4 mt-5">
                <div className="border border-gray-400 p-2 min-h-[50px] text-[11px]">
                    <p className="font-bold  mb-1 text-[10px]">১২। মালিকের বর্তমান ঠিকানা:</p>
                    <p>{data.businessAddress || 'অমিগঞ্জ বাজার, ৩নং মুগ্যা ইউনিয়ন, ইটনা, কিশোরগঞ্জ'}</p>
                </div>
                <div className="border border-gray-400 p-2 min-h-[50px] text-[11px]">
                    <p className="font-bold  mb-1 text-[10px]">মালিকের স্থায়ী ঠিকানা:</p>
                    <p>{data.businessAddress || 'অমিগঞ্জ বাজার, ৩নং মুগ্যা ইউনিয়ন, ইটনা, কিশোরগঞ্জ'}</p>
                </div>
            </div>

            <p className="text-[11.5px] font-semibold my-6">১৩। আদর্শ কর তফসিল, ২০১৩ এর ক্রমিক নম্বর: ৩৩৭</p>

            {/* Fee Table Section */}
            <div className="mt-2 border border-black overflow-hidden bg-white">
                <div className="flex">
                    <div className="w-1/2 border-r border-black">
                        <table className="w-full text-[11px]">
                            <tbody>
                                <tr className="border-b border-black">
                                    <td className="p-1.5 border-r border-black font-bold">১৪। ট্রেড লাইসেন্স ফি (নতুন)</td>
                                    <td className="p-1.5 text-right w-[80px]">{data.licenseFee || '৩০০.০০'}</td>
                                </tr>
                                <tr className="border-b border-black">
                                    <td className="p-1.5 border-r border-black font-bold">পারমিট ফি</td>
                                    <td className="p-1.5 text-right">৫.০০</td>
                                </tr>
                                <tr className="border-b border-black">
                                    <td className="p-1.5 border-r border-black font-bold">সার্ভিস চার্জ</td>
                                    <td className="p-1.5 text-right">০.০০</td>
                                </tr>
                                <tr className="border-b border-black">
                                    <td className="p-1.5 border-r border-black font-bold">বকেয়া</td>
                                    <td className="p-1.5 text-right">০.০০</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 border-r border-black font-bold">সারচার্জ</td>
                                    <td className="p-1.5 text-right">০.০০</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="w-1/2">
                        <table className="w-full text-[11px]">
                            <tbody>
                                <tr className="border-b border-black">
                                    <td className="p-1.5 border-r border-black font-bold">পেশা ও বৃত্তির ওপর কর</td>
                                    <td className="p-1.5 text-right w-[80px]">০.০০</td>
                                </tr>
                                <tr className="border-b border-black">
                                    <td className="p-1.5 border-r border-black font-bold">সাইনবোর্ড ফি</td>
                                    <td className="p-1.5 text-right">০.০০</td>
                                </tr>
                                <tr className="border-b border-black">
                                    <td className="p-1.5 border-r border-black font-bold">আয়কর/উৎসে কর</td>
                                    <td className="p-1.5 text-right">০.০০</td>
                                </tr>
                                <tr className="border-b border-black">
                                    <td className="p-1.5 border-r border-black font-bold">ভ্যাট</td>
                                    <td className="p-1.5 text-right">৪৫.০০</td>
                                </tr>
                                <tr>
                                    <td className="p-1.5 border-r border-black font-bold">সংশোধনী ফি</td>
                                    <td className="p-1.5 text-right">০.০০</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Bottom Signature Section */}
            <div className="mt-auto pt-16 pb-4 flex justify-between px-10 text-[10px] font-bold">
                <div className="text-center">
                    <div className="w-36 mb-[20px] pt-1">সচিব</div>
                    <p className="mt-1 text-[10px]">{data.union}</p>
                    <p className="mt-1 text-[10px]">{data.postOffice}</p>
                </div>
                <div className="text-center">
                    <div className="w-36 mb-[20px] pt-1">ম্যাজিস্ট্রেট</div>
                    <p className="mt-1 text-[10px]">{data.union}</p>
                    <p className="mt-1 text-[10px]">{data.postOffice}</p>
                </div>
            </div>

        </div>
      </div>

      <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Tiro+Bangla:ital@0;1&display=swap');
        
        #license-paper {
          font-family: 'Tiro Bangla', serif;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          color: #000;
        }

        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body { 
            margin: 0; 
            padding: 0;
            background-color: white !important;
          }
          .print-hidden { display: none !important; }
          #license-paper {
            width: 210mm;
            height: 297mm;
            padding: 10mm !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default TradeLicensePrint;