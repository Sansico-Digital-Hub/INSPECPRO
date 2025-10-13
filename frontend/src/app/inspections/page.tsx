'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { inspectionsAPI } from '@/lib/api';
import { Inspection, InspectionStatus, UserRole } from '@/types';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, DocumentArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import SignatureCanvas from 'react-signature-canvas';
import Link from 'next/link';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DatePicker = ReactDatePicker as any;

function InspectionsContent() {
  const { user, logout } = useAuth();
  const { isCollapsed } = useSidebar();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchInspections();
  }, [statusFilter]);

  const fetchInspections = async () => {
    try {
      const data = await inspectionsAPI.getInspections({
        status_filter: statusFilter === 'all' ? undefined : statusFilter
      });
      setInspections(data);
      setFilteredInspections(data);
    } catch (error) {
      console.error('Failed to fetch inspections:', error);
      toast.error('Failed to fetch inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredInspections(inspections);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = inspections.filter(inspection => 
        inspection.id.toString().includes(query) ||
        inspection.form_id.toString().includes(query) ||
        inspection.inspector_id.toString().includes(query) ||
        inspection.status.toLowerCase().includes(query)
      );
      setFilteredInspections(filtered);
    }
  }, [searchQuery, inspections]);

  const handleStatusUpdate = async (inspectionId: number, status: InspectionStatus, rejectionReason?: string, reviewerSignature?: string) => {
    try {
      await inspectionsAPI.updateInspection(inspectionId, { 
        status, 
        rejection_reason: rejectionReason,
        reviewer_signature: reviewerSignature
      });
      toast.success(`Inspection ${status} successfully`);
      fetchInspections();
    } catch (error) {
      console.error('Failed to update inspection:', error);
      toast.error('Failed to update inspection');
    }
  };

  const handleDeleteInspection = async (inspectionId: number) => {
    if (confirm('Are you sure you want to delete this inspection?')) {
      try {
        await inspectionsAPI.deleteInspection(inspectionId);
        toast.success('Inspection deleted successfully');
        fetchInspections();
      } catch (error) {
        console.error('Failed to delete inspection:', error);
        toast.error('Failed to delete inspection');
      }
    }
  };

  const handleExportPDF = async (inspectionId: number) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });
      await inspectionsAPI.exportToPDF(inspectionId);
      toast.success('PDF exported successfully', { id: 'pdf-export' });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.loading('Generating Excel file...', { id: 'excel-export' });
      
      const params: any = {};
      
      if (startDate) {
        params.start_date = startDate.toISOString().split('T')[0];
      }
      
      if (endDate) {
        params.end_date = endDate.toISOString().split('T')[0];
      }
      
      if (statusFilter !== 'all') {
        params.status_filter = statusFilter;
      }
      
      await inspectionsAPI.exportToExcel(params);
      toast.success('Excel file exported successfully', { id: 'excel-export' });
      setShowExportModal(false);
    } catch (error: any) {
      console.error('Failed to export Excel:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to export Excel file';
      toast.error(errorMessage, { id: 'excel-export' });
    }
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case InspectionStatus.SUBMITTED:
        return 'bg-yellow-100 text-yellow-800';
      case InspectionStatus.ACCEPTED:
        return 'bg-green-100 text-green-800';
      case InspectionStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canReview = user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN;
  const canEdit = user?.role === UserRole.ADMIN;
  const canDelete = user?.role === UserRole.ADMIN;

  return (
    <>
      <Sidebar />
      
      <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.role === UserRole.USER ? 'My Inspections' : 'All Inspections'}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Export to Excel
              </button>
              {user?.role === UserRole.USER && (
                <Link
                  href="/inspections/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Inspection
                </Link>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search by ID, Form ID, Inspector ID, or Status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="border border-gray-300 rounded-md px-3 py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InspectionStatus | 'all')}
              >
                <option value="all">All Status</option>
                <option value={InspectionStatus.DRAFT}>Draft</option>
                <option value={InspectionStatus.SUBMITTED}>Submitted</option>
                <option value={InspectionStatus.ACCEPTED}>Accepted</option>
                <option value={InspectionStatus.REJECTED}>Rejected</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-800">Loading inspections...</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredInspections.map((inspection) => (
                  <li key={inspection.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-900">
                              #{inspection.id}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              Inspection #{inspection.id}
                            </div>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                              {inspection.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900">
                            Form ID: {inspection.form_id} | Inspector ID: {inspection.inspector_id}
                          </div>
                          <div className="text-sm text-gray-900">
                            Created: {new Date(inspection.created_at).toLocaleDateString()}
                            {inspection.reviewed_at && (
                              <span> | Reviewed: {new Date(inspection.reviewed_at).toLocaleDateString()}</span>
                            )}
                          </div>
                          {inspection.rejection_reason && (
                            <div className="text-sm text-red-600 mt-1">
                              Rejection Reason: {inspection.rejection_reason}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/inspections/${inspection.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>

                        <button
                          onClick={() => handleExportPDF(inspection.id)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Export to PDF"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        
                        {canReview && inspection.status === InspectionStatus.SUBMITTED && (
                          <>
                            <button
                              onClick={() => setShowAcceptModal(inspection.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Accept"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => setShowRejectModal(inspection.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}

                        {(canEdit || (user?.id === inspection.inspector_id && inspection.status === InspectionStatus.DRAFT)) && (
                          <Link
                            href={`/inspections/${inspection.id}/edit`}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                        )}

                        {(canDelete || (user?.id === inspection.inspector_id && inspection.status === InspectionStatus.DRAFT)) && (
                          <button
                            onClick={() => handleDeleteInspection(inspection.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {filteredInspections.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inspections</h3>
              <p className="mt-1 text-sm text-gray-900">
                {user?.role === UserRole.USER 
                  ? 'Get started by creating your first inspection.' 
                  : 'No inspections found with the current filter.'}
              </p>
              {user?.role === UserRole.USER && (
                <div className="mt-6">
                  <Link
                    href="/inspections/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    New Inspection
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showAcceptModal && (
        <AcceptModal
          inspectionId={showAcceptModal}
          onClose={() => setShowAcceptModal(null)}
          onAccept={(signature: string) => {
            handleStatusUpdate(showAcceptModal, InspectionStatus.ACCEPTED, undefined, signature);
            setShowAcceptModal(null);
          }}
        />
      )}

      {showRejectModal && (
        <RejectModal
          inspectionId={showRejectModal}
          onClose={() => setShowRejectModal(null)}
          onReject={(reason, signature) => {
            handleStatusUpdate(showRejectModal, InspectionStatus.REJECTED, reason, signature);
            setShowRejectModal(null);
          }}
        />
      )}

      {showExportModal && (
        <ExportExcelModal
          onClose={() => setShowExportModal(false)}
          onExport={handleExportExcel}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}
    </>
  );
}

export default function InspectionsPage() {
  return (
    <LayoutWrapper>
      <InspectionsContent />
    </LayoutWrapper>
  );
}

function AcceptModal({ 
  inspectionId, 
  onClose, 
  onAccept 
}: { 
  inspectionId: number; 
  onClose: () => void; 
  onAccept: (signature: string) => void; 
}) {
  const signatureRef = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const signature = signatureRef.current.toDataURL();
      onAccept(signature);
    } else {
      toast.error('Please provide your signature');
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Accept Inspection</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-sm text-green-800">
                You are about to accept this inspection. Please provide your signature to confirm.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Reviewer Signature *</label>
              <div className="border-2 border-gray-300 rounded-md">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-40 cursor-crosshair',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Signature
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Accept Inspection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ExportExcelModal({
  onClose,
  onExport,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  statusFilter,
  setStatusFilter
}: {
  onClose: () => void;
  onExport: () => void;
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  statusFilter: InspectionStatus | 'all';
  setStatusFilter: (status: InspectionStatus | 'all') => void;
}) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Export Inspections to Excel</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                Select date range and filters to export inspection data to Excel format.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Start Date
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select start date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  isClearable
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  End Date
                </label>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select end date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  isClearable
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Status Filter
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InspectionStatus | 'all')}
              >
                <option value="all">All Status</option>
                <option value={InspectionStatus.DRAFT}>Draft</option>
                <option value={InspectionStatus.SUBMITTED}>Submitted</option>
                <option value={InspectionStatus.ACCEPTED}>Accepted</option>
                <option value={InspectionStatus.REJECTED}>Rejected</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onExport}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ 
  inspectionId, 
  onClose, 
  onReject 
}: { 
  inspectionId: number; 
  onClose: () => void; 
  onReject: (reason: string, signature: string) => void; 
}) {
  const [reason, setReason] = useState('');
  const signatureRef = useRef<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim() && signatureRef.current && !signatureRef.current.isEmpty()) {
      const signature = signatureRef.current.toDataURL();
      onReject(reason, signature);
    } else {
      toast.error('Please provide both reason and signature');
    }
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Inspection</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900">Rejection Reason *</label>
              <textarea
                required
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Reviewer Signature *</label>
              <div className="border-2 border-gray-300 rounded-md">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-40 cursor-crosshair',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Signature
              </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Reject Inspection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
