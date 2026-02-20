import React, { useState, useEffect } from 'react';
import { Printer, RotateCw, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Smartnidprint() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);

  // Editor States
  const [vPos, setVPos] = useState(1); 
  const [padding, setPadding] = useState(6); 
  const [zoom, setZoom] = useState(1); 
  const [rotation, setRotation] = useState(0);
  const [contrast, setContrast] = useState(1.8); 

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const FRONT_BG = "https://i.ibb.co.com/sd1xWkpm/Screenshot-2026-01-18-232130.png";
  const BACK_BG = "https://i.ibb.co.com/YKQf8S2/Screenshot-2026-01-18-232243.png";
  const BARCODE_IMG = "https://i.ibb.co.com/mC4DBCs6/Screenshot-2026-01-16-022909.png";
  const OVERLAY_IMG = "https://smart.xbdapi.my.id/smart/image/overflow.png";

  useEffect(() => {
    const fetchNIDOrderData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${base_url}/api/user/smart-nid/order/${id}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'userid': userId }
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

  const handlePrint = () => window.print();
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const resetFilters = () => {
    setContrast(1.8);
    setZoom(1);
    setVPos(1);
  };
useEffect(() => {
  if (orderData) {
    document.title = `Smart_NID_Card_${orderData.nationalId || orderData.nidNumber}`;
  }
  // Optional: Reset title when leaving the page
  return () => { document.title = "Digital Service"; }; 
}, [orderData]);
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><ApertureLoader /></div>;
  if (error || !orderData) return <div className="text-center mt-10 text-red-500 font-bold">{error || "Data not found"}</div>;

  return (
    <div className="bg-zinc-200 min-h-screen py-10 print:p-0 print:bg-white font-arial">
      
      <div className="print-area flex justify-center items-center gap-12">
        
        {/* FRONT SIDE */}
        <div className="nid-card-container relative shadow-2xl rounded-[12px] overflow-hidden">
          <img src={FRONT_BG} className="absolute inset-0 w-full h-full z-0 object-cover" alt="Background" />
          
          {/* MAIN PROFILE PHOTO AREA */}
          <div className="absolute top-[36%] left-[5%] w-[83px] h-[100px] overflow-hidden">
            <img 
                src={orderData.photo || orderData.nidPhoto} 
                className="absolute inset-0 w-full h-full object-cover z-10" 
                style={{ 
                    mixBlendMode: 'multiply', 
                    filter: 'grayscale(1) contrast(1.2) brightness(1.1)' 
                }} 
                alt="Profile" 
            />
          </div>

          <img 
              src={OVERLAY_IMG} 
              className="absolute inset-0 w-full h-full object-cover z-[100000] pointer-events-none" 
              alt="Overlay" 
          />

          {/* FRONT SMALL GHOST PHOTO */}
    {/* FRONT SMALL GHOST PHOTO WITH BIRTH YEAR OVERLAY */}
<div className="absolute top-[18.5%] right-[9.5%] w-[32px] h-[32px] z-10 flex items-center justify-center">
    {/* The Photo */}
    <img 
      src={orderData.photo || orderData.nidPhoto} 
      className="w-full h-full object-cover" 
      style={{ 
          opacity: 0.4, 
          filter: 'grayscale(1) contrast(1.5)', 
          mixBlendMode: 'multiply' 
      }}
      alt="Small Profile Ghost" 
    />
    
    {/* The Birth Year Overlay */}
    <div className="absolute top-[-20%] flex items-center justify-center pointer-events-none">
      <span className="text-[7px] font-bold text-gray-600 opacity-60 text-nowrap">
   {new Date(orderData.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </span>
    </div>
</div>

          <div className="absolute top-[27%] left-[38%] z-10 leading-[1.1] space-y-[2px] text-black">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-800">নাম</span>
              <span className="text-[11px] mt-[2px] font-bold leading-none">{orderData.nameBangla || orderData.nameBanga}</span>
            </div>
            <div className="flex flex-col pt-[2px]">
              <span className="text-[8px] font-bold">Name</span>
              <span className="text-[10px] mt-[2px] font-bold uppercase">{orderData.nameEnglish}</span>
            </div>
            <div className="pt-1 text-[10px] flex flex-col">
              <span className="mb-[1px]">পিতা: {orderData.fatherName}</span>
            </div>
            <div className="text-[10px] pt-[3px] flex flex-col">
              <span className="">মাতা: {orderData.motherName}</span>
            </div>
            <div className="pt-[1px]">
              <span className="text-[10px] text-gray-800 ">Date of Birth: </span>
              <span className="text-[11px] font-normal">
                {new Date(orderData.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="">
              <span className="text-[10px] text-gray-800">NID No: </span>
              <span className="text-[12px] font-semibold tracking-widest">
                {orderData.nationalId || orderData.nidNumber}
              </span>
            </div>
          </div>

          <div 
            className="absolute z-20 pointer-events-none"
            style={{ 
              bottom: `${vPos}%`, 
              left: `${padding}%`,
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'left bottom',
              mixBlendMode: 'multiply' 
            }}
          >
             <img 
               src={orderData.signature} 
               className="h-9 w-28 object-contain" 
               style={{ 
                 filter: `contrast(${contrast}) brightness(1.1) grayscale(1)` 
               }} 
               alt="Signature" 
             />
          </div>
        </div>

        {/* BACK SIDE */}
        <div className="nid-card-container relative shadow-2xl rounded-[12px] overflow-hidden">
          <img src={BACK_BG} className="absolute inset-0 w-full h-full z-0 object-cover" alt="Background" />
          
          {/* BACK SMALL GHOST PHOTO */}
          <div className="absolute top-[38%] right-[7.5%] w-[32px] h-[32px] z-10">
              <img 
                src={orderData.photo || orderData.nidPhoto} 
                className="w-full h-full object-cover" 
                style={{ 
                    opacity: 0.35, 
                    filter: 'grayscale(1) contrast(1.4)', 
                    mixBlendMode: 'multiply' 
                }}
                alt="Small Profile Back" 
              />
          </div>

          <div className="absolute top-[3%] left-[4%] right-[4%] z-10">
            <img src={BARCODE_IMG} className="w-full h-[50px] object-stretch" alt="Barcode" />
          </div>

          <div className="absolute top-[28%] left-[6%] w-[60%] right-[6%] z-10 text-[9px] leading-[1.3] text-black">
            <span className="">ঠিকানা: </span>
            <span className="">গ্রাম/রাস্তা: {orderData.address}</span>
          </div>

          <div className="absolute top-[51%] left-[6%] right-[6%] flex justify-between items-end z-10">
            <div className="text-[8px]">
              <span className="">Blood Group: </span>
              <span className="text-red-600 font-black ml-1 text-xs">{orderData.bloodGroup}</span>
            </div>
            <div className="text-[8px]">
              <span className="">Place of Birth: </span>
              <span className="font-bold ml-1">{orderData.birthPlace}</span>
            </div>
            <div className="text-[8px]">
              Issue Date: <span className='text-black'>{orderData.dateOfToday || '18 Jan 2026'}</span>
            </div>
          </div>

    <div className="absolute bottom-[12%] left-[6%] right-[4%] z-10 text-[14px] font-mono leading-[1.2] tracking-[3px] text-black font-medium">
  {/* Line 1: ID Section */}
  <p className="whitespace-nowrap uppercase">
    {`I<BGD${orderData.nationalId || orderData.nidNumber || ''}`.padEnd(30, '<').substring(0, 30)}
  </p>
  
  {/* Line 2: Gender/Dates Section */}
  <p className="whitespace-nowrap uppercase">
    {`011029${orderData.gender?.charAt(0) || ''}69M3207073BGD<<<<<<<4`.padEnd(30, '<').substring(0, 30)}
  </p>
  
  {/* Line 3: Name Section */}
  <p className="whitespace-nowrap uppercase">
    {`${orderData.nameEnglish?.replace(/ /g, '<<') || ''}`.padEnd(30, '<').substring(0, 30)}
  </p>
</div>
        </div>
      </div>

      {/* ADVANCED EDITOR PANEL */}
      <div className="max-w-[950px] mt-12 mx-auto mb-12 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:hidden transition-all">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
            সিগনেচার এডিট প্যানেল
          </h2>
          <button 
            onClick={resetFilters}
            className="text-xs font-semibold text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
          >
            <Trash2 size={14} /> রিসেট করুন
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
            
            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between mb-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">উপর - নিচ (Vertical)</label>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 rounded">{vPos}%</span>
                </div>
                <input type="range" min="-5" max="20" step="0.5" value={vPos} onChange={(e) => setVPos(e.target.value)} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>

              <div className="group">
                <div className="flex justify-between mb-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">ডানে - বামে (Padding)</label>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 rounded">{padding}%</span>
                </div>
                <input type="range" min="0" max="25" step="0.5" value={padding} onChange={(e) => setPadding(e.target.value)} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
              </div>
            </div>

            <div className="space-y-6">
              <div className="group">
                <div className="flex justify-between mb-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-wider">জুম (Scale)</label>
                  <span className="text-xs font-mono font-bold text-green-600 bg-green-50 px-2 rounded">{zoom}x</span>
                </div>
                <input type="range" min="0.5" max="2.5" step="0.1" value={zoom} onChange={(e) => setZoom(e.target.value)} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600" />
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pl-0 lg:pl-6 lg:border-l border-gray-100">
              <button 
                onClick={handleRotate} 
                className="flex items-center justify-center gap-3 bg-white border-2 border-orange-500 text-orange-500 px-4 py-2.5 rounded-xl font-bold hover:bg-orange-50 transition-all active:scale-95 text-sm"
              >
                <RotateCw size={18} className={rotation !== 0 ? "animate-spin-slow" : ""}/> সিগনেচার ঘুরান
              </button>
              
              <button 
                onClick={handlePrint} 
                className="flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-3 text-[14px] rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 mt-1"
              >
                <Printer size={20}/> 
                <span className="">প্রিন্ট  করুন</span>
              </button>
            </div>

          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .font-arial { font-family: Arial, Helvetica, sans-serif !important; }
        .nid-card-container {
          width: 95mm; height: 60mm; min-width: 95mm; min-height: 60mm;
          font-family: Arial, Helvetica, sans-serif;
          background-color: white; position: relative; border: 1px solid #ccc;
          -webkit-print-color-adjust: exact; print-color-adjust: exact;
        }
        @media print {
          @page {
            size: auto; 
            margin: 0mm;
          }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .nid-card-container { box-shadow: none !important; border: 0.1px solid #eee !important; margin: 0 !important; page-break-inside: avoid; }
          .print-area { display: flex !important; flex-direction: row !important; justify-content: center !important; gap: 10mm !important; width: 100% !important; padding-top: 10mm; }
        }
      `}} />
    </div>
  );
}

export default Smartnidprint;