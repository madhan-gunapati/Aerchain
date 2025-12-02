import express from 'express'
import cors from 'cors'
import axios from 'axios'
import dotenv from "dotenv"
import multer from 'multer'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from './lib/prisma.js'
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

            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
            const prompt = `Extract task details from the following text. Return a JSON object with these fields:
- taskName (string): The name/title of the task. Default: "Untitled Task" if not found.
- description(string):The detailed description of the task. Default: "No Detailed Description" if not found.
- status (string): The status of the task (e.g., 'to-do', 'in-progress', 'completed'). Default: "to-do" if not found.
- deadline (string): The deadline in YYYY-MM-DD format. Default: null if not found.
- priority (string): The priority level (low, medium, high). Default: "medium" if not found.

Return ONLY valid JSON, no other text.

Text: ${transcript.text}`

            const geminiResp = await model.generateContent(prompt)
            let taskDetails = {
              taskName: 'Untitled Task',
              description:'No Detailed Desc.',
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

// Add new task to database
app.post('/add-task', async (req, res) => {
    try {
        const { name, desc, dueDate, priority, status } = req.body

        if (!name) {
            return res.status(400).json({ error: 'Task name is required' })
        }

        const task = await prisma.task.create({
            data: {
                name,
                desc: desc || 'No Detailed Description',
                dueDate: dueDate ? new Date(dueDate) : null,
                priority: priority || 'medium',
                status: status || 'todo'
            }
        })

        return res.status(201).json({ message: 'Task added successfully', task })
    } catch (err) {
        console.error('Add task error:', err.message)
        return res.status(500).json({ error: 'Failed to add task', details: err.message })
    }
})

// Update existing task
app.patch('/update-task/:id', async (req, res) => {
    try {
        const { id } = req.params
        const { name, desc, dueDate, priority, status } = req.body

        const task = await prisma.task.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(desc && { desc }),
                ...(dueDate && { dueDate: new Date(dueDate) }),
                ...(priority && { priority }),
                ...(status && { status })
            }
        })

        return res.json({ message: 'Task updated successfully', task })
    } catch (err) {
        console.error('Update task error:', err.message)
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Task not found' })
        }
        return res.status(500).json({ error: 'Failed to update task', details: err.message })
    }
})

// Delete existing task
app.delete('/delete-task/:id', async (req, res) => {
    try {
        const { id } = req.params

        const task = await prisma.task.delete({
            where: { id }
        })

        return res.json({ message: 'Task deleted successfully', task })
    } catch (err) {
        console.error('Delete task error:', err.message)
        if (err.code === 'P2025') {
            return res.status(404).json({ error: 'Task not found' })
        }
        return res.status(500).json({ error: 'Failed to delete task', details: err.message })
    }
})

// Fetch all tasks
app.get('/tasks', async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({ orderBy: { createdAt: 'desc' } })
        return res.json({ tasks })
    } catch (err) {
        console.error('Fetch tasks error:', err.message || err)
        return res.status(500).json({ error: 'Failed to fetch tasks', details: err.message })
    }
})

app.listen(3000, ()=>{
    console.log('App is listening at port 3000')
})
