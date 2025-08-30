import React, { useState } from "react";
import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/webpack";

export default function DocumentSummaryAssistant() {
  const [extractedText, setExtractedText] = useState("");
  const [summary, setSummary] = useState("");
  const [length, setLength] = useState("short");
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [keySentences, setKeySentences] = useState([]);

  // Extract text from PDF
  const extractPDF = async (file) => {
    const pdfData = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((it) => it.str).join(" ") + "\n";
    }
    return text;
  };

  // Extract text from Image (OCR)
  const extractImage = async (file) => {
    const worker = await createWorker("eng");
    const { data } = await worker.recognize(file);
    await worker.terminate();
    return data.text;
  };

  // Handle file upload
  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    let text = "";
    if (file.type === "application/pdf") {
      text = await extractPDF(file);
    } else if (file.type.startsWith("image/")) {
      text = await extractImage(file);
    } else {
      alert("Unsupported file type!");
    }
    setExtractedText(text);
    setLoading(false);
  };

  // Enhanced Summarizer with better precision
  const summarize = (text, len = "short") => {
    // Clean and normalize text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Split into sentences more accurately
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Calculate word frequency with better filtering
    const wordFreq = {};
    const words = cleanText.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    
    words.forEach(word => {
      // Filter out common stop words
      const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'a', 'an'];
      if (!stopWords.includes(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    // Score sentences based on word frequency and position
    const scored = sentences.map((sentence, index) => {
      let score = 0;
      const sentenceWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
      
      // Base score from word frequency
      sentenceWords.forEach(word => {
        score += wordFreq[word] || 0;
      });
      
      // Bonus for first few sentences (introduction)
      if (index < 3) score += 2;
      
      // Bonus for sentences with key phrases
      const keyPhrases = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'significant', 'conclusion', 'summary', 'result', 'finding'];
      keyPhrases.forEach(phrase => {
        if (sentence.toLowerCase().includes(phrase)) score += 3;
      });
      
      // Penalty for very short or very long sentences
      const wordCount = sentenceWords.length;
      if (wordCount < 5) score -= 1;
      if (wordCount > 25) score -= 1;
      
      return { sentence: sentence.trim(), score };
    });

    // Sort by score and select top sentences
    scored.sort((a, b) => b.score - a.score);
    
    let count;
    switch(len) {
      case "short": count = Math.min(3, scored.length); break;
      case "medium": count = Math.min(6, scored.length); break;
      case "long": count = Math.min(10, scored.length); break;
      default: count = Math.min(3, scored.length);
    }
    
    const summarySentences = scored.slice(0, count).map(s => s.sentence);

    // Extract top keywords (excluding common words)
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([word, freq]) => word)
      .filter(word => word.length > 3);

    // Create summary text
    let summaryText = summarySentences.join(". ") + ".";
    
    // Highlight keywords in summary
    topWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      summaryText = summaryText.replace(
        regex,
        `<span class="bg-gradient-to-r from-yellow-300 to-orange-300 font-semibold px-2 py-1 rounded-lg shadow-sm">${word}</span>`
      );
    });

    return { summaryText, topWords, summarySentences };
  };

  // Trigger summarization
  const handleSummarize = () => {
    if (!extractedText) return alert("⚠️ Upload a file first!");
    const { summaryText, topWords, summarySentences } = summarize(extractedText, length);
    setSummary(summaryText);
    setKeywords(topWords);
    setKeySentences(summarySentences.slice(0, 4));
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 sm:mt-12 container-padded">
      {/* Professional Header */}
      <div className="text-center mb-16 fade-in-up">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-full mb-8 shadow-2xl pulse-professional">
          <span className="text-4xl">💎</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-black mb-6">
          Document Summary Assistant
        </h1>
        <p className="text-2xl text-champagne max-w-3xl mx-auto leading-relaxed mb-4">
          Professional AI-powered document analysis with intelligent text extraction
        </p>
        <div className="flex justify-center items-center gap-4 text-champagne">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
            Enterprise Grade
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-sapphire-500 rounded-full"></span>
            AI Powered
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 bg-ruby-500 rounded-full"></span>
            Professional Quality
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Left column: uploader + controls */}
        <div className="card p-8 sm:p-10 hover-lift">
          <div className="mb-10">
            <h3 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <span className="text-4xl">📤</span>
              Upload Document
            </h3>
            <p className="text-xl text-champagne">Drop your professional documents for advanced analysis</p>
          </div>

          <label className="file-upload-area w-full p-12 sm:p-16 text-center rounded-3xl cursor-pointer transition-all duration-300 mb-8 block glow-gold">
            <div className="space-y-6">
              <div className="text-6xl mb-6">📁</div>
              <div className="text-2xl font-bold">
                Drag & Drop PDF or Image here
              </div>
              <div className="text-lg text-champagne">
                or Click to Select
              </div>
              <div className="text-sm text-champagne/80 mt-4">
                Supported: PDF, PNG, JPG. Professional processing for large documents.
              </div>
            </div>
            <input
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </label>

          {/* Controls */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex-1">
                <label className="block font-bold text-xl mb-3">Summary Length</label>
                <select
                  className="w-full p-4 border-2 rounded-2xl text-lg font-semibold transition-all duration-300"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                >
                  <option value="short">Short (3 sentences)</option>
                  <option value="medium">Medium (6 sentences)</option>
                  <option value="long">Long (10 sentences)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleSummarize}
                className="btn btn-primary px-10 py-5 text-xl font-bold rounded-2xl transition-all duration-300 flex-1 sm:flex-none glow-gold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-4">
                    <div className="loading-spinner"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>✨ Generate Professional Summary</span>
                )}
              </button>
              
              <button
                onClick={() => { setExtractedText(""); setSummary(""); setKeywords([]); setKeySentences([]); }}
                className="btn btn-secondary px-8 py-5 rounded-2xl transition-all duration-300"
              >
                🗑️ Clear
              </button>
              
              {summary && (
                <button
                  onClick={() => { if(summary){ navigator.clipboard.writeText(summary.replace(/<[^>]*>?/gm, "")); }}}
                  className="btn btn-success px-8 py-5 rounded-2xl transition-all duration-300"
                >
                  📋 Copy
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right column: summary + highlights */}
        <div className="card p-8 sm:p-10 hover-lift">
          <div className="mb-10">
            <h3 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <span className="text-4xl">📊</span>
              Analysis Results
            </h3>
            <p className="text-xl text-champagne">Professional document insights and advanced summary</p>
          </div>

          {!summary ? (
            <div className="text-center py-20">
              <div className="text-8xl mb-6 opacity-50">📝</div>
              <div className="text-xl text-champagne">
                                 Upload a file and click <span className="font-bold text-yellow-400">Generate Professional Summary</span> to see results.
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Display */}
              <div className="summary-display p-8 rounded-3xl">
                <h3 className="font-bold mb-6 text-2xl flex items-center gap-3">
                  <span className="text-3xl">📌</span>
                  Document Summary
                </h3>
                <div 
                  className="leading-relaxed text-lg prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: summary }}
                />
              </div>

              {/* Keywords Section */}
              <div className="bg-white/10 backdrop-blur-sm border-2 border-yellow-400/30 rounded-3xl p-8">
                <h4 className="font-bold mb-6 text-2xl flex items-center gap-3">
                  <span className="text-2xl">🔑</span>
                  Key Insights
                </h4>
                <div className="space-y-6">
                  <div>
                    <h5 className="font-bold text-xl mb-4">Top Keywords</h5>
                    <div className="flex flex-wrap gap-4">
                      {keywords.map((k) => (
                        <span key={k} className="keyword-tag">
                          #{k}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {keySentences.length > 0 && (
                    <div>
                      <h5 className="font-bold text-xl mb-4">Key Sentences</h5>
                      <ul className="space-y-3">
                        {keySentences.map((s, idx) => (
                          <li key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-2xl border-l-4 border-yellow-400">
                            <span className="text-yellow-400 font-bold text-lg mt-1">•</span>
                            <span className="text-lg leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Professional Footer */}
      <div className="text-center mt-20 text-champagne">
        <div className="inline-flex items-center gap-4 mb-4">
          <span className="text-2xl">💎</span>
          <span className="text-xl font-bold">Professional Document Processing</span>
          <span className="text-2xl">💎</span>
        </div>
        <p className="text-lg">
          Powered by React, Tesseract.js, and pdfjs-dist • Professional-grade document analysis
        </p>
      </div>
    </div>
  );
}


