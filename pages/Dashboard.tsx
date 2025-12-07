import React, { useState } from 'react';
import { ApiService } from '../services/api';
import { ClassResponse } from '../types';
import { Button } from '../components/Button';
import { Copy, Plus, Users, Video, ArrowRight, Settings, Calendar, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [teacherName, setTeacherName] = useState('');
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState<string[]>(['']);
  const [createdClass, setCreatedClass] = useState<ClassResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAddStudentField = () => {
    setStudents([...students, '']);
  };

  const handleStudentChange = (index: number, value: string) => {
    const newStudents = [...students];
    newStudents[index] = value;
    setStudents(newStudents);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const validStudents = students.filter(s => s.trim() !== '');
    
    try {
      const response = await ApiService.createClass({
        teacherName,
        className,
        students: validStudents
      });
      setCreatedClass(response);
    } catch (error) {
      console.error("Failed to create class", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  if (createdClass) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-blue-400">Class Created!</h1>
            <p className="text-gray-400 mt-2">Share these links with your participants.</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-yellow-400 mb-2 flex items-center gap-2">
                <Video size={20} /> Host (Admin) Link
              </h3>
              <div className="flex gap-2">
                <input readOnly value={createdClass.adminLink} className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-sm text-gray-300 font-mono" />
                <Button variant="secondary" onClick={() => copyToClipboard(createdClass.adminLink)}>
                  <Copy size={16} />
                </Button>
                <a 
                  href={createdClass.adminLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-medium"
                >
                   Enter Now <ArrowRight size={16} />
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-1">Use this link to enter as the teacher with full controls.</p>
            </div>

            <div className="border-t border-gray-700 pt-6">
               <h3 className="text-lg font-medium text-green-400 mb-4 flex items-center gap-2">
                <Users size={20} /> Student Links
              </h3>
              
              <div className="space-y-4">
                {createdClass.studentLinks.map((sl, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <span className="w-32 font-medium text-gray-300">{sl.name}</span>
                    <div className="flex-1 flex gap-2 w-full">
                      <input readOnly value={sl.link} className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-400 font-mono" />
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(sl.link)}>
                        <Copy size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-6">
               <h3 className="text-sm font-medium text-gray-400 mb-2">Common Link (for others)</h3>
               <div className="flex gap-2">
                  <input readOnly value={createdClass.commonLink} className="flex-1 bg-gray-900 border border-gray-700 rounded p-2 text-xs text-gray-500 font-mono" />
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdClass.commonLink)}>
                    <Copy size={14} />
                  </Button>
               </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => setCreatedClass(null)}>Create Another Class</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10 relative">
        
        {/* Hub Link */}
        <button 
            onClick={() => navigate('/teacher-hub')}
            className="absolute top-4 right-4 p-2 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2 text-xs transition border border-white/10"
        >
            <Layout size={16} /> ورود به پنل مدیریت کلاس‌ها
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <Video className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold">Create Online Classroom</h1>
          <p className="text-gray-400 text-sm mt-1">Setup your WebRTC session with admin controls</p>
        </div>

        <form onSubmit={handleCreateClass} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Class Name</label>
            <input 
              required
              type="text" 
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Physics 101"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Teacher Name (Admin)</label>
            <input 
              required
              type="text" 
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="e.g. Mr. Anderson"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Student Names (Optional)</label>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
              {students.map((student, index) => (
                <input 
                  key={index}
                  type="text" 
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                  placeholder={`Student ${index + 1}`}
                  value={student}
                  onChange={(e) => handleStudentChange(index, e.target.value)}
                />
              ))}
            </div>
            <button 
              type="button" 
              onClick={handleAddStudentField}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Plus size={14} /> Add another student
            </button>
          </div>

          <Button 
            type="submit" 
            className="w-full py-3 text-lg font-semibold shadow-lg shadow-blue-600/20" 
            disabled={loading}
          >
            {loading ? 'Generating Room...' : 'Create Class Room'}
          </Button>
        </form>
      </div>
    </div>
  );
};