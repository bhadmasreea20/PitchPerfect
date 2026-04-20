import { useState, useRef } from "react"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`

const OPENAI_API_KEY = "YOUR_API_KEY_HERE"

function App() {
  const [file, setFile] = useState(null)
  const [extractedText, setExtractedText] = useState("")
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [scores, setScores] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0]
    if (!uploadedFile) return
    setFile(uploadedFile)
    setLoading(true)
    setScores(null)

    const reader = new FileReader()
    reader.onload = async (event) => {
      const typedArray = new Uint8Array(event.target.result)
      const pdf = await pdfjsLib.getDocument(typedArray).promise
      let fullText = ""

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => item.str).join(" ")
        fullText += `\n--- Slide ${i} ---\n${pageText}`
      }

      setExtractedText(fullText)
      setLoading(false)
    }
    reader.readAsArrayBuffer(uploadedFile)
  }

  const analyzeDeck = async () => {
    if (!extractedText) return
    setAnalyzing(true)

    const prompt = `You are an expert startup investor. Analyze this pitch deck and return ONLY a JSON object with no extra text, no markdown, no backticks. Just raw JSON like this:
{
  "overallScore": 72,
  "dimensions": [
    { "name": "Problem Clarity", "score": 80, "feedback": "Clear problem statement" },
    { "name": "Solution Strength", "score": 70, "feedback": "Solution is well defined" },
    { "name": "Market Size", "score": 65, "feedback": "TAM needs more data" },
    { "name": "Business Model", "score": 75, "feedback": "Revenue model is clear" },
    { "name": "Traction", "score": 60, "feedback": "Limited traction shown" },
    { "name": "Team Credibility", "score": 70, "feedback": "Team looks capable" },
    { "name": "Competitive Advantage", "score": 68, "feedback": "Differentiation needs work" },
    { "name": "Investability", "score": 72, "feedback": "Promising but needs polish" }
  ],
  "summary": "Overall this is a promising deck with some areas to improve."
}

Here is the pitch deck content:
${extractedText.slice(0, 3000)}`

    try {
  const response = await fetch(
  "https://api.openai.com/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000
    })
  }
)
const data = await response.json()
console.log("OpenAI response:", JSON.stringify(data))

if (!data.choices || !data.choices[0]) {
  alert("OpenAI returned no response. Try again!")
  setAnalyzing(false)
  return
}

const rawText = data.choices[0].message.content
      console.log("Raw text:", rawText)
      const cleaned = rawText.replace(/```json|```/g, "").trim()
      const result = JSON.parse(cleaned)
      setScores(result)
    } catch (err) {
      console.error(err)
    }
    setAnalyzing(false)
  }

  const getColor = (score) => {
    if (score >= 75) return "text-green-400"
    if (score >= 50) return "text-yellow-400"
    return "text-red-400"
  }

  const getBar = (score) => {
    if (score >= 75) return "bg-green-500"
    if (score >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-500">PitchPerfect ⚡</h1>
        <span className="text-sm text-gray-400">AI Pitch Deck Analyzer</span>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-16">
        <h2 className="text-5xl font-extrabold mb-6 leading-tight">
          Is Your Pitch Deck <br />
          <span className="text-blue-500">Investor Ready?</span>
        </h2>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          Upload your pitch deck and get instant AI-powered feedback.
        </p>

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current.click()}
          className="border-2 border-dashed border-blue-500 rounded-2xl p-12 cursor-pointer hover:bg-gray-900 transition w-full max-w-lg mb-6"
        >
          <div className="text-5xl mb-4">📂</div>
          <p className="text-lg font-semibold">Click to upload your pitch deck</p>
          <p className="text-gray-400 text-sm mt-2">Supports PDF files</p>
        </div>

        <input
          type="file"
          accept=".pdf"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {loading && (
          <div className="bg-blue-900 border border-blue-500 rounded-xl px-6 py-3 text-blue-400 font-semibold mb-4">
            ⏳ Reading your deck...
          </div>
        )}

        {file && !loading && extractedText && !scores && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-green-900 border border-green-500 rounded-xl px-6 py-3 text-green-400 font-semibold">
              ✅ {file.name} uploaded successfully!
            </div>
            <button
              onClick={analyzeDeck}
              disabled={analyzing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl text-lg transition"
            >
              {analyzing ? "⏳ Analyzing..." : "Analyze My Deck 🚀"}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {scores && (
        <div className="px-10 pb-24">

          {/* Overall Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-8 text-center">
            <p className="text-gray-400 mb-2">Overall Investability Score</p>
            <p className={`text-8xl font-extrabold ${getColor(scores.overallScore)}`}>
              {scores.overallScore}
            </p>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto">{scores.summary}</p>
          </div>

          {/* 8 Dimensions */}
          <div className="grid grid-cols-2 gap-6">
            {scores.dimensions.map((d, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg">{d.name}</h3>
                  <span className={`text-2xl font-extrabold ${getColor(d.score)}`}>{d.score}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full ${getBar(d.score)}`}
                    style={{ width: `${d.score}%` }}
                  />
                </div>
                <p className="text-gray-400 text-sm">{d.feedback}</p>
              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  )
}

export default App