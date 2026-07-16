import React, { useState, useRef, useEffect } from 'react';
import { Player, SkillLevel } from '../types';
import { PRESET_AVATARS } from '../utils/dummyData';
import { Plus, Search, Camera, Upload, Trash2, Edit2, Check, X, Users, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayerManagerProps {
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id' | 'createdAt' | 'status'>) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
}

export default function PlayerManager({
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
}: PlayerManagerProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatarBase64, setCustomAvatarBase64] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(true);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.error("Error playing video:", e));
      }
    } catch (err: any) {
      console.error(err);
      setCameraError('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งานกล้อง');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Capture Snapshot
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center crop and draw
        ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setCustomAvatarBase64(base64);
        setAvatar(base64);
        stopCamera();
      }
    }
  };

  // Handle Image File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Compress image using canvas
        const img = new Image();
        img.src = result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setCustomAvatarBase64(compressedBase64);
            setAvatar(compressedBase64);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPlayerId) {
      onUpdatePlayer(editingPlayerId, {
        name: name.trim(),
        skillLevel,
        avatar,
        isCheckedIn,
      });
      setEditingPlayerId(null);
    } else {
      onAddPlayer({
        name: name.trim(),
        skillLevel,
        avatar,
        isCheckedIn,
      });
    }

    // Reset Form
    setName('');
    setSkillLevel('intermediate');
    setAvatar(PRESET_AVATARS[0]);
    setCustomAvatarBase64(null);
    setIsCheckedIn(true);
    setShowAddForm(false);
  };

  const handleEditClick = (player: Player) => {
    setEditingPlayerId(player.id);
    setName(player.name);
    setSkillLevel(player.skillLevel);
    setAvatar(player.avatar);
    setIsCheckedIn(player.isCheckedIn);
    if (!PRESET_AVATARS.includes(player.avatar)) {
      setCustomAvatarBase64(player.avatar);
    } else {
      setCustomAvatarBase64(null);
    }
    setShowAddForm(true);
  };

  const handleCancel = () => {
    stopCamera();
    setName('');
    setSkillLevel('intermediate');
    setAvatar(PRESET_AVATARS[0]);
    setCustomAvatarBase64(null);
    setIsCheckedIn(true);
    setEditingPlayerId(null);
    setShowAddForm(false);
  };

  // Filter players
  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const skillLevelLabel = (level: SkillLevel) => {
    switch (level) {
      case 'beginner':
        return { text: 'มือใหม่', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'intermediate':
        return { text: 'มือกลาง', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'advanced':
        return { text: 'มือโปร', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }
  };

  const playerStatusLabel = (status: Player['status'], isCheckedIn: boolean) => {
    if (!isCheckedIn) {
      return { text: 'ไม่ได้ลงสนามวันนี้', color: 'bg-gray-100 text-gray-400' };
    }
    switch (status) {
      case 'available':
        return { text: 'พร้อมเล่น', color: 'bg-emerald-500 text-white animate-pulse' };
      case 'playing':
        return { text: 'กำลังแข่งอยู่', color: 'bg-sky-500 text-white' };
      case 'waiting':
        return { text: 'รอลงสนาม', color: 'bg-amber-500 text-white' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" id="player-title-icon" />
            จัดการรายชื่อผู้เล่น ({players.length} คน)
          </h2>
          <p className="text-slate-500 text-sm">
            จัดการผู้เล่นประจำวัน ลงชื่อเข้าร่วม และอัปโหลดรูปภาพผู้เล่น
          </p>
        </div>
        <button
          id="btn-add-player"
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (showAddForm) handleCancel();
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition font-medium text-sm self-start sm:self-auto"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? 'ปิดแบบฟอร์ม' : 'เพิ่มผู้เล่นใหม่'}
        </button>
      </div>

      {/* Add / Edit Form */}
      <AnimatePresence mode="wait">
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-6"
          >
            <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              {editingPlayerId ? 'แก้ไขข้อมูลผู้เล่น' : 'ข้อมูลผู้เล่นใหม่'}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Photo Upload & Select */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    รูปโปรไฟล์ผู้เล่น
                  </label>
                  <div className="flex flex-col items-center gap-4 bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500 bg-white">
                      <img
                        referrerPolicy="no-referrer"
                        src={avatar}
                        alt="Preview"
                        className="w-full h-full object-crop object-center"
                      />
                    </div>

                    {/* Camera View */}
                    {isCameraActive && (
                      <div className="relative flex flex-col items-center bg-black rounded-lg p-2 overflow-hidden w-full max-w-[240px]">
                        <video
                          ref={videoRef}
                          className="w-full h-auto rounded"
                          playsInline
                          muted
                        />
                        <div className="flex gap-2 mt-2 w-full">
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 text-white rounded text-xs font-semibold"
                          >
                            กดถ่ายรูป
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="py-1.5 px-3 bg-slate-700 text-white rounded text-xs font-semibold"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}

                    {cameraError && (
                      <div className="flex items-center gap-1.5 text-rose-600 text-xs p-2 bg-rose-50 rounded">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                    )}

                    {/* Image Source Buttons */}
                    <div className="flex gap-2 w-full justify-center">
                      <button
                        type="button"
                        onClick={isCameraActive ? stopCamera : startCamera}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {isCameraActive ? 'ปิดกล้อง' : 'เปิดกล้องถ่ายรูป'}
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        อัปโหลดรูป
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Preset Selector */}
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-slate-500 block">
                      หรือเลือกจากรูปที่มีอยู่:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_AVATARS.map((av, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setAvatar(av);
                            stopCamera();
                          }}
                          className={`relative rounded-full overflow-hidden border-2 transition ${
                            avatar === av ? 'border-emerald-500 scale-105' : 'border-transparent hover:border-slate-300'
                          }`}
                        >
                          <img referrerPolicy="no-referrer" src={av} alt="Preset" className="w-10 h-10 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <label htmlFor="player-name" className="block text-sm font-medium text-slate-700 mb-1">
                      ชื่อ-นามสกุล / ชื่อเล่น
                    </label>
                    <input
                      id="player-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น สมชาย มีพลัง"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      ระดับฝีมือการเล่น (สำหรับใช้จัดทีมบาลานซ์)
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['beginner', 'intermediate', 'advanced'] as SkillLevel[]).map((level) => {
                        const info = skillLevelLabel(level);
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setSkillLevel(level)}
                            className={`py-3 px-4 rounded-xl border text-sm font-medium text-center transition flex flex-col items-center justify-center gap-1 ${
                              skillLevel === level
                                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                            }`}
                          >
                            <span className="font-semibold">
                              {level === 'beginner' ? 'มือใหม่' : level === 'intermediate' ? 'มือกลาง' : 'มือโปร'}
                            </span>
                            <span className="text-[10px] opacity-75">
                              {level === 'beginner' ? 'Beginner' : level === 'intermediate' ? 'Intermediate' : 'Advanced'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <input
                      id="player-checkin"
                      type="checkbox"
                      checked={isCheckedIn}
                      onChange={(e) => setIsCheckedIn(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="player-checkin" className="text-sm font-medium text-slate-700 select-none">
                      ลงชื่อเช็กอินสนามวันนี้ทันที (มีส่วนร่วมในการคิดหารค่าใช้จ่ายสนามวันนี้)
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 transition text-sm font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition text-sm font-semibold"
                >
                  {editingPlayerId ? 'บันทึกการแก้ไข' : 'บันทึกผู้เล่น'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Stats Card */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้เล่น..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 focus:border-emerald-500 text-sm"
          />
        </div>

        {/* Quick summary status */}
        <div className="flex gap-4 text-xs font-medium text-slate-500 self-stretch md:self-auto justify-around border-t md:border-t-0 pt-3 md:pt-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>เช็กอิน: {players.filter((p) => p.isCheckedIn).length} คน</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
            <span>ยังไม่มา: {players.filter((p) => !p.isCheckedIn).length} คน</span>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
            ไม่พบรายชื่อผู้เล่นที่ค้นหา
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const skill = skillLevelLabel(player.skillLevel);
            const status = playerStatusLabel(player.status, player.isCheckedIn);

            return (
              <motion.div
                layout
                id={`player-card-${player.id}`}
                key={player.id}
                className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow transition flex flex-col justify-between ${
                  player.isCheckedIn ? 'border-slate-100' : 'border-slate-200/50 bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-100 shrink-0">
                      <img
                        referrerPolicy="no-referrer"
                        src={player.avatar}
                        alt={player.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className={`font-semibold text-slate-800 text-sm ${!player.isCheckedIn && 'text-slate-400 line-through'}`}>
                        {player.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${skill.color}`}>
                          {skill.text}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      id={`edit-player-${player.id}`}
                      onClick={() => handleEditClick(player)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                      title="แก้ไขชื่อ/ระดับ"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      id={`delete-player-${player.id}`}
                      onClick={() => {
                        if (confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้เล่น "${player.name}"?`)) {
                          onDeletePlayer(player.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="ลบผู้เล่น"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {/* Attendance Switch */}
                  <div className="flex items-center gap-2">
                    <button
                      id={`toggle-checkin-${player.id}`}
                      onClick={() => onUpdatePlayer(player.id, { isCheckedIn: !player.isCheckedIn })}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition ${
                        player.isCheckedIn
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {player.isCheckedIn ? 'เช็กอินแล้ว' : 'ไม่ได้เช็กอิน'}
                    </button>
                  </div>

                  {/* Status Indicator */}
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${status.color}`}>
                    {status.text}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
