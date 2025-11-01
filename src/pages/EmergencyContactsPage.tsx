import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Phone, Mail, MapPin, Clock, AlertTriangle, Shield, Users, Settings, Wrench } from 'lucide-react';

interface EmergencyContact {
  id: string;
  category: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  available_hours: string;
  is_emergency: boolean;
  display_order: number;
}

const categoryIcons: Record<string, any> = {
  'Emergency Services': AlertTriangle,
  'Student Services': Users,
  'Administration': Settings,
  'Facilities': Wrench,
};

const categoryColors: Record<string, string> = {
  'Emergency Services': 'from-red-600 to-rose-600',
  'Student Services': 'from-blue-600 to-cyan-600',
  'Administration': 'from-slate-600 to-gray-600',
  'Facilities': 'from-teal-600 to-emerald-600',
};

export function EmergencyContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.university_id) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('display_order', { ascending: true });

    if (data) setContacts(data);
    setLoading(false);
  };

  const groupedContacts = contacts.reduce((acc, contact) => {
    if (!acc[contact.category]) {
      acc[contact.category] = [];
    }
    acc[contact.category].push(contact);
    return acc;
  }, {} as Record<string, EmergencyContact[]>);

  const emergencyContacts = contacts.filter(c => c.is_emergency);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 text-white shadow-xl">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 mb-4 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <Shield size={40} />
            <h1 className="text-4xl font-bold">Emergency Contacts</h1>
          </div>
          <p className="text-red-100">Important contacts and emergency services for your university</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {emergencyContacts.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6 rounded-t-2xl text-white">
              <div className="flex items-center space-x-3">
                <AlertTriangle size={28} />
                <h2 className="text-2xl font-bold">Emergency Services (24/7)</h2>
              </div>
              <p className="text-red-100 mt-2">Call these numbers in case of emergency</p>
            </div>

            <div className="bg-white rounded-b-2xl shadow-xl border-x border-b border-slate-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="border-3 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-5 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-rose-600 rounded-full flex items-center justify-center">
                        <Phone className="text-white" size={24} />
                      </div>
                      <h3 className="font-bold text-slate-800 text-lg">{contact.name}</h3>
                    </div>

                    <div className="space-y-3">
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex items-center space-x-2 text-red-700 font-bold text-xl hover:text-red-800 transition-colors"
                      >
                        <Phone size={20} />
                        <span>{contact.phone}</span>
                      </a>

                      {contact.email && (
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Mail size={16} />
                          <span>{contact.email}</span>
                        </div>
                      )}

                      {contact.location && (
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <MapPin size={16} />
                          <span>{contact.location}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-sm font-semibold text-red-700">
                        <Clock size={16} />
                        <span>{contact.available_hours}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {Object.entries(groupedContacts)
          .filter(([category]) => category !== 'Emergency Services')
          .map(([category, categoryContacts]) => {
            const Icon = categoryIcons[category] || Users;
            const colorClass = categoryColors[category] || 'from-slate-600 to-gray-600';

            return (
              <div key={category} className="mb-8">
                <div className={`bg-gradient-to-r ${colorClass} p-6 rounded-t-2xl text-white`}>
                  <div className="flex items-center space-x-3">
                    <Icon size={28} />
                    <h2 className="text-2xl font-bold">{category}</h2>
                  </div>
                </div>

                <div className="bg-white rounded-b-2xl shadow-xl border-x border-b border-slate-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="border-2 border-slate-200 bg-slate-50/50 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 transition-all"
                      >
                        <h3 className="font-bold text-slate-800 text-lg mb-4">{contact.name}</h3>

                        <div className="space-y-3">
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center space-x-2 text-blue-700 font-semibold hover:text-blue-800 transition-colors"
                          >
                            <Phone size={18} />
                            <span>{contact.phone}</span>
                          </a>

                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                            >
                              <Mail size={16} />
                              <span className="truncate">{contact.email}</span>
                            </a>
                          )}

                          {contact.location && (
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <MapPin size={16} />
                              <span>{contact.location}</span>
                            </div>
                          )}

                          <div className="flex items-center space-x-2 text-sm text-slate-500">
                            <Clock size={16} />
                            <span>{contact.available_hours}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl">
          <h3 className="font-bold text-blue-900 mb-3 text-lg flex items-center space-x-2">
            <Shield size={20} />
            <span>Safety Tips</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
              <span>Save emergency numbers in your phone for quick access</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
              <span>Know the nearest emergency exits in your building</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
              <span>In case of fire, do not use elevators</span>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</div>
              <span>Report suspicious activities to campus security immediately</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
