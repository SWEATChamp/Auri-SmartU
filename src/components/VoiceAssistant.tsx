import { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
}

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const processCommand = async (text: string) => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('traffic') || lowerText.includes('home') || lowerText.includes('go')) {
      const { data: poisData } = await supabase
        .from('pois')
        .select('*')
        .order('is_default', { ascending: false });

      const { data: trafficData } = await supabase
        .from('poi_traffic')
        .select('*');

      if (poisData && trafficData && poisData.length > 0) {
        const traffic = poisData.map((poi) => {
          const poiTraffic = trafficData.find((t) => t.poi_id === poi.id);
          return {
            name: poi.name,
            time: poiTraffic?.commute_time_minutes || 0,
            level: poiTraffic?.traffic_level || 'unknown'
          };
        }).slice(0, 3);

        const trafficInfo = traffic.map((t) => {
          const levelText = t.level === 'severe' ? 'severe congestion' :
                          t.level === 'heavy' ? 'heavy traffic' :
                          t.level === 'moderate' ? 'moderate traffic' : 'light traffic';
          return `${t.name}: ${t.time} min (${levelText})`;
        }).join(', ');

        setResponse(`Current traffic: ${trafficInfo}`);
      } else {
        setResponse('Unable to fetch traffic data at the moment');
      }
    } else if (lowerText.includes('parking')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResponse('Please sign in to check parking availability');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('university_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const { data } = await supabase
          .from('parking_lots')
          .select('*')
          .eq('university_id', profile.university_id)
          .order('available_spaces', { ascending: false })
          .limit(3);

        if (data && data.length > 0) {
          const parkingInfo = data.map((p) =>
            `${p.zone}: ${p.available_spaces}/${p.total_spaces} available`
          ).join(', ');
          setResponse(`Parking availability: ${parkingInfo}`);
        } else {
          setResponse('No parking data available');
        }
      }
    } else if (lowerText.includes('library') || lowerText.includes('study')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResponse('Please sign in to check library seats');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('university_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const { data } = await supabase
          .from('library_seats')
          .select('*')
          .eq('university_id', profile.university_id)
          .order('available_seats', { ascending: false })
          .limit(3);

        if (data && data.length > 0) {
          const libraryInfo = data.map((s) => {
            const charging = s.has_charging_port ? ' with charging' : '';
            return `Floor ${s.floor} ${s.zone}: ${s.available_seats} seats${charging}`;
          }).join(', ');
          setResponse(`Library availability: ${libraryInfo}`);
        } else {
          setResponse('No library seat data available');
        }
      }
    } else if (lowerText.includes('food') || lowerText.includes('eat') || lowerText.includes('canteen')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setResponse('Please sign in to check food stall availability');
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('university_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        const { data } = await supabase
          .from('food_stalls')
          .select('*')
          .eq('university_id', profile.university_id)
          .order('available_seats', { ascending: false })
          .limit(3);

        if (data && data.length > 0) {
          const foodInfo = data.map((f) =>
            `${f.name}: ${f.available_seats} seats, queue: ${f.queue_length}`
          ).join(', ');
          setResponse(`Food stalls: ${foodInfo}`);
        } else {
          setResponse('No food stall data available');
        }
      }
    } else if (lowerText.includes('classroom') || lowerText.includes('empty room')) {
      setResponse('Let me show you available classrooms');
      onCommand('classroom');
    } else if (lowerText.includes('lift') || lowerText.includes('elevator')) {
      setResponse('Finding the best lift for you');
      onCommand('lift');
    } else if (lowerText.includes('course') || lowerText.includes('plan')) {
      setResponse('Opening your course planner');
      onCommand('course');
    } else {
      setResponse('I can help you check traffic, parking, library seats, food stalls, classrooms, lifts, and course planning!');
    }

    setShowResponse(true);
    setTimeout(() => setShowResponse(false), 8000);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setResponse('Sorry, voice recognition is not supported in your browser');
      setShowResponse(true);
      setTimeout(() => setShowResponse(false), 3000);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      processCommand(text);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    setTranscript('');
  };

  return (
    <>
      <button
        onClick={isListening ? stopListening : startListening}
        className={`fixed bottom-8 right-8 p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 z-50 ${
          isListening
            ? 'bg-gradient-to-r from-red-500 to-rose-500 animate-pulse'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
        }`}
      >
        {isListening ? (
          <MicOff className="text-white" size={28} />
        ) : (
          <Mic className="text-white" size={28} />
        )}
      </button>

      {(transcript || showResponse) && (
        <div className="fixed bottom-24 right-8 bg-white rounded-2xl shadow-2xl p-4 max-w-md z-50 border border-slate-200">
          {transcript && (
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  You said
                </span>
              </div>
              <p className="text-slate-800 font-medium">{transcript}</p>
            </div>
          )}

          {showResponse && response && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-start space-x-2">
                <Volume2 className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-slate-800 font-medium">{response}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
