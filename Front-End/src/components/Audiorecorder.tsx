import { useRef, useState } from "react";

export default function AudioRecorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [audioURL, setAudioURL] = useState(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    chunksRef.current = [];
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) => {
      chunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);
    };

    mediaRecorderRef.current.start();
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
  };

  return (
    <div style={{ padding: 20 }}>
      <button onClick={startRecording}>🎙️ Start Recording</button>
      <button onClick={stopRecording} style={{ marginLeft: 10 }}>
        ⛔ Stop
      </button>

      {audioURL && (
        <>
          <h3>Recorded Audio:</h3>
          <audio controls src={audioURL} />
        </>
      )}
    </div>
  );
}
