import React, { useState, useRef, useEffect } from 'react';
import { Printer, ArrowLeft, Save, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import ApertureLoader from '../../../components/loader/ApertureLoader';

function Vomionnoyonprint() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  // State for receipt data
  const [formData, setFormData] = useState({
    formNo: '',
    porishishto: '',
    slNo: '',
    onuchhed: '',
    officeName: '',
    mouza: '',
    upazila: '',
    district: '',
    khatian: '',
    holding: '',
    totalLand: '',
    arrear3Plus: '',
    arrearLast3: '',
    interest: '',
    currentDemand: '',
    totalDemand: '',
    totalCollect: '',
    totalArrear: '',
    inWords: '',
    note: '',
    chalanNo: '',
    dateBn: '',
    dateEn: ''
  });

  const [owners, setOwners] = useState([]);
  const [lands, setLands] = useState([]);
  const [receiptNumber, setReceiptNumber] = useState('');

  // Configure axios
  const api = axios.create({
    baseURL: base_url,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'userid': userId
    }
  });

  // Convert numbers to Bengali
  const toBn = (n) => {
    if (n === null || n === undefined) return '';
    return n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
  };

  // Fetch receipt data
  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        setLoading(true);
        let response;
        if (id && id.startsWith('VOM')) {
          response = await api.get(`/api/user/vomionnoyon/receipt/${id}`);
        } else {
          response = await api.get(`/api/user/vomionnoyon/${id}`);
        }
        
        if (response.data.success) {
          const receipt = response.data.data;
          setFormData({
            formNo: receipt.formNo || '',
            porishishto: receipt.porishishto || '',
            slNo: receipt.slNo || '',
            onuchhed: receipt.onuchhed || '৩৯২',
            officeName: receipt.officeName || '',
            mouza: receipt.mouza || '',
            upazila: receipt.upazila || '',
            district: receipt.district || '',
            khatian: receipt.khatian || '',
            holding: receipt.holding || '',
            totalLand: receipt.totalLand || '',
            arrear3Plus: receipt.arrear3Plus || '০',
            arrearLast3: receipt.arrearLast3 || '০',
            interest: receipt.interest || '০',
            currentDemand: receipt.currentDemand || '',
            totalDemand: receipt.totalDemand || receipt.currentDemand || '',
            totalCollect: receipt.totalCollect || '',
            totalArrear: receipt.totalArrear || '০',
            inWords: receipt.inWords || '',
            note: receipt.note || '',
            chalanNo: receipt.chalanNo || '',
            dateBn: receipt.dateBn || '',
            dateEn: receipt.dateEn || ''
          });

          setOwners((receipt.owners || []).filter(owner => owner && (owner.name || owner.portion)));
          setLands((receipt.lands || []).filter(land => land && (land.dagNo || land.class || land.amount)));
          setReceiptNumber(receipt.receiptId || id || '');
        } else {
          alert('রসিদ ডাটা পাওয়া যায়নি');
          navigate(-1);
        }
      } catch (error) {
        console.error('Error loading receipt:', error);
        alert('রসিদ লোড করতে সমস্যা হয়েছে');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReceiptData();
  }, [id]);

  const qrValue = `https://api.xbdapi.my.idseba/clone-services/vomi-unnoyon-kor-downlaod/${receiptNumber}`;
