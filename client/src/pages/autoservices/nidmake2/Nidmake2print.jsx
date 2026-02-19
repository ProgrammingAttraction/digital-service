import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Newnidcardprint() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const GOVT_LOGO = "https://i.ibb.co.com/N6DL0z8Y/bangladesh-govt-logo-removebg-preview.png";
  const WATERMARK = "https://i.ibb.co.com/HTX3JXsg/png-clipart-national-emblem-of-bangladesh-national-symbol-symbol-miscellaneous-emblem-removebg-previ.png";
  const BARCODE_IMG = "https://i.ibb.co.com/mC4DBCs6/Screenshot-2026-01-16-022909.png";

  useEffect(() => {
    const fetchNIDOrderData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${base_url}/api/user/nid-make2-order/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'userid': userId
          }
        });
        if (response.data.success) {
          setOrderData(response.data.data);
        } else {
          setError(response.data.message || 'NID order not found');
        }
      } catch (err) {
        setError('Failed to load NID order data');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchNIDOrderData();
  }, [id, base_url, token, userId]);

  useEffect(() => {
    if (!loading && orderData) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, orderData]);
useEffect(() => {
  if (orderData) {
    document.title = `NID_Card_${orderData.nationalId || orderData.nidNumber}`;
  }
  // Optional: Reset title when leaving the page
  return () => { document.title = "Digital Service"; }; 
}, [orderData]);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><ApertureLoader /></div>;
  if (error || !orderData) return <div className="text-center mt-10 text-red-500 font-bold">{error || "Data not found"}</div>;

  return (
    <div className="min-h-screen pt-3 print:p-0 bg-white">
      <div className="print-area flex justify-center">
        <div className="flex flex-row gap-4 print:shadow-none print:p-0">
          
          {/* FRONT SIDE */}
          <div className="nid-card-container relative border border-black overflow-hidden bg-white">
            <img src={WATERMARK} className="absolute top-[58%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-[200px] opacity-[0.4] pointer-events-none z-0" alt="" />
            
            <div className="flex items-center px-2 py-1.5 border-b-[0.5px] border-black relative z-10">
              <img src={GOVT_LOGO} className="w-10 h-10 mr-2" alt="Logo" />
              <div className="flex-1 text-center leading-[1.2]">
                <h1 className="bn-font text-[17px] mb-[1px] font-bold">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h1>
                <h2 className="text-[12px] mb-1 text-[rgb(0,119,0,0.9)] tracking-tight text-nowrap mt-1">Government of the People's Republic of Bangladesh</h2>
                <h3 className="text-[10px] "> <span className='text-[rgb(255,0,2)]'>National ID Card </span>/ <span className="bn-font">জাতীয় পরিচয় পত্র</span></h3>
              </div>
            </div>

            <div className="flex pt-[2px] px-[2px] relative z-10">
              <div className="w-[75px] flex flex-col items-center">
                <div className=" bg-white overflow-hidden">
                  <img src={orderData.photo || orderData.nidPhoto} className="w-[75px] h-[84px] object-cover" alt="User" />
                </div>
                <img src={orderData.signature} className=" w-full mt-1.5 object-contain" alt="Sign" />
              </div>

              <div className="flex-1 pl-2 text-[13px] pt-1">
                <div className="flex mb-1 items-baseline">
                  <span className="w-12  bn-font">নাম:</span>
                  <span className="font-bold text-gray-800 text-[12px]">{orderData.nameBangla || orderData.nameBanga}</span>
                </div>
                <div className="flex mb-[2px] items-baseline">
                  <span className="w-12 text-[10px]">Name:</span>
                  <span className="text-black text-[12px] uppercase">{orderData.nameEnglish}</span>
                </div>
                <div className="flex mb-[3px] text-[12px] mt-1.5 items-baseline">
                  <span className="w-12  bn-font">পিতা:</span>
                  <span className="text-black bn-font">{orderData.fatherName}</span>
                </div>
                <div className="flex mb-[3px] text-[12px] items-baseline">
                  <span className="w-12 bn-font">মাতা:</span>
                  <span className="text-black font-semibold bn-font">{orderData.motherName}</span>
                </div>
                <div className="flex items-baseline">
                  <span className=" mr-1 text-[12px]">Date of Birth:</span>
                  <span className="text-[rgb(255,0,0,0.8)] font-semibold text-[12px]">
                     {new Date(orderData.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-baseline text-[12px]">
                  <span className="mr-1">ID NO:</span>
                  <span className="text-red-500 text-[12px] font-bold">{orderData.nationalId || orderData.nidNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div className="nid-card-container relative border border-black overflow-hidden bg-white">
            <div className="pt-2 h-full flex flex-col">
              <p className="bn-font text-[10.5px] text-left px-[7px] border-b-[0.5px] border-gray-800 pb-[2px] mb-2 leading-[13px] text-gray-800">
                এই কার্ডটি গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের সম্পত্তি। কার্ডটি ব্যবহারকারী ব্যতীত অন্য কোথাও পাওয়া গেলে নিকটস্থ পোস্ট অফিসে জমা দেবার জন্য অনুরোধ করা হলো।
              </p>
              
              <div className="flex text-[11px] text-gray-800 mb-1 px-[7px] bn-font">
                <span className=" mr-1 shrink-0">ঠিকানা:</span>
                <span className="leading-tight">গ্রাম/রাস্তা: {orderData.address}</span>
              </div>

              <div className="flex justify-between relative items-center text-[10px] text-gray-800 mt-2 border-b-[0.5px] border-gray-800 px-1">
                <div>
                  <span className="bn-font black">রক্তের গ্রুপ</span> / Blood Group: 
                  <span className="text-red-600 font-bold ml-1">{orderData.bloodGroup}</span>
                </div>
                <div className="flex items-center black">
                  <span className="bn-font mr-1">জন্মস্থান:</span> <span className="bn-font">{orderData.birthPlace}</span>
                </div>
                <div></div>
                <div className="bg-black absolute bottom-0 right-0 text-white text-[7px] font-medium px-1 bn-font">মুদ্রণ: ০১</div>
              </div>

              <div className="flex justify-between items-end mt-1 px-2">
                <div className="text-center ">
            <img 
  src={'https://i.ibb.co/HTKfNh66/Screenshot-2026-02-06-124748.png'} 
  className="h-8 w-20 block m-auto object-contain" 
  alt="" 
/>
                  <div className="mt-0.5 px-1 text-[12px] text-gray-800 bn-font">প্রদানকারী কর্তৃপক্ষের স্বাক্ষর</div>
                </div>
                <div className="text-right text-[11px] bn-font">
                  <span className=" text-black">প্রদানের তারিখ: {orderData.dateOfToday}</span>
                </div>
              </div>

              <div className="mt-[2px] pb-1 px-[3px] w-full">
                <img src={BARCODE_IMG} className="w-full h-[45px] object-fill" alt="barcode" />
              </div>
            </div>
          </div>
        </div>
      </div>
<style dangerouslySetInnerHTML={{ __html: `
  @import url('https://sonnetdp.github.io/nikosh/css/nikosh.css');
  @import url('https://fonts.maateen.me/kalpurush/font.css');

  .bn-font {
    font-family: 'Nikosh', 'Kalpurush', sans-serif !important;
  }

  @media print {
    @page {
      size: landscape; 
      margin: 0mm;
    }
      
    body { 
      margin: 0;
      background: white !important; 
      /* This line is the key fix: */
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-area {
      display: flex !important;
      justify-content: center !important;
      width: 100% !important;
      padding-top: 10mm;
    }
      img {
    border: none !important;
    outline: none !important;
  }
    /* Ensure the black background specifically prints */
    .bg-black {
      background-color: black !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }

  .nid-card-container {
    width: 90mm;
    height: 57mm;
    min-width: 90mm;
    min-height: 57mm;
    font-family: Arial, Helvetica, sans-serif;
  }
`}} />
    </div>
  );
}

export default Newnidcardprint;