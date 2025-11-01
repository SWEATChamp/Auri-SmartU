import { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
}

export function VoiceAssistant({ onCommand }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const processCommand = (text: string) => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('classroom') || lowerText.includes('empty room')) {
      setResponse('Showing available classrooms for you');
      onCommand('classroom');
    } else if (lowerText.includes('lift') || lowerText.includes('elevator')) {
      setResponse('Let me find the best lift for you');
      onCommand('lift');
    } else if (lowerText.includes('traffic') || lowerText.includes('home') || lowerText.includes('go')) {
      const hasHeavyTraffic = Math.random() > 0.5;
      if (hasHeavyTraffic) {
        setResponse("Hell nah, there's a heavy traffic jam right now!");
      } else {
        setResponse("Looks good! Traffic is light, safe travels!");
      }
      onCommand('traffic');
    } else if (lowerText.includes('parking')) {
      setResponse('Checking parking availability across campus');
      onCommand('parking');
    } else if (lowerText.includes('course') || lowerText.includes('plan')) {
      setResponse('Opening your course planner');
      onCommand('course');
    } else if (lowerText.includes('library')) {
      setResponse('Let me check library seat availability');
      onCommand('library');
    } else if (lowerText.includes('food') || lowerText.includes('eat')) {
      setResponse('Showing food stall availability and queue times');
      onCommand('food');
    } else {
      setResponse('I can help you with classrooms, lifts, traffic, parking, library, food stalls, and course planning!');
    }

    setShowResponse(true);
    setTimeout(() => setShowResponse(false), 5000);
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
        <div className="fixed bottom-24 right-8 bg-white rounded-2xl shadow-2xl p-4 max-w-sm z-50 border border-slate-200">
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
