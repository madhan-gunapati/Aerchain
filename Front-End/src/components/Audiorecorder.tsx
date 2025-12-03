import { useRef, useState } from "react";
import Toast from "./Toast";
import TaskEditDialog from "./TaskEditDialog";
import { addTaskToDB } from '../lib/tasksApi';

import { Mic, Trash2, Send} from 'lucide-react'

type TaskData = {
  id?: string | number
  name: string
  desc?: string
  status?: 'to-do' | 'in-progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

type AudioRecorderProps = {
  afterSave?: () => void
}

export default function AudioRecorder({ afterSave }: AudioRecorderProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const recordingBlobRef = useRef<Blob | null>(null);
  const [dialogResponse, setDialogResponse] = useState<TaskData | null>(null);
  // Remove preview dialog, use TaskEditDialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
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

  

  const GetTextFromSpeech = async () => {
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
        
        const taskDetails  = {name:json.taskDetails.taskName , desc:json.text , status:json.taskDetails.status , priority:json.taskDetails.priority , dueDate:json.taskDetails.deadline }
        setDialogResponse(taskDetails);
        
        setShowEditDialog(true);
      } else {
        const text = await res.text();
        setDialogResponse({ name: text, status: 'to-do' });
        setShowEditDialog(true);
      }
    } catch (err) {
      setToast({ message: `Upload failed: ${(err as Error).message}`, type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsUploading(false);
    }
  };







  const handleSaveTask = async (task: TaskData) => {
    setIsSavingTask(true);
    try {
      // Map fields to match addTaskToDB signature
      const payload = {
        name: task.name,
        desc: task.desc ?? '',
        status: task.status ?? 'to-do',
        priority: task.priority,
        dueDate: task.dueDate,
      };
      await addTaskToDB(payload);
      setShowEditDialog(false);
      setDialogResponse(null);
      setToast({ message: 'Task saved successfully', type: 'info' });
      setTimeout(() => setToast(null), 3000);
      if (typeof afterSave === 'function') {
        afterSave();
      }
    } catch (err) {
      setToast({ message: (err as Error).message, type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setIsSavingTask(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 w-full max-w-md sm:max-w-lg mx-auto">
      <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">Voice Input</h2>
          <p className="text-sm text-gray-600">Add Task with audio</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <button
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-800'}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
              {isRecording ? <Mic size={16} /> : <Mic size={16} />}
          </button>

          <button
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-gray-50 hover:bg-gray-100"
            onClick={() => {
              if (audioURL) {
                URL.revokeObjectURL(audioURL);
                setAudioURL(null);
                recordingBlobRef.current = null;
              }
            }}
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {audioURL && (
            <button
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              onClick={GetTextFromSpeech}
            >
              <Send size={16} />
              <span className="hidden sm:inline">Send</span>
            </button>
          )}

          {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
        </div>

        {audioURL && (
          <div className="mt-2">
            <h3 className="text-sm font-medium">Recorded Audio</h3>
            <audio className="mt-2 w-full" controls src={audioURL} />
          </div>
        )}

        {/* TaskEditDialog for editing fetched data */}
        <TaskEditDialog
          open={showEditDialog && !!dialogResponse}
          onClose={() => setShowEditDialog(false)}
          initialTask={dialogResponse}
          onSave={handleSaveTask}
          isLoading={isSavingTask}
          title="Edit Task"
        />

        {/* Toast for errors/info */}
        {toast && <Toast message={toast.message} type={toast.type === 'error' ? 'error' : 'info'} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
