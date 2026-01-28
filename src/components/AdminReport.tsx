import React, { useState, useEffect } from 'react';
import api from '../utils/axiosInstance';
import {
  showSuccess,
  showError,
  showWarning,
  showInfo
} from '../utils/toast';

const AdminReport = () => {
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const fetchReport = async () => {
    // ===== Validate input =====
    if (month < 1 || month > 12) {
      showWarning("Tháng phải nằm trong khoảng từ 1 đến 12");
      return;
    }

    if (year < 2000) {
      showWarning("Năm không hợp lệ");
      return;
    }

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

      showSuccess(`Tạo báo cáo tháng ${month}/${year} thành công`);
    } catch (error: any) {
      console.error("Lỗi tải báo cáo:", error);

      if (!error.response) {
        showError("Không thể kết nối tới máy chủ");
      } else if (error.response.status === 404) {
        showWarning("Không có dữ liệu báo cáo cho thời gian đã chọn");
      } else if (error.response.status === 403) {
        showError("Bạn không có quyền truy cập báo cáo này");
      } else {
        showError("Lỗi hệ thống khi tạo báo cáo");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFile = () => {
    if (!pdfUrl) {
      showWarning("Chưa có file báo cáo để tải");
      return;
    }

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.setAttribute('download', `admin-report-${month}-${year}.pdf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess("Tải file PDF thành công");
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(Number(e.target.value));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setYear(Number(e.target.value));
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50">
      {/* ===== Toolbar ===== */}
      <div className="bg-white p-4 rounded shadow-md mb-4 flex flex-wrap items-end gap-4">
        <h2 className="text-xl font-bold text-gray-800 mr-4 self-center">
          Báo Cáo Tháng
        </h2>

        <div>
          <label className="block text-xs font-semibold text-gray-500">Tháng</label>
          <input
            type="number"
            min="1"
            max="12"
            value={month}
            onChange={handleMonthChange}
            className="w-20 p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500">Năm</label>
          <input
            type="number"
            value={year}
            onChange={handleYearChange}
            className="w-24 p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={fetchReport}
          disabled={loading}
          className={`px-4 py-2 rounded text-white font-medium transition
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Đang tải...' : ' Xem Báo Cáo'}
        </button>

        {pdfUrl && (
          <button
            onClick={handleDownloadFile}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium flex items-center gap-2"
          >
            Tải File PDF
          </button>
        )}
      </div>

      {/* ===== Preview ===== */}
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
