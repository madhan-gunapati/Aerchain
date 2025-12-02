import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from "dotenv"
import multer from 'multer'
import { GoogleGenerativeAI } from '@google/generative-ai'
dotenv.config();


const app = express()
app.use(cors())
app.use(express.json())

app.get('/', (req, res)=>{
res.send('App is working fine')
})


const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
app.post('/stt', upload.single('file'), async (req, res) => {
        try {
            const apiKey = process.env.ASSEMBLYAI_API_KEY 
            if (!apiKey) return res.status(500).json({ error: 'Missing ASSEMBLYAI_API_KEY env var' })

            let audioBuffer
            
            if (req.file && req.file.buffer) {
                audioBuffer = req.file.buffer
            }
            else {
                return res.status(400).json({ error: 'No audio found. Send multipart/form-data with field `audio` or JSON with `audioBase64`.' })
            }

            // Upload audio to AssemblyAI
            const uploadResp = await axios.post('https://api.assemblyai.com/v2/upload', audioBuffer, {
                headers: {
                    authorization: apiKey,
                    'content-type': 'application/octet-stream'
                },
                maxBodyLength: Infinity
            })

            const uploadUrl = uploadResp.data?.upload_url || uploadResp.data?.url
            if (!uploadUrl) return res.status(500).json({ error: 'Failed to upload audio to AssemblyAI' })

            // Create a transcription request
            const createResp = await axios.post(
                'https://api.assemblyai.com/v2/transcript',
                { audio_url: uploadUrl },
                { headers: { authorization: apiKey, 'content-type': 'application/json' } }
            )

            const id = createResp.data?.id
            if (!id) return res.status(500).json({ error: 'Failed to create transcription job' })

            // Poll for completion
            let transcript
            for (;;) {
                await new Promise((r) => setTimeout(r, 1000))
                const poll = await axios.get(`https://api.assemblyai.com/v2/transcript/${id}`, {
                    headers: { authorization: apiKey }
                })
                const status = poll.data?.status
                if (status === 'completed') {
                    transcript = poll.data
                    break
                }
                if (status === 'error') return res.status(500).json({ error: poll.data?.error })
                // otherwise continue polling
            }

            // Send transcript to Gemini for task extraction
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
            if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY env var' })

            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
            const prompt = `Extract task details from the following text. Return a JSON object with these fields:
- taskName (string): The name/title of the task. Default: "Untitled Task" if not found.
- status (string): The status of the task (e.g., 'to-do', 'in-progress', 'completed'). Default: "to-do" if not found.
- deadline (string): The deadline in YYYY-MM-DD format. Default: null if not found.
- priority (string): The priority level (low, medium, high). Default: "medium" if not found.

Return ONLY valid JSON, no other text.

Text: ${transcript.text}`

            const geminiResp = await model.generateContent(prompt)
            let taskDetails = {
              taskName: 'Untitled Task',
              status: 'to-do',
              deadline: null,
              priority: 'medium'
            }

            try {
              const responseText = geminiResp.response.text()
              const jsonMatch = responseText.match(/\{[^{}]*\}/)
              if (jsonMatch) {
                taskDetails = { ...taskDetails, ...JSON.parse(jsonMatch[0]) }
              }
            } catch (parseErr) {
              console.warn('Failed to parse Gemini response:', parseErr.message)
            }

            return res.json({ text: transcript.text, id: id, taskDetails })
        } catch (err) {
            console.error('STT error', err?.response?.data || err.message || err)
            return res.status(500).json({ error: 'Internal server error', details: err?.response?.data || err.message })
        }
    }
)

app.listen(3000, ()=>{
    console.log('App is listening at port 3000')
})
