import { useState, useEffect, useRef, useCallback } from "react";

export const useVoiceRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("en-US");
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const maxRetries = 3;

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setError(
        "No internet connection. Speech recognition requires an internet connection.",
      );
      if (isListening) {
        stopListening();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [isListening]);

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
        setIsListening(false);
        setInterimTranscript("");

        // Handle specific errors with retry logic
        switch (event.error) {
          case "no-speech":
            setError("No speech detected. Please try speaking more clearly.");
            setRetryCount(0); // Reset retry count for user errors
            break;
          case "audio-capture":
            setError(
              "Microphone not accessible. Please check permissions and ensure no other app is using the microphone.",
            );
            setRetryCount(0);
            break;
          case "not-allowed":
            setError(
              "Microphone access denied. Please click the microphone icon in your browser and allow access.",
            );
            setRetryCount(0);
            break;
          case "network":
            handleNetworkError();
            break;
          case "service-not-allowed":
            setError(
              "Speech recognition service not allowed. Please check your browser settings.",
            );
            setRetryCount(0);
            break;
          case "bad-grammar":
            setError(
              "Speech recognition failed. Please try again with clearer speech.",
            );
            setRetryCount(0);
            break;
          default:
            setError(
              `Speech recognition error: ${event.error}. Please try again.`,
            );
            if (retryCount < maxRetries) {
              scheduleRetry();
            }
        }
      };

      // Handle network-specific errors with retry logic
      const handleNetworkError = () => {
        if (!navigator.onLine) {
          setError(
            "No internet connection. Speech recognition requires an internet connection.",
          );
          setRetryCount(0);
          return;
        }

        if (retryCount < maxRetries) {
          const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
          setError(
            `Network error. Retrying in ${retryDelay / 1000} seconds... (${retryCount + 1}/${maxRetries})`,
          );

          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            attemptRestart();
          }, retryDelay);
        } else {
          setError(
            "Network error: Unable to connect to speech recognition service. Please check your internet connection and try again later.",
          );
          setRetryCount(0);
        }
      };

      // Schedule a retry attempt
      const scheduleRetry = () => {
        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff
        setError(
          `Connection failed. Retrying in ${retryDelay / 1000} seconds... (${retryCount + 1}/${maxRetries})`,
        );

        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          attemptRestart();
        }, retryDelay);
      };

      // Attempt to restart recognition
      const attemptRestart = () => {
        if (navigator.onLine && recognitionRef.current) {
          try {
            setError("Reconnecting...");
            recognitionRef.current.start();
          } catch (error) {
            console.error("Failed to restart speech recognition:", error);
            if (retryCount < maxRetries) {
              scheduleRetry();
            } else {
              setError(
                "Failed to restart speech recognition. Please try manually.",
              );
              setRetryCount(0);
            }
          }
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
