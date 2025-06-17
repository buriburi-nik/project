import { useState, useEffect, useRef, useCallback } from "react";

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("en-US");

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check browser support
  useEffect(() => {
    const speechRecognitionSupported =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setIsSupported(speechRecognitionSupported);

    if (speechRecognitionSupported) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      recognitionRef.current = new SpeechRecognition();

      // Configuration
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;
      recognitionRef.current.lang = language;

      // Event handlers
      recognitionRef.current.onstart = () => {
        setError(null);
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript.trim());
          setInterimTranscript("");
        } else {
          setInterimTranscript(interimTranscript);
        }

        // Reset timeout for auto-stop
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (recognitionRef.current && isListening) {
            stopListening();
          }
        }, 3000); // Stop after 3 seconds of silence
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setError(event.error);
        setIsListening(false);
        setInterimTranscript("");

        // Handle specific errors
        switch (event.error) {
          case "no-speech":
            setError("No speech detected. Please try again.");
            break;
          case "audio-capture":
            setError("Microphone not accessible. Please check permissions.");
            break;
          case "not-allowed":
            setError(
              "Microphone access denied. Please allow microphone access.",
            );
            break;
          case "network":
            setError("Network error. Please check your internet connection.");
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
      };
    }

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [language, isListening]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        setTranscript("");
        setInterimTranscript("");
        recognitionRef.current.start();
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        setError("Failed to start speech recognition. Please try again.");
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
      }
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const changeLanguage = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLanguage;
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    language,
    startListening,
    stopListening,
    resetTranscript,
    changeLanguage,
    setTranscript, // Keep for backward compatibility
  };
};
