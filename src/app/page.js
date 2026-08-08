"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [results, setResults] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedInput = localStorage.getItem("formatterInputText");
    const savedResults = localStorage.getItem("formatterResults");
    
    if (savedInput) {
      setInputText(savedInput);
    }
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
      } catch (e) {
        console.error("Error parsing saved results", e);
      }
    }
  }, []);

  // Save data to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("formatterInputText", inputText);
  }, [inputText]);

  useEffect(() => {
    localStorage.setItem("formatterResults", JSON.stringify(results));
  }, [results]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all data? This cannot be undone.")) {
      setInputText("");
      setResults([]);
      localStorage.removeItem("formatterInputText");
      localStorage.removeItem("formatterResults");
    }
  };

  const handleFormatAndAdd = () => {
    if (!inputText.trim()) return;

    // Remove all newlines and carriage returns, replacing them with a space
    // and trim extra spaces if needed.
    const formattedText = inputText.replace(/[\r\n]+/g, " ").trim();
    
    // The predefined prompt string
    const promptPrefix = `Create visually attractive, colorful, and well-structured study notes from the exact text I provide. Image size 4.88"*8.25". Do NOT remove, rewrite, summarize, or change any words. Keep the content exactly the same. Act as a professional book writer with 30 years of experience designing premium handwritten study materials. Background Rule (MOST IMPORTANT CHANGE): • The entire page must look like a pure white blank paper. • No lines, no grids, no textures, no shadows. • Just a clean white sheet like real notebook paper without ruling. • Content must appear in natural handwritten note style, as if written by hand on white paper. • Only the background changes to pure white paper --everything else remains exactly the same. Design the notes in a clean, modern, student-friendly style that looks natural and human-made, not AI-generated. Layout & Style Guidelines: • Use soft pastel or highlighter color themes (yellow, blue, green, pink, purple). • Add neat headings, sub-headings, bullet points, underlines, and highlight important keywords. • Maintain proper spacing and margins so the page looks organized and readable. • Use handwritten-style or study-notebook style fonts if possible. • Make it look like premium exam revision notes or topper notes. Illustrations & Visuals: • Add 3–4 medium, topic-relevant illustration images/Medium based on the subject. • Illustrations must be simple, clean, and educational --not cartoonish or childish. • Images should support the topic (atoms for chemistry, formulas for math, organs for biology, diagrams for physics, etc.). • Keep illustrations small and well-placed near headings or corners, not overpowering the text. Subject Flexibility: • The topic can be Physics, Chemistry, Mathematics, Biology, or any academic subject. • Choose illustration style automatically according to the subject. Overall Feel: • Beautiful, aesthetic, exam-ready, and highly engaging. • Should look like a smart student’s personal revision notebook. • Pure white blank paper background with soft color accents only. • Professional but friendly handwritten appearance. Typography & Formatting Rules (Universal Fixed Settings): • Body Font: Times New Roman • Body Font Size: 11 • Heading Font Size: 14 • Line Spacing (Entire Text): 1.4 • Text Alignment: Left Aligned • Background Color: Pure White Only`;

    const finalResult = `${promptPrefix} "${formattedText}"`;

    // Add to results
    setResults((prev) => [...prev, finalResult]);
    
    // Clear input
    setInputText("");
  };

  const handleExport = () => {
    if (results.length === 0) return;

    // Join all paragraphs with double newlines
    const contentToExport = results.join("\n\n");
    
    // Create a Blob and a download link
    const blob = new Blob([contentToExport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted_paragraphs.txt";
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container">
      <div className="header">
        <h1>Text Formatter</h1>
        <p>Convert your multi-line text into clean paragraphs.</p>
      </div>

      <div className="grid-layout">
        
        {/* Left Column: Results (6/12 width on md+ screens) */}
        <section className="panel">
          <div className="panel-title">
            <span>Results ({results.length})</span>
            <button 
              className="btn success" 
              onClick={handleExport}
              disabled={results.length === 0}
              style={{ opacity: results.length === 0 ? 0.5 : 1, cursor: results.length === 0 ? 'not-allowed' : 'pointer' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export TXT
            </button>
          </div>
          
          <div className="results-list">
            {results.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <p>No results yet. Start adding text on the right.</p>
              </div>
            ) : (
              results.map((text, index) => (
                <div key={index} className="result-item">
                  <div className="result-number">{index + 1}</div>
                  <div className="result-text">{text}</div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Input (6/12 width on md+ screens) */}
        <section className="panel">
          <div className="panel-title">
            Input Text
          </div>
          <textarea
            placeholder="Paste your text here... Only line breaks (Enters) will be removed. Your words and meaning will NOT be changed."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button className="btn" onClick={handleFormatAndAdd} style={{ flex: 1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Remove Enters & Add
            </button>
            <button className="btn" onClick={handleReset} style={{ flex: 1, backgroundColor: '#f44336', borderColor: '#d32f2f' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Reset Data
            </button>
          </div>
        </section>

      </div>
    </main>
  );
}
