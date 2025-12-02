import { useRef, useState } from "react";

export default function AudioRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const recordingBlobRef = useRef<Blob | null>(null);
  const [sendPermission, setSendPermission] = useState(false);
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

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className=" bg-white dark:bg-slate-800 dark:text-gray-100 shadow-md rounded-lg p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Voice Input</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Record audio and send it to the local server.</p>
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600"
            onClick={() => {
              if (audioURL) {
                URL.revokeObjectURL(audioURL);
                setAudioURL(null);
                recordingBlobRef.current = null;
                setSendPermission(false);
              }
            }}
          >
            Clear
          </button>

          <button
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border ${sendPermission ? 'bg-sky-50 dark:bg-sky-900' : 'bg-white dark:bg-slate-700'} hover:bg-sky-50 dark:hover:bg-sky-900`}
            onClick={() => setSendPermission((s) => !s)}
          >
            {sendPermission ? '✅ Sending Allowed' : '🔒 Allow Send'}
          </button>

          {audioURL && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              onClick={async () => {
                // send only if permission granted and blob exists
                if (!sendPermission) {
                  setToast({ message: 'Please allow sending the recording first.', type: 'info' });
                  setTimeout(() => setToast(null), 3000);
                  return;
                }

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
              }}
            >
              📤 Send
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
                <pre className="text-sm max-h-64 overflow-auto bg-gray-50 dark:bg-gray-900 p-3 rounded">{dialogResponse}</pre>
              <div className="mt-4 flex justify-end">
                <button
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
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
          <div className={`fixed right-4 bottom-6 z-50 max-w-xs w-full ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'} rounded-md shadow-lg px-4 py-3`}>
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
