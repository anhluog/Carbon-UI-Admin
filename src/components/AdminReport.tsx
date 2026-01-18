import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInstance'; // Đảm bảo đường dẫn đúng

const AdminReport = () => {
  // Khởi tạo state là Number
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (pdfUrl) window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);

      const response = await api.get('/admin/reports/monthly', {
        params: { month, year },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);

    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
      // Có thể thêm thông báo lỗi UI ở đây
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.setAttribute('download', `admin-report-${month}-${year}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  // --- HÀM XỬ LÝ INPUT AN TOÀN ---
  const handleMonthChange = (e) => {
    // Ép kiểu về Number ngay lập tức
    const val = Number(e.target.value); 
    setMonth(val);
  };

  const handleYearChange = (e) => {
    const val = Number(e.target.value);
    setYear(val);
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50">
      <div className="bg-white p-4 rounded shadow-md mb-4 flex flex-wrap items-end gap-4">
        <h2 className="text-xl font-bold text-gray-800 mr-4 self-center">
          📊 Báo Cáo Tháng
        </h2>

        <div>
          <label className="block text-xs font-semibold text-gray-500">Tháng</label>
          <input 
            type="number" 
            min="1" max="12"
            value={month} 
            onChange={handleMonthChange} // Sử dụng hàm đã ép kiểu
            className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500">Năm</label>
          <input 
            type="number"
            value={year} 
            onChange={handleYearChange} // Sử dụng hàm đã ép kiểu
            className="w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button 
          onClick={fetchReport} 
          disabled={loading}
          className={`px-4 py-2 rounded text-white font-medium transition
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Đang tải...' : '🔍 Xem Báo Cáo'}
        </button>

        {pdfUrl && (
          <button 
            onClick={handleDownloadFile} 
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium flex items-center gap-2"
          >
            📥 Tải File PDF
          </button>
        )}
      </div>

      <div className="flex-1 bg-gray-200 border-2 border-dashed border-gray-400 rounded flex items-center justify-center relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
             <span className="text-lg font-semibold text-blue-600 animate-pulse">
                Đang tạo báo cáo...
             </span>
          </div>
        )}

        {pdfUrl ? (
          <iframe 
            src={pdfUrl} 
            className="w-full h-full" 
            title="PDF Preview"
            style={{ border: 'none' }}
          />
        ) : (
          <div className="text-gray-500 text-center select-none">
            <p className="text-4xl mb-2">📄</p>
            <p>Vui lòng chọn thời gian và bấm "Xem Báo Cáo"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReport;