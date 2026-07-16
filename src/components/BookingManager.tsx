import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Court } from '../types';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Trash2,
  Lock,
  Unlock,
  Plus,
  AlertCircle,
  FileText,
  Check,
  CalendarDays,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BookingManagerProps {
  courts: Court[];
  bookings: Booking[];
  onAddBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  onConfirmBooking: (id: string) => void;
  onDeleteBooking: (id: string) => void;
  isAdmin: boolean;
}

const PRESET_TIME_SLOTS = [
  '06:00 - 08:00',
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00',
  '22:00 - 24:00',
];

// Helper to check if a specific slot on a date is in the past
const isSlotInPast = (dateStr: string, slotStr: string) => {
  const now = new Date();
  
  // Format today's local date as YYYY-MM-DD
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  
  if (dateStr < todayStr) {
    return true;
  }
  if (dateStr > todayStr) {
    return false;
  }
  
  // For today, check slot start time (e.g. "18:00 - 20:00" -> "18:00")
  const startTimeStr = slotStr.split(' - ')[0];
  const [slotHour, slotMinute] = startTimeStr.split(':').map(Number);
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  if (currentHour > slotHour) {
    return true;
  }
  if (currentHour === slotHour && currentMinute >= slotMinute) {
    return true;
  }
  
  return false;
};

