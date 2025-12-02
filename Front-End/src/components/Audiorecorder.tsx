import { useRef, useState } from "react";

export default function AudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);

        // POST the blob to the backend and handle response
        try {
          setIsUploading(true);
          const form = new FormData();
          form.append("file", blob, "recording.webm");

          const res = await fetch("http://localhost:3000", {
            method: "POST",
            body: form,
          });

          const contentType = res.headers.get("content-type") || "";

          if (contentType.includes("application/json")) {
            const json = await res.json();
            console.log("Server JSON response:", json);
          } else if (contentType.startsWith("audio/") || contentType === "application/octet-stream") {
            const arrayBuffer = await res.arrayBuffer();
            // try decoding audio to an AudioBuffer so we can log details
            try {
              const win = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
              const AudioCtor = win.AudioContext ?? win.webkitAudioContext;
              if (AudioCtor) {
                const audioCtx = new AudioCtor();
                const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
                console.log("Decoded audio response:", {
                  sampleRate: decoded.sampleRate,
                  length: decoded.length,
                  duration: decoded.duration,
                  numberOfChannels: decoded.numberOfChannels,
                });
              } else {
                console.log("No AudioContext available to decode the response.");
              }
            } catch (decodeErr) {
              console.log("Received binary/audio response (undecodable by AudioContext):", decodeErr);
            }
          } else {
            // fallback to text
            const text = await res.text();
            console.log("Server text response:", text);
          }
        } catch (err) {
          console.error("Upload or decode error:", err);
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Unable to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="bg-white shadow-md rounded-lg p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Voice Input</h2>
          <p className="text-sm text-muted-foreground">Record audio and send it to the local server.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            {isRecording ? '⛔ Stop' : '🎙️ Start Recording'}
          </button>

          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-50 hover:bg-gray-100"
            onClick={() => {
              if (audioURL) {
                URL.revokeObjectURL(audioURL);
                setAudioURL(null);
              }
            }}
          >
            Clear
          </button>

          {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
        </div>

        {audioURL && (
          <div className="mt-2">
            <h3 className="text-sm font-medium">Recorded Audio</h3>
            <audio className="mt-2 w-full" controls src={audioURL} />
          </div>
        )}
      </div>
    </div>
  );
}
