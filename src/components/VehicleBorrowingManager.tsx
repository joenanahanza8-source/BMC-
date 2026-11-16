import React, { useState } from 'react';
import { VehicleBorrowing, VehicleBorrowingStatus, Player } from '../types';
import {
  Car,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Calendar,
  XCircle,
  Trash2,
  Filter,
  RotateCcw,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  ArrowRightLeft,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VehicleBorrowingManagerProps {
  borrowings: VehicleBorrowing[];
  players?: Player[];
  onAddBorrowing: (data: Omit<VehicleBorrowing, 'id' | 'createdAt'>) => void;
  onUpdateStatus: (id: string, status: VehicleBorrowingStatus, returnDateTime?: string) => void;
  onDeleteBorrowing: (id: string) => void;
  isAdmin?: boolean;
}

const PRESET_DEPARTMENTS = [
  'แผนกบริหาร',
  'แผนกจัดเลี้ยง/สวัสดิการ',
  'แผนกไอที',
  'แผนกสถานที่ & สนาม',
  'แผนกการตลาด',
  'แผนกจัดซื้อ'
];

const PRESET_VEHICLES = [
  'รถตู้ก๊วนแบด (กข-1234 กทม)',
  'รถเก๋งส่วนกลาง (ขก-5678 นนทบุรี)',
  'รถกระบะขนอุปกรณ์ (ฮฮ-9999 กทม)',
  'รถ SUV ผู้บริหาร (งง-8888 กทม)'
];

export default function VehicleBorrowingManager({
  borrowings,
  players = [],
  onAddBorrowing,
  onUpdateStatus,
  onDeleteBorrowing,
  isAdmin = true,
}: VehicleBorrowingManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VehicleBorrowingStatus>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Form inputs
  const [department, setDepartment] = useState('');
  const [vehicleName, setVehicleName] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  
  // Format current date-time for datetime-local default
  const getCurrentDateTimeLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [borrowDateTime, setBorrowDateTime] = useState(getCurrentDateTimeLocal());
  const [returnDateTime, setReturnDateTime] = useState('');
  const [purpose, setPurpose] = useState('');

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!department.trim() || !vehicleName.trim() || !borrowerName.trim() || !borrowDateTime) {
      alert('กรุณากรอกข้อมูล แผนก, รถยนต์, ผู้ยืม และ วันเวลาที่ยืม ให้ครบถ้วน');
      return;
    }

    onAddBorrowing({
      department: department.trim(),
      vehicleName: vehicleName.trim(),
      borrowerName: borrowerName.trim(),
      borrowDateTime,
      returnDateTime: returnDateTime || undefined,
      purpose: purpose.trim() || undefined,
      status: 'borrowed',
    });

    // Reset Form
    setDepartment('');
    setVehicleName('');
    setBorrowerName('');
    setBorrowDateTime(getCurrentDateTimeLocal());
    setReturnDateTime('');
    setPurpose('');
    setIsFormOpen(false);
  };

  // Quick Return Handler
  const handleMarkReturned = (id: string) => {
    const nowStr = getCurrentDateTimeLocal();
    onUpdateStatus(id, 'returned', nowStr);
  };

  // Stats calculation
  const activeBorrowedCount = borrowings.filter((b) => b.status === 'borrowed').length;
  const returnedCount = borrowings.filter((b) => b.status === 'returned').length;
  const totalCount = borrowings.length;

  // Department List for Filter
  const availableDepartments = Array.from(new Set(borrowings.map((b) => b.department))).filter(Boolean);

  // Filtered List
  const filteredBorrowings = borrowings.filter((b) => {
    const matchesSearch =
      b.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.borrowerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.purpose && b.purpose.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchesDept = deptFilter === 'all' || b.department === deptFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Date Formatting Helper
  const formatThaiDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '-';
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return dateTimeStr;
      return date.toLocaleString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' น.';
    } catch {
      return dateTimeStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Title */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
              <Car className="w-3.5 h-3.5" />
              <span>Daily Vehicle Logbook</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              รายการยืมรถประจำวัน
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              ระบบลงทะเบียนและติดตามการยืม-คืนยานพาหนะประจำวัน กำหนดแผนก รถยนต์ ผู้ยืม และวันเวลาที่ยืม
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-95 shrink-0 cursor-pointer"
          >
            {isFormOpen ? (
              <>
                <XCircle className="w-4 h-4" />
                <span>ปิดฟอร์ม</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>+ เพิ่มรายการยืมรถ</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">กำลังยืมอยู่ปัจจุบัน</p>
              <p className="text-2xl font-black text-amber-400 mt-0.5">{activeBorrowedCount} คัน</p>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">คืนรถเรียบร้อยแล้ว</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">{returnedCount} คัน</p>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-md rounded-2xl p-4 border border-slate-700/50 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400">รายการยืมรวมทั้งหมด</p>
              <p className="text-2xl font-black text-white mt-0.5">{totalCount} รายการ</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Borrowing Form Panel */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-base">
                  <Car className="w-5 h-5 text-indigo-600" />
                  <span>บันทึกการยืมรถประจำวัน</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">* กรอกข้อมูลตามจริง</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* แผนก (Department) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>แผนก (Department) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="ระบุชื่อแผนก เช่น แผนกบริหาร, แผนกจัดเลี้ยง..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-semibold outline-none transition"
                    />
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_DEPARTMENTS.map((dept) => (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setDepartment(dept)}
                          className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition font-bold"
                        >
                          + {dept}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* รถยนต์ (Vehicle Name / Plate) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-indigo-600" />
                      <span>รถยนต์ / ทะเบียนรถ (Vehicle) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleName}
                      onChange={(e) => setVehicleName(e.target.value)}
                      placeholder="ระบุรุ่น/ทะเบียนรถ เช่น รถตู้ก๊วนแบด (กข-1234)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-semibold outline-none transition"
                    />
                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_VEHICLES.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVehicleName(v)}
                          className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-lg transition font-bold"
                        >
                          + {v.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* วันเวลาที่ยืม (Borrow Date & Time) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>วันเวลาที่ยืม (Borrow Date & Time) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={borrowDateTime}
                      onChange={(e) => setBorrowDateTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-semibold outline-none transition"
                    />
                  </div>

                  {/* ผู้ยืม (Borrower Name) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>ผู้ยืม (Borrower Name) <span className="text-rose-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      value={borrowerName}
                      onChange={(e) => setBorrowerName(e.target.value)}
                      placeholder="ระบุชื่อ-นามสกุล ผู้ยืมรถ"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-semibold outline-none transition"
                    />
                    {/* Preset from active players if any */}
                    {players.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-400 self-center font-medium">ผู้เล่นในก๊วน:</span>
                        {players.slice(0, 5).map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setBorrowerName(p.name)}
                            className="text-[11px] px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-md transition font-semibold"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* คาดว่าจะคืน (Expected Return Time - Optional) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>คาดว่าจะคืน / คืนเมื่อ (Expected Return Time) <span className="text-slate-400 font-normal">(ถ้ามี)</span></span>
                    </label>
                    <input
                      type="datetime-local"
                      value={returnDateTime}
                      onChange={(e) => setReturnDateTime(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-semibold outline-none transition"
                    />
                  </div>

                  {/* วัตถุประสงค์ (Purpose - Optional) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>วัตถุประสงค์ / หมายเหตุการใช้รถ</span>
                    </label>
                    <input
                      type="text"
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="เช่น ขนส่งอุปกรณ์ก๊วนแบด, เดินทางไปรับแขก VIP..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-sm font-semibold outline-none transition"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-sm rounded-2xl transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                  >
                    บันทึกรายการยืมรถ
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาตามแผนก, รถยนต์, ผู้ยืม..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold outline-none transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>สถานะ:</span>
          </div>
          
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ทั้งหมด ({borrowings.length})
          </button>
          <button
            onClick={() => setStatusFilter('borrowed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              statusFilter === 'borrowed'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            กำลังยืม ({activeBorrowedCount})
          </button>
          <button
            onClick={() => setStatusFilter('returned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
              statusFilter === 'returned'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            คืนแล้ว ({returnedCount})
          </button>

          {/* Department Filter Dropdown */}
          {availableDepartments.length > 0 && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="ml-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">ทุกแผนก ({availableDepartments.length})</option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Borrowings List */}
      {filteredBorrowings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">ไม่พบรายการยืมรถ</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' || deptFilter !== 'all'
              ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหาหรือฟิลเตอร์'
              : 'กดปุ่ม "+ เพิ่มรายการยืมรถ" เพื่อเริ่มบันทึกข้อมูลการยืมรถประจำวัน'}
          </p>
          {!isFormOpen && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              เพิ่มรายการยืมรถแรก
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBorrowings.map((b) => (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`bg-white rounded-3xl p-6 border shadow-sm transition-all duration-200 relative flex flex-col justify-between ${
                b.status === 'borrowed'
                  ? 'border-amber-200 ring-2 ring-amber-400/20 shadow-amber-500/5'
                  : b.status === 'returned'
                  ? 'border-slate-200/90 hover:border-emerald-200'
                  : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              <div className="space-y-4">
                {/* Card Top Header: Status & Actions */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                      b.status === 'borrowed'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300/60'
                        : b.status === 'returned'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/60'
                        : 'bg-slate-200 text-slate-600 border border-slate-300'
                    }`}
                  >
                    {b.status === 'borrowed' && (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        <span>กำลังยืมอยู่ (Active)</span>
                      </>
                    )}
                    {b.status === 'returned' && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>คืนรถแล้ว (Returned)</span>
                      </>
                    )}
                    {b.status === 'cancelled' && (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>ยกเลิก (Cancelled)</span>
                      </>
                    )}
                  </span>

                  {/* Delete button for Admin */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm(`ยืนยันการลบรายการยืมรถของ "${b.borrowerName}" (${b.vehicleName})?`)) {
                          onDeleteBorrowing(b.id);
                        }
                      }}
                      className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="ลบรายการ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Details Grid */}
                <div className="space-y-2.5">
                  {/* Department & Vehicle */}
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 mt-0.5">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                          {b.department}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-slate-900 mt-1 leading-snug">
                        {b.vehicleName}
                      </h4>
                    </div>
                  </div>

                  {/* Borrower & Time Info */}
                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-500" /> ผู้ยืม
                      </span>
                      <p className="font-extrabold text-slate-800 truncate">{b.borrowerName}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> วันเวลาที่ยืม
                      </span>
                      <p className="font-bold text-slate-700 text-[11px]">
                        {formatThaiDateTime(b.borrowDateTime)}
                      </p>
                    </div>
                  </div>

                  {/* Return DateTime if exists */}
                  {b.returnDateTime && (
                    <div className="bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-100 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 block">
                          {b.status === 'returned' ? 'คืนรถเมื่อ:' : 'กำหนดคืน:'}
                        </span>
                        <span className="font-extrabold text-emerald-900 text-[11px]">
                          {formatThaiDateTime(b.returnDateTime)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Purpose / Note */}
                  {b.purpose && (
                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-2xl border border-slate-100/80 italic">
                      " {b.purpose} "
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              {b.status === 'borrowed' && (
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onUpdateStatus(b.id, 'cancelled')}
                    className="text-xs font-extrabold text-slate-400 hover:text-slate-600 px-3 py-1.5 rounded-xl transition"
                  >
                    ยกเลิกรายการ
                  </button>
                  <button
                    onClick={() => handleMarkReturned(b.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/15 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>บันทึกคืนรถ</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
