import React, { useState } from 'react';

const DownloadIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

/**
 * Export button with dropdown menu for export options
 * @param {Function} onExportExcel - Handler for Excel export
 * @param {Function} onExportCSV - Handler for CSV export
 * @param {string} filename - Default filename
 * @param {boolean} loading - Show loading state
 * @param {boolean} disabled - Disable the button
 */
const ExportButton = ({
  onExportExcel,
  onExportCSV,
  filename = 'export',
  loading = false,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExportExcel = () => {
    onExportExcel?.();
    setIsOpen(false);
  };

  const handleExportCSV = () => {
    onExportCSV?.();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <DownloadIcon className="w-4 h-4 mr-2" />
        {loading ? '导出中...' : '导出'}
        <ChevronDownIcon className="w-4 h-4 ml-1" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
            <button
              onClick={handleExportExcel}
              disabled={disabled || loading}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导出 Excel
            </button>
            <button
              onClick={handleExportCSV}
              disabled={disabled || loading}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导出 CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
