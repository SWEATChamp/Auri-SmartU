import { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import OpenAI from 'openai';

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
}

const getOpenAIClient = () => {
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    return new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
  }
  return null;
};

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.text = text.replace(/,/g, ', ').replace(/\./g, '. ');
      window.speechSynthesis.speak(utterance);
    }
  };

  const matchesPattern = (text: string, keywords: string[]): boolean => {
    return keywords.some(word => text.includes(word));
  };

  const handleTrafficQuery = async (text: string): Promise<string> => {
    const { data: poisData } = await supabase
      .from('pois')
      .select('*')
      .order('is_default', { ascending: false });

    const { data: trafficData } = await supabase
      .from('poi_traffic')
      .select('*');

    if (!poisData || !trafficData || poisData.length === 0) {
      return 'Unable to fetch traffic data right now';
    }

    const allTraffic = poisData.map((poi) => {
      const poiTraffic = trafficData.find((t) => t.poi_id === poi.id);
      return {
        name: poi.name,
        time: poiTraffic?.commute_time_minutes || 0,
        level: poiTraffic?.traffic_level || 'unknown'
      };
    });

    if (matchesPattern(text, ['sunway', 'pyramid'])) {
      const target = allTraffic.find((t) => t.name.toLowerCase().includes('sunway'));
      if (target) {
        const levelText = target.level === 'severe' ? 'severe congestion' :
                        target.level === 'heavy' ? 'heavy traffic' :
                        target.level === 'moderate' ? 'moderate traffic' : 'light traffic';
        return `${target.name} is ${target.time} minutes away with ${levelText}`;
      }
    }

    if (matchesPattern(text, ['best', 'fastest', 'quick'])) {
      const sorted = [...allTraffic].sort((a, b) => a.time - b.time);
      return `${sorted[0].name} is your best option with only ${sorted[0].time} minutes`;
    }

    if (matchesPattern(text, ['worst', 'avoid', 'bad'])) {
      const sorted = [...allTraffic].sort((a, b) => b.time - a.time);
      return `Avoid ${sorted[0].name}. It has the worst traffic at ${sorted[0].time} minutes`;
    }

    const top3 = allTraffic.slice(0, 3);
    const trafficInfo = top3.map((t) => {
      const levelText = t.level === 'severe' ? 'severe' :
                      t.level === 'heavy' ? 'heavy' :
                      t.level === 'moderate' ? 'moderate' : 'light';
      return `${t.name}: ${t.time} minutes, ${levelText}`;
    }).join('. ');
    return `Current traffic: ${trafficInfo}`;
  };

  const handleParkingQuery = async (text: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Please sign in to check parking availability';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return 'Unable to fetch your profile';

    const { data } = await supabase
      .from('parking_lots')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('available_spaces', { ascending: false });

    if (!data || data.length === 0) return 'No parking data available';

    if (matchesPattern(text, ['recommend', 'best', 'should'])) {
      const best = data[0];
      return `I recommend ${best.zone}. It has ${best.available_spaces} out of ${best.total_spaces} spaces available`;
    }

    if (matchesPattern(text, ['worst', 'full', 'avoid'])) {
      const worst = data[data.length - 1];
      return `Avoid ${worst.zone}. It only has ${worst.available_spaces} spaces left`;
    }

    const top3 = data.slice(0, 3);
    return `Parking: ${top3.map((p) => `${p.zone}: ${p.available_spaces} available`).join('. ')}`;
  };

  const handleLibraryQuery = async (text: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Please sign in to check library seats';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return 'Unable to fetch your profile';

    const { data } = await supabase
      .from('library_seats')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('available_seats', { ascending: false });

    if (!data || data.length === 0) return 'No library seats available';

    if (matchesPattern(text, ['charging', 'charge', 'power', 'plug'])) {
      const withCharging = data.filter((s) => s.has_charging_port);
      if (withCharging.length > 0) {
        const best = withCharging[0];
        return `For charging, go to Floor ${best.floor}, ${best.zone}. It has ${best.available_seats} seats with power outlets`;
      }
      return 'Sorry, no seats with charging ports are available right now';
    }

    if (matchesPattern(text, ['quiet', 'silent', 'peaceful'])) {
      const silent = data.find((s) => s.zone.toLowerCase().includes('silent') || s.zone.toLowerCase().includes('quiet'));
      if (silent) {
        const charging = silent.has_charging_port ? ' with charging' : '';
        return `The quiet area is on Floor ${silent.floor}, ${silent.zone}. ${silent.available_seats} seats available${charging}`;
      }
    }

    if (matchesPattern(text, ['recommend', 'best', 'should'])) {
      const best = data[0];
      const charging = best.has_charging_port ? ' with charging ports' : '';
      return `I recommend Floor ${best.floor}, ${best.zone}. It has ${best.available_seats} seats available${charging}`;
    }

    const top3 = data.slice(0, 3);
    return `Library: ${top3.map((s) => {
      const charging = s.has_charging_port ? ' with charging' : '';
      return `Floor ${s.floor} ${s.zone}: ${s.available_seats} seats${charging}`;
    }).join('. ')}`;
  };

  const handleFoodQuery = async (text: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Please sign in to check food options';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return 'Unable to fetch your profile';

    const { data } = await supabase
      .from('food_stalls')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('queue_length', { ascending: true });

    if (!data || data.length === 0) return 'No food stall data available';

    if (matchesPattern(text, ['recommend', 'best', 'should', 'quick', 'fast'])) {
      const best = data[0];
      return `I recommend ${best.name}. It has ${best.available_seats} seats and only ${best.queue_length} people in the queue`;
    }

    if (matchesPattern(text, ['avoid', 'busy', 'crowded', 'worst'])) {
      const worst = data[data.length - 1];
      return `Avoid ${worst.name}. It has a long queue of ${worst.queue_length} people`;
    }

    const top3 = data.slice(0, 3);
    return `Food options: ${top3.map((f) => `${f.name}: ${f.available_seats} seats, queue of ${f.queue_length}`).join('. ')}`;
  };

  const handleLiftQuery = async (text: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Please sign in to check lift status';

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('university_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) return 'Unable to fetch your profile';

    const { data } = await supabase
      .from('lift_queues')
      .select('*')
      .eq('university_id', profile.university_id)
      .order('queue_length', { ascending: true });

    if (!data || data.length === 0) return 'No lift queue data available';

    if (matchesPattern(text, ['recommend', 'best', 'should', 'fastest', 'which'])) {
      const best = data[0];
      return `Take ${best.lift_name}. It has only ${best.queue_length} people waiting`;
    }

    const top3 = data.slice(0, 3);
    return `Lifts: ${top3.map((l) => `${l.lift_name}: ${l.queue_length} waiting`).join('. ')}`;
  };

  const processCommand = async (text: string) => {
    const lowerText = text.toLowerCase();
    let responseText = '';

    try {
      if (matchesPattern(lowerText, ['hi', 'hello', 'hey'])) {
        responseText = "Hey there! How can I help you today?";
      } else if (matchesPattern(lowerText, ['how are you'])) {
        responseText = "I'm great — just keeping an eye on the campus for you!";
      } else if (matchesPattern(lowerText, ['thank', 'thanks'])) {
        responseText = "You're very welcome!";
      } else if (matchesPattern(lowerText, ['traffic', 'jam', 'road', 'drive', 'commute', 'go home'])) {
        responseText = await handleTrafficQuery(lowerText);
      } else if (matchesPattern(lowerText, ['parking', 'car park', 'space', 'where can i park'])) {
        responseText = await handleParkingQuery(lowerText);
      } else if (matchesPattern(lowerText, ['library', 'study', 'seat', 'study spot'])) {
        responseText = await handleLibraryQuery(lowerText);
      } else if (matchesPattern(lowerText, ['food', 'eat', 'hungry', 'lunch', 'dinner', 'canteen'])) {
        responseText = await handleFoodQuery(lowerText);
      } else if (matchesPattern(lowerText, ['lift', 'elevator'])) {
        responseText = await handleLiftQuery(lowerText);
      } else if (matchesPattern(lowerText, ['classroom', 'empty room', 'free room'])) {
        responseText = 'Let me show you available classrooms';
        onCommand('classroom');
      } else if (matchesPattern(lowerText, ['course', 'plan', 'schedule', 'timetable'])) {
        responseText = 'Opening your course planner';
        onCommand('course');
      } else {
        const openai = getOpenAIClient();
        if (openai) {
          const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "You are a friendly campus assistant. Respond briefly (1-2 sentences max), sound natural and helpful."
              },
              { role: "user", content: text }
            ]
          });
          responseText = aiResponse.choices[0].message.content || "I'm not sure how to help with that.";
        } else {
          responseText = 'I can help you with traffic, parking, library seats, food options, lifts, classrooms, and course planning. Just ask me a question!';
        }
      }
    } catch (error) {
      console.error('Error processing command:', error);
      responseText = 'Sorry, I encountered an error processing that request';
    }

    setResponse(responseText);
    setShowResponse(true);
    speak(responseText);
    setTimeout(() => setShowResponse(false), 10000);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      const errorText = 'Sorry, voice recognition is not supported in your browser';
      setResponse(errorText);
      setShowResponse(true);
      speak(errorText);
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
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
                <Volume2 className="text-blue-600 flex-shrink-0 mt-0.5 animate-pulse" size={16} />
                <p className="text-sm text-slate-800 font-medium">{response}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
