import React from "react";
import { Button } from "./button";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const VoiceControls = ({
  isListening,
  isSpeaking,
  isPaused,
  interimTranscript,
  error,
  isVoiceSupported,
  isSpeechSupported,
  isOnline = true,
  onStartListening,
  onStopListening,
  onPauseSpeaking,
  onResumeSpeaking,
  onStopSpeaking,
  className,
  size = "default",
}) => {
  if (!isVoiceSupported && !isSpeechSupported) {
    return (
      <div className={cn("flex items-center space-x-1", className)}>
        <Button
          variant="outline"
          size={size}
          disabled
          className="text-gray-400"
        >
          <AlertCircle className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {/* Voice Recognition Button */}
      {isVoiceSupported && (
        <Button
          onClick={isListening ? onStopListening : onStartListening}
          variant={isListening ? "destructive" : "outline"}
          size={size}
          disabled={!isOnline}
          className={cn(
            "transition-all duration-200 relative",
            isListening && "animate-pulse shadow-lg",
            !isOnline && "opacity-50 cursor-not-allowed",
          )}
          title={
            !isOnline
              ? "Voice recognition requires internet connection"
              : isListening
                ? "Stop listening"
                : "Start voice input"
          }
        >
          {isListening ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          {/* Network status indicator */}
          {!isOnline && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white dark:border-gray-800" />
          )}
        </Button>
      )}

      {/* Speech Synthesis Controls */}
      {isSpeechSupported && isSpeaking && (
        <div className="flex items-center space-x-1">
          {isPaused ? (
            <Button
              onClick={onResumeSpeaking}
              variant="outline"
              size={size}
              title="Resume speaking"
            >
              <Play className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={onPauseSpeaking}
              variant="outline"
              size={size}
              title="Pause speaking"
            >
              <Pause className="w-4 h-4" />
            </Button>
          )}

          <Button
            onClick={onStopSpeaking}
            variant="outline"
            size={size}
            title="Stop speaking"
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeechSupported && isSpeaking && !isPaused && (
        <div className="flex items-center text-blue-600 dark:text-blue-400">
          <Volume2 className="w-4 h-4 animate-pulse" />
        </div>
      )}
    </div>
  );
};

export const VoiceStatus = ({
  isListening,
  isSpeaking,
  isPaused,
  interimTranscript,
  error,
  retryCount,
  isOnline,
  className,
}) => {
  if (error) {
    const isRetrying =
      error.includes("Retrying") || error.includes("Reconnecting");
    const isNetworkError =
      error.includes("Network") || error.includes("internet");

    return (
      <div
        className={cn(
          "text-sm flex items-start space-x-2",
          isRetrying
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-red-600 dark:text-red-400",
          className,
        )}
      >
        <div className="flex-shrink-0 mt-0.5">
          {isRetrying ? (
            <div className="w-4 h-4 border-2 border-yellow-600 dark:border-yellow-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1">
          <p className="leading-tight">{error}</p>
          {isNetworkError && !isOnline && (
            <p className="text-xs mt-1 opacity-75">
              Check your internet connection and try again.
            </p>
          )}
          {isRetrying && (
            <p className="text-xs mt-1 opacity-75">
              Please wait while we reconnect...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (isListening) {
    return (
      <div
        className={cn(
          "text-sm text-red-600 dark:text-red-400 flex items-center",
          className,
        )}
      >
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
        {interimTranscript ? (
          <span className="italic">{interimTranscript}</span>
        ) : (
          "Listening... Speak now"
        )}
      </div>
    );
  }

  if (isSpeaking) {
    return (
      <div
        className={cn(
          "text-sm text-blue-600 dark:text-blue-400 flex items-center",
          className,
        )}
      >
        <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
        {isPaused ? "Speech paused" : "Speaking..."}
      </div>
    );
  }

  return null;
};

export const VoiceFloatingButton = ({
  isListening,
  onStartListening,
  onStopListening,
  className,
}) => {
  return (
    <Button
      onClick={isListening ? onStopListening : onStartListening}
      className={cn(
        "fixed bottom-20 right-6 w-14 h-14 rounded-full shadow-lg z-50",
        "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
        "text-white border-0 transition-all duration-300 hover:scale-110",
        isListening && "animate-pulse bg-red-500 hover:bg-red-600",
        className,
      )}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      {isListening ? (
        <MicOff className="w-6 h-6" />
      ) : (
        <Mic className="w-6 h-6" />
      )}
    </Button>
  );
};
