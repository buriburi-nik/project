import { useState, useEffect, useRef, useCallback } from "react";

export const useSpeechSynthesis = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState(null);

  const utteranceRef = useRef(null);

  // Check browser support and load voices
  useEffect(() => {
    const speechSynthesisSupported = "speechSynthesis" in window;
    setIsSupported(speechSynthesisSupported);

    if (speechSynthesisSupported) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);

        // Set default voice (prefer English voices)
        if (availableVoices.length > 0 && !selectedVoice) {
          const englishVoice = availableVoices.find((voice) =>
            voice.lang.startsWith("en"),
          );
          setSelectedVoice(englishVoice || availableVoices[0]);
        }
      };

      // Load voices immediately
      loadVoices();

      // Load voices when they change (some browsers load voices asynchronously)
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }
  }, [selectedVoice]);

  // Monitor speaking status
  useEffect(() => {
    const checkSpeakingStatus = () => {
      if (window.speechSynthesis) {
        setIsSpeaking(window.speechSynthesis.speaking);
        setIsPaused(window.speechSynthesis.paused);
      }
    };

    const interval = setInterval(checkSpeakingStatus, 100);
    return () => clearInterval(interval);
  }, []);

  const speak = useCallback(
    (text, options = {}) => {
      if (!isSupported) {
        setError("Speech synthesis is not supported in this browser.");
        return;
      }

      if (!text || typeof text !== "string") {
        setError("Invalid text provided for speech synthesis.");
        return;
      }

      // Stop any current speech
      window.speechSynthesis.cancel();

      try {
        const utterance = new SpeechSynthesisUtterance(text);

        // Apply settings
        utterance.voice = options.voice || selectedVoice;
        utterance.rate = options.rate || rate;
        utterance.pitch = options.pitch || pitch;
        utterance.volume = options.volume || volume;
        utterance.lang = options.lang || selectedVoice?.lang || "en-US";

        // Event handlers
        utterance.onstart = () => {
          setError(null);
          setIsSpeaking(true);
          setIsPaused(false);
          if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          if (options.onEnd) options.onEnd();
        };

        utterance.onerror = (event) => {
          console.error("Speech synthesis error:", event.error);
          setError(`Speech synthesis error: ${event.error}`);
          setIsSpeaking(false);
          setIsPaused(false);
          if (options.onError) options.onError(event);
        };

        utterance.onpause = () => {
          setIsPaused(true);
          if (options.onPause) options.onPause();
        };

        utterance.onresume = () => {
          setIsPaused(false);
          if (options.onResume) options.onResume();
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Failed to start speech synthesis:", error);
        setError("Failed to start speech synthesis. Please try again.");
      }
    },
    [isSupported, selectedVoice, rate, pitch, volume],
  );

  const pause = useCallback(() => {
    if (window.speechSynthesis && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (window.speechSynthesis && isSpeaking && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isSpeaking, isPaused]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, []);

  const getAvailableVoices = useCallback(
    (language = null) => {
      if (language) {
        return voices.filter((voice) => voice.lang.startsWith(language));
      }
      return voices;
    },
    [voices],
  );

  return {
    isSupported,
    isSpeaking,
    isPaused,
    voices,
    selectedVoice,
    rate,
    pitch,
    volume,
    error,
    speak,
    pause,
    resume,
    stop,
    setSelectedVoice,
    setRate,
    setPitch,
    setVolume,
    getAvailableVoices,
  };
};