export default function BookingManager({
  courts,
  bookings,
  onAddBooking,
  onConfirmBooking,
  onDeleteBooking,
  isAdmin,
}: BookingManagerProps) {
  // Use the admin status passed from parent
  const isAdminMode = isAdmin;
  
  // Form states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedCourtId, setSelectedCourtId] = useState<string>(courts[0]?.id || 'c1');
  
  // Default to the first future/available slot for today
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const available = PRESET_TIME_SLOTS.find(slot => !isSlotInPast(todayStr, slot));
    return available || PRESET_TIME_SLOTS[PRESET_TIME_SLOTS.length - 1];
  });

  const [bookerName, setBookerName] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Auto-adjust selected time slot if it becomes invalid (in the past) due to changing the date to today
  useEffect(() => {
    if (isSlotInPast(selectedDate, selectedTimeSlot)) {
      const available = PRESET_TIME_SLOTS.find((slot) => !isSlotInPast(selectedDate, slot));
      if (available) {
        setSelectedTimeSlot(available);
      }
    }
  }, [selectedDate, selectedTimeSlot]);

  // Date lists for quick selection (next 7 days)
  const quickDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      dates.push({
        iso: nextDate.toISOString().split('T')[0],
        label: nextDate.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }),
        isToday: i === 0,
      });
    }
    return dates;
  }, []);

  // Filtered booking list based on search or selected date
  const [viewFilter, setViewFilter] = useState<'all' | 'byDate'>('all');

  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (viewFilter === 'byDate') {
      result = result.filter((b) => b.date === selectedDate);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.bookerName.toLowerCase().includes(q) ||
          b.phoneNumber.includes(q) ||
          b.timeSlot.includes(q) ||
          (courts.find((c) => c.id === b.courtId)?.name || '').toLowerCase().includes(q)
      );
    }

    // Sort by Date, then Time Slot start
    return [...result].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  }, [bookings, selectedDate, viewFilter, searchQuery, courts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!bookerName.trim()) {
      setErrorMsg('กรุณากรอกชื่อผู้จอง');
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('กรุณากรอกเบอร์โทรติดต่อ');
      return;
    }

    // Check if the selected time slot is already in the past
    if (isSlotInPast(selectedDate, selectedTimeSlot)) {
      setErrorMsg('ขออภัย! ไม่สามารถจองช่วงเวลาที่ผ่านมาแล้วได้');
      return;
    }

    // Check conflict for the same court, date, and time slot
    const conflict = bookings.find(
      (b) =>
        b.courtId === selectedCourtId &&
        b.date === selectedDate &&
        b.timeSlot === selectedTimeSlot
    );

    if (conflict) {
      const courtName = courts.find((c) => c.id === selectedCourtId)?.name || 'สนาม';
      setErrorMsg(`ขออภัย! ${courtName} ในวันและเวลาดังกล่าวถูกจองไว้แล้ว`);
      return;
    }

    // Add booking (if in admin mode, default to confirmed; otherwise pending)
    onAddBooking({
      courtId: selectedCourtId,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      bookerName: bookerName.trim(),
      phoneNumber: phoneNumber.trim(),
      status: isAdminMode ? 'confirmed' : 'pending',
    });

    setBookerName('');
    setPhoneNumber('');
    setSuccessMsg(
      isAdminMode
        ? 'จองสนามสำเร็จและได้รับการอนุมัติทันที!'
        : 'ส่งคำขอจองสนามแล้ว รอยืนยันโดยแอดมิน'
    );

    // Auto clear success message
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const currentCourtName = useMemo(() => {
    return courts.find((c) => c.id === selectedCourtId)?.name || '';
  }, [courts, selectedCourtId]);

  return (
    <div id="booking-manager" className="space-y-8 pb-12">
      {/* Top Admin mode controller and Info Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10 pointer-events-none">
          <CalendarDays className="w-64 h-64 text-white" />
        </div>
        
        <div className="space-y-2 z-10">
          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Court Reservation System
          </span>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            ระบบจองสนามล่วงหน้า 🐯
          </h2>
          <p className="text-slate-300 text-sm max-w-xl">
            สมาชิกสามารถส่งคำขอจองสนาม ระบุวัน เวลา รายชื่อ และเบอร์ติดต่อ โดยผู้ใช้ทั่วไปส่งเป็นแบบ "รอยืนยัน" และจะอนุมัติได้โดย <span className="text-amber-400 font-extrabold">แอดมิน</span> เท่านั้น
          </p>
        </div>

        {/* Beautiful Admin Mode Status */}
        <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-slate-700 flex items-center gap-4 z-10 shrink-0">
          <div className="flex items-center gap-2.5">
            {isAdminMode ? (
              <Unlock className="w-5 h-5 text-amber-400 animate-pulse animate-duration-1000" />
            ) : (
              <Lock className="w-5 h-5 text-slate-400" />
            )}
            <div className="text-left">
              <p className="text-xs font-bold text-slate-400">สิทธิ์ผู้ใช้งานปัจจุบัน</p>
              <p className="text-sm font-black text-white">
                {isAdminMode ? '👑 แอดมิน (joe.nana.hanza8@gmail.com)' : '👤 ผู้เยี่ยมชม (อ่านอย่างเดียว)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Layout: Create Booking Form on Left, Bookings Table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Booking Form (Left, Span 5) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              กรอกข้อมูลการจองสนาม
            </h3>
            <p className="text-slate-400 text-xs">ระบุวันที่ เวลา และรายละเอียดเพื่อสำรองคอร์ท</p>
          </div>

          <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
            {/* 1. Select Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">1. เลือกวันที่สำรองสนาม</label>
              
              {/* Quick Date Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                {quickDates.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setSelectedDate(d.iso)}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border ${
                      selectedDate === d.iso
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    {d.isToday ? 'วันนี้' : ''} {d.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Picker */}
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-slate-50 border border-slate-200/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700"
                />
              </div>
            </div>

            {/* 2. Select Court */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">2. เลือกสนาม</label>
              <div className="grid grid-cols-2 gap-2">
                {courts.map((court) => (
                  <button
                    key={court.id}
                    type="button"
                    onClick={() => setSelectedCourtId(court.id)}
                    className={`py-3 px-4 rounded-xl text-xs font-extrabold transition-all border flex flex-col items-center justify-center gap-1 ${
                      selectedCourtId === court.id
                        ? 'bg-orange-50 text-orange-700 border-orange-200 shadow-sm shadow-orange-500/5 font-black'
                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm">🏸 {court.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Select Time Slot */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 block">3. เลือกช่วงเวลาแข่งขัน</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRESET_TIME_SLOTS.map((slot) => {
                  const isConflicting = bookings.some(
                    (b) => b.courtId === selectedCourtId && b.date === selectedDate && b.timeSlot === slot
                  );
                  const isPast = isSlotInPast(selectedDate, slot);
                  const isDisabled = isConflicting || isPast;

                  let slotClass = '';
                  if (isPast) {
                    slotClass = 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-60';
                  } else if (isConflicting) {
                    slotClass = 'bg-red-50 text-red-300 border-red-100/50 cursor-not-allowed line-through';
                  } else if (selectedTimeSlot === slot) {
                    slotClass = 'bg-slate-900 text-white border-transparent font-black scale-102 shadow';
                  } else {
                    slotClass = 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100';
                  }

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`py-2 px-1.5 rounded-lg text-[11px] font-semibold text-center transition-all border flex flex-col items-center justify-center relative ${slotClass}`}
                    >
                      <span>{slot}</span>
                      {isPast ? (
                        <span className="absolute text-[8px] font-bold text-slate-500 bottom-0.5 bg-slate-300/80 px-1 rounded">ผ่านแล้ว</span>
                      ) : isConflicting ? (
                        <span className="absolute text-[8px] font-bold text-red-500 bottom-0.5 bg-red-100/80 px-1 rounded">เต็ม</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Booker Information */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  รายชื่อผู้จอง
                </label>
                <input
                  type="text"
                  placeholder="เช่น สมศักดิ์ ใจดี (ก๊วนวันศุกร์)"
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  className="w-full bg-white border border-slate-200/60 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  เบอร์โทรติดต่อ
                </label>
                <input
                  type="tel"
                  placeholder="เช่น 081-234-5678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200/60 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Error and Success alerts */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <button
              id="submit-booking-btn"
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/10 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isAdminMode ? 'บันทึกจองสนามสำเร็จ (แอดมิน)' : 'ส่งคำขอจองสนามสนาม'}
            </button>
            <p className="text-[10px] text-center text-slate-400 leading-normal">
              *หากไม่ได้เปิดโหมดแอดมิน คำจองจะอยู่ในสถานะ "รอยืนยัน" เพื่อให้แอดมินกดอนุมัติเท่านั้น
            </p>
          </form>
        </div>

        {/* Bookings List (Right, Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  รายการจองสนามทั้งหมด ({filteredBookings.length})
                </h3>
                <p className="text-slate-400 text-xs">ตารางการจองสนามแบดมินตันล่วงหน้าของก๊วน</p>
              </div>

              {/* View filter toggles */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-extrabold gap-1 self-start sm:self-auto shrink-0">
                <button
                  onClick={() => setViewFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    viewFilter === 'all'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setViewFilter('byDate')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    viewFilter === 'byDate'
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  เฉพาะวันเลือก ({selectedDate.split('-').slice(1).join('/')})
                </button>
              </div>
            </div>

            {/* Search filter input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="🔍 ค้นหาตามชื่อผู้จอง, เบอร์โทร, หรือสนาม..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-400 text-slate-700"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-bold"
                >
                  ล้างค่า
                </button>
              )}
            </div>

            {/* Bookings Display Container */}
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">ยังไม่มีรายการจองสนามในช่วงนี้</p>
                <p className="text-[10px] text-slate-300 mt-1">คุณสามารถกรอกข้อมูลการสำรองสนามที่แบบฟอร์มด้านซ้ายได้เลย</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {filteredBookings.map((booking) => {
                    const courtName = courts.find((c) => c.id === booking.courtId)?.name || 'สนาม';
                    const bookingDateObj = new Date(booking.date);
                    const formattedDate = bookingDateObj.toLocaleDateString('th-TH', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: '2-digit',
                    });

                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 border rounded-2xl transition-all relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-50/20 border-emerald-100/50 hover:border-emerald-200'
                            : 'bg-amber-50/20 border-amber-100/50 hover:border-amber-200'
                        }`}
                      >
                        {/* Status sidebar accent bar */}
                        <div
                          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                            booking.status === 'confirmed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                          }`}
                        />

                        {/* Booking Details (Left) */}
                        <div className="pl-2 space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-slate-800">
                              {booking.bookerName}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-400" />
                              {booking.phoneNumber}
                            </span>
                            
                            {/* Status badge */}
                            {booking.status === 'confirmed' ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                จองสำเร็จ (แอดมินยืนยันแล้ว)
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
                                รอยืนยันโดยแอดมิน
                              </span>
                            )}
                          </div>

                          {/* Court & Time Slot Row */}
                          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                            <span className="font-extrabold text-slate-700 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                              🏸 {courtName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {formattedDate}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {booking.timeSlot} น.
                            </span>
                          </div>
                        </div>

                        {/* Booking Actions (Right) */}
                        <div className="flex items-center gap-2 z-10 shrink-0 border-t border-slate-100 md:border-t-0 pt-3 md:pt-0">
                          {/* Admin Only Button to Approve Booking */}
                          {booking.status === 'pending' && (
                            <div className="relative group">
                              <button
                                disabled={!isAdminMode}
                                onClick={() => onConfirmBooking(booking.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                                  isAdminMode
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow shadow-emerald-600/10 active:scale-95 cursor-pointer'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed'
                                }`}
                              >
                                {isAdminMode ? (
                                  <Check className="w-4 h-4 text-white" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                จองสำเร็จ
                              </button>
                              
                              {/* Non-admin lock tooltip helper */}
                              {!isAdminMode && (
                                <div className="absolute right-0 bottom-full mb-2 bg-slate-900 text-white text-[10px] p-2 rounded-lg font-bold shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition duration-200 whitespace-nowrap z-50 flex items-center gap-1 border border-slate-700">
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                  สลับโหมดแอดมินด้านบน เพื่อกดจองสำเร็จ
                                </div>
                              )}
                            </div>
                          )}

                          {/* Delete/Cancel Button - Available to admin, or to guest for pending items */}
                          <button
                            onClick={() => {
                              if (booking.status === 'confirmed' && !isAdminMode) {
                                alert('การจองนี้ได้รับการยืนยันโดยแอดมินแล้ว ไม่สามารถยกเลิกเองได้ กรุณาติดต่อแอดมิน');
                                return;
                              }
                              if (confirm('คุณแน่ใจหรือไม่ที่จะลบรายการจองสนามคอร์ทนี้?')) {
                                onDeleteBooking(booking.id);
                              }
                            }}
                            className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-100/50 text-rose-500 rounded-xl transition"
                            title="ยกเลิกการจอง"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