// Add this page title effect after the above useEffect
useEffect(() => {
  if (formData.slNo || receiptNumber) {
    const title = `ভূমি_উন্নয়ন_কর_রসিদ_${formData.slNo || receiptNumber || id}`;
    document.title = title;
  }
  // Reset title when leaving the page
  return () => { document.title = "Digital Service"; };
}, [formData.slNo, receiptNumber, id]);
  const handlePrint = () => window.print();

  const DataField = ({ label, value, className = "" }) => (
    <div className={`inline-flex items-baseline ${className}`}>
      <span className="font-bold mr-1 whitespace-nowrap">{label}</span>
      <span className="border-b border-dotted border-black flex-grow px-2 italic min-h-[1.2rem]">
        {value || "\u00A0"}
      </span>
    </div>
  );

  const ownersFirstHalf = owners.slice(0, Math.ceil(owners.length / 2));
  const ownersSecondHalf = owners.slice(Math.ceil(owners.length / 2));
  const landsFirstHalf = lands.slice(0, Math.ceil(lands.length / 2));
  const landsSecondHalf = lands.slice(Math.ceil(lands.length / 2));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center"><ApertureLoader/><p className="mt-[15px] text-gray-600">রসিদ লোড হচ্ছে...</p></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-200 min-h-screen p-4 md:p-10 font-serif print:bg-white print:p-0">
      {/* Action Buttons */}
      <div className="w-full mx-auto mb-6 flex justify-center items-center flex-wrap gap-3 print:hidden">
        <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded shadow font-bold hover:bg-emerald-800 transition text-lg"><Printer size={20}/> প্রিন্ট করুন</button>
      </div>

      {/* A4 Container */}
      <div className="bg-white p-[15mm] mx-auto w-full max-w-[210mm] min-h-[297mm] text-[13px] leading-[1.5] text-black shadow-lg print:shadow-none print:max-w-full print:p-[10mm]">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="text-[11px] leading-tight">
            <p>বাংলাদেশ ফরম নং {formData.formNo}</p>
            <p>(সংশোধিত)</p>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1">ভূমি উন্নয়ন কর পরিশোধ রসিদ</h1>
            <p className="text-[12px] font-bold">(অনুচ্ছেদ {formData.onuchhed || '৩৯২'} দ্রষ্টব্য)</p>
          </div>
          <div className="text-right text-[11px] leading-tight">
            <p>(পরিশিষ্ট: {formData.porishishto})</p>
            <p>ক্রমিক নং: <span className="font-bold border-b border-black px-2">{formData.slNo}</span></p>
          </div>
        </div>

        {/* Office Info */}
        <div className="mt-6 space-y-3">
          <DataField label="সিটি কর্পোরেশন/ পৌর/ ইউনিয়ন ভূমি অফিসের নাম:" value={formData.officeName} className="w-full" />
          <div className="flex w-full gap-6">
            <DataField label="মৌজার নাম ও জে. এল. নং:" value={formData.mouza} className="flex-[2]" />
            <DataField label="উপজেলা/থানা:" value={formData.upazila} className="flex-1" />
            <DataField label="জেলা:" value={formData.district} className="flex-1" />
          </div>
          <div className="flex w-full gap-6">
            <DataField label="২ নং রেজিস্টার অনুযায়ী হোল্ডিং নম্বর:" value={formData.holding} className="flex-1" />
            <DataField label="খতিয়ান নং:" value={formData.khatian} className="flex-1" />
          </div>
        </div>

        {/* Owners Table */}
        <div className="mt-8">
          <h2 className="text-center font-bold mb-2 text-[15px]">মালিকের বিবরণ</h2>
          <div className="flex gap-4">
            {[ownersFirstHalf, ownersSecondHalf].map((half, idx) => (
              <div key={idx} className="flex-1 border border-black border-dotted">
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-black border-dotted font-bold text-center bg-gray-50">
                      <td className="border-r border-black border-dotted w-10 py-1">ক্রম</td>
                      <td className="border-r border-black border-dotted py-1">মালিকের নাম</td>
                      <td className="py-1">অংশ</td>
                    </tr>
                  </thead>
                  <tbody>
                    {(half.length > 0 ? half : [null]).map((o, i) => (
                      <tr key={i} className="border-b border-black border-dotted last:border-0 h-8">
                        <td className="border-r border-black border-dotted text-center">{toBn(idx === 0 ? i + 1 : i + 1 + ownersFirstHalf.length)}</td>
                        <td className="border-r border-black border-dotted px-2">{o?.name || ''}</td>
                        <td className="px-2 text-center">{o?.portion || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>

        {/* Lands Table */}
        <div className="mt-8">
          <h2 className="text-center font-bold mb-2 text-[15px]">জমির বিবরণ</h2>
          <div className="flex gap-4">
            {[landsFirstHalf, landsSecondHalf].map((half, idx) => (
              <div key={idx} className="flex-1 border border-black border-dotted">
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="border-b border-black border-dotted font-bold text-center bg-gray-50">
                      <td className="border-r border-black border-dotted w-10 py-1">ক্রম</td>
                      <td className="border-r border-black border-dotted w-16 py-1">দাগ নং</td>
                      <td className="border-r border-black border-dotted py-1">শ্রেণী</td>
                      <td className="py-1">পরিমাণ (শতক)</td>
                    </tr>
                  </thead>
                  <tbody>
                    {(half.length > 0 ? half : [null]).map((l, i) => (
                      <tr key={i} className="border-b border-black border-dotted last:border-0 h-8">
                        <td className="border-r border-black border-dotted text-center">{toBn(idx === 0 ? i + 1 : i + 1 + landsFirstHalf.length)}</td>
                        <td className="border-r border-black border-dotted text-center">{l?.dagNo || ''}</td>
                        <td className="border-r border-black border-dotted px-2">{l?.class || ''}</td>
                        <td className="text-center">{l?.amount || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <div className="flex border mt-4 border-black  border-dotted font-bold text-[14px]">
            <div className="w-1/2 text-center border-r border-black border-dotted py-2">সর্বমোট জমি (শতক)</div>
            <div className="w-1/2 text-center py-2">{formData.totalLand}</div>
          </div>
        </div>

        {/* Collection Table */}
        <div className="mt-8">
          <h2 className="text-center font-bold mb-2 text-[15px]">আদায়ের বিবরণ</h2>
          <div className="border border-black overflow-hidden">
            <table className="w-full text-center border-collapse text-[11px]">
              <thead className="font-bold bg-gray-50">
                <tr className="border-b border-black">
                  <th className="border-r border-black py-3 px-1 w-[12%]">তিন বৎসরের ঊর্ধ্বে বকেয়া</th>
                  <th className="border-r border-black px-1 w-[12%]">গত তিন বৎসরের বকেয়া</th>
                  <th className="border-r border-black px-1 w-[12%]">বকেয়ার সুদ ও ক্ষতিপূরণ</th>
                  <th className="border-r border-black px-1 w-[12%]">হাল দাবি</th>
                  <th className="border-r border-black px-1 w-[12%]">মোট দাবি</th>
                  <th className="border-r border-black px-1 w-[12%]">মোট আদায়</th>
                  <th className="border-r border-black px-1 w-[12%]">মোট বকেয়া</th>
                  <th className="px-1">মন্তব্য</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-14 text-[15px]">
                  <td className="border-r border-black">{formData.arrear3Plus}</td>
                  <td className="border-r border-black">{formData.arrearLast3}</td>
                  <td className="border-r border-black">{formData.interest}</td>
                  <td className="border-r border-black">{formData.currentDemand}</td>
                  <td className="border-r border-black font-bold">{formData.totalDemand}</td>
                  <td className="border-r border-black font-bold">{formData.totalCollect}</td>
                  <td className="border-r border-black">{formData.totalArrear}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 space-y-6">
          <div className="border-b-2 border-black border-dotted pb-2">
            <span className="font-bold text-[14px]">সর্বমোট (কথায়):</span> <span className="italic ml-2 text-[14px]">{formData.inWords}</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="space-y-2 text-[13px]">
              <p>নোট: সর্বশেষ কর পরিশোধের সাল - <span className="font-bold">{formData.note}</span> (অর্থবছর)</p>
              <p>চালান নং: <span className="font-bold">{formData.chalanNo}</span></p>
              <div className="flex gap-2">
                <p>তারিখ:</p>
                <div>
                  <p className="border-b border-dotted border-black px-4">{formData.dateBn} (বাংলা)</p>
                  <p className="border-b border-dotted border-black px-4 mt-1">{formData.dateEn} (ইংরেজি)</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
               <div className="p-1  mb-2 bg-white">
                  <QRCodeSVG value={qrValue} size={90} />
               </div>
               <p className="text-[10px] text-center leading-tight max-w-[200px] font-sans font-medium">
                 এই দাখিলা ইলেকট্রনিকভাবে তৈরি করা হয়েছে,<br/>কোন স্বাক্ষরের প্রয়োজন নেই।
               </p>
            </div>
          </div>
        </div>

      </div>

<style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { 
            margin: 0; 
            padding: 0; 
            -webkit-print-color-adjust: exact; 
            font-family: 'SolaimanLipi', 'Kalpurush', sans-serif;
          }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:max-w-full { max-width: 100% !important; }
          .print\\:w-\\[210mm\\] { width: 210mm !important; }
          .print\\:h-\\[297mm\\] { height: 297mm !important; }
        }
      `}} />
    </div>
  );
}

export default Vomionnoyonprint;