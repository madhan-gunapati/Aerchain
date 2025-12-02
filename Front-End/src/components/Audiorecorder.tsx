import { useRef, useState } from "react";

export default function AudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const recordingBlobRef = useRef<Blob | null>(null);
  const [dialogResponse, setDialogResponse] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "info" } | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        // store blob for later sending when user grants permission
        recordingBlobRef.current = blob;
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

  const GetTextFromSpeech =async () => {
                if (!recordingBlobRef.current) {
                  setToast({ message: 'No recording available to send.', type: 'error' });
                  setTimeout(() => setToast(null), 3000);
                  return;
                }

                setIsUploading(true);
                try {
                  const form = new FormData();
                  form.append('file', recordingBlobRef.current, 'recording.webm');
                    
                  const res = await fetch('http://localhost:3000/STT', { method: 'POST', body: form });

                  if (!res.ok) {
                    const text = await res.text().catch(() => 'Unknown error');
                    setToast({ message: `Server error: ${text}`, type: 'error' });
                    setTimeout(() => setToast(null), 4000);
                    return;
                  }

                  const contentType = res.headers.get('content-type') || '';
                  if (contentType.includes('application/json')) {
                    const json = await res.json();
                    setDialogResponse(JSON.stringify(json, null, 2));
                    setShowDialog(true);
                  } else {
                    const text = await res.text();
                    setDialogResponse(text);
                    setShowDialog(true);
                  }
                } catch (err) {
                  setToast({ message: `Upload failed: ${(err as Error).message}`, type: 'error' });
                  setTimeout(() => setToast(null), 4000);
                } finally {
                  setIsUploading(false);
                }
              }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className=" bg-white dark:bg-slate-800 dark:text-gray-100 shadow-md rounded-lg p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Voice Input</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Add Task with an audio</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white ${isRecording ? 'bg-black hover:bg-gray-800 dark:bg-gray-200 dark:text-black dark:hover:bg-white' : 'bg-black hover:bg-gray-800 dark:bg-gray-200 dark:text-black dark:hover:bg-white'}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            {isRecording ? ' Stop' : ' Start Recording'}
          </button>

          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600"
            onClick={() => {
              if (audioURL) {
                URL.revokeObjectURL(audioURL);
                setAudioURL(null);
                recordingBlobRef.current = null;
                
              }
            }}
          >
            Clear
          </button>

         

          {audioURL && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-900 dark:bg-gray-300 dark:text-black dark:hover:bg-white"
              onClick={GetTextFromSpeech}
            >
               Send
            </button>
          )}

          {isUploading && <span className="text-sm text-gray-500 dark:text-gray-300">Uploading...</span>}
        </div>

        {audioURL && (
          <div className="mt-2">
            <h3 className="text-sm font-medium">Recorded Audio</h3>
            <audio className="mt-2 w-full" controls src={audioURL} />
          </div>
        )}

        {/* Dialog for showing server response */}
        {showDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowDialog(false)} />
              <div className="relative bg-white dark:bg-slate-800 dark:text-gray-100 rounded-lg shadow-lg p-6 max-w-xl mx-4 z-10">
              <h3 className="text-lg font-semibold mb-2">Server Response</h3>
                <pre className="text-sm max-h-64 overflow-auto bg-gray-100 dark:bg-gray-700 p-3 rounded">{dialogResponse}</pre>
              <div className="mt-4 flex justify-end">
                <button
                  className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
                  onClick={() => setShowDialog(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast for errors/info */}
        {toast && (
          <div className={`fixed right-4 bottom-6 z-50 max-w-xs w-full ${toast.type === 'error' ? 'bg-gray-800 text-white dark:bg-gray-600' : 'bg-gray-700 text-white dark:bg-gray-500'} rounded-md shadow-lg px-4 py-3`}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">{toast.message}</div>
              <button onClick={() => setToast(null)} className="text-sm opacity-80">Dismiss</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
