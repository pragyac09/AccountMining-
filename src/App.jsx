import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [account, setAccount] = useState('');
  const [answers, setAnswers] = useState({ q1: '', q2: '', q3: '' });
  const [bucketIdeas, setBucketIdeas] = useState({ automation: [], processFix: [], aiUseCase: [] });
  const [scoring, setScoring] = useState({ a: '', b: '', c: '' });
  const [bucketResults, setBucketResults] = useState(null);
const colors = {
  primaryBlue: '#0057B8',
  primaryPurple: '#6B5B95',
  darkNavy: '#0A1628',
  white: '#FFFFFF',
  lightGray: '#F8FAFC',
  textDark: '#1F2937',
  successGreen: '#22C55E',
  warningOrange: '#F97316',
  infoBlue: '#3B82F6',
  mediumYellow: '#EAB308',
  highRed: '#EF4444',
  lowGray: '#64748B'
};

// Category definitions
const categoryOptions = {
  Automation: [
    'Scheduled tasks',
    'Report generation',
    'Data movement',
    'Manual copy-paste work'
  ],
  "AI Use Case": [
    'Reading emails',
    'Reading documents',
    'Summarization',
    'Pattern detection',
    'Classification',
    'Predictions',
    'Judgement required'
  ],
  "Process Fix": [
    'Ownership issues',
    'Duplicate work',
    'Approval bottlenecks',
    'Broken workflows'
  ]
};

  // Render reasons for the selected category
  const renderCategoryReason = () => {
    const reasons = classificationRules[result.category] || [];
    return (
      <div style={{ marginBottom: '30px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Why this category?</p>
        <ul style={{ paddingLeft: '20px', margin: 0 }}>
          {reasons.map((r, i) => (
            <li key={i} style={{ color: '#475569' }}>{r}</li>
          ))}
        </ul>
      </div>
    );
  };

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { sender: 'bot', text }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
  };

  const handleStart = () => {
    if (name.trim() && account.trim()) {
      setStep(2);
      addBotMessage(currentQuestion);
    }
  };

  const countWords = (str) => str.trim().split(/\s+/).filter(w => w.length > 0).length;

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    addUserMessage(userText);
    setInputValue('');

    const wordCount = countWords(userText);

    setTimeout(() => {
      if (chatStage === 'q1') {
        setAnswers(prev => ({ ...prev, q1: userText }));
        if (wordCount < 6) {
          setChatStage('q1_probe');
          setCurrentQuestion("Can you tell me a bit more — how often does this happen?");
          addBotMessage("Can you tell me a bit more — how often does this happen?");
        } else {
          setChatStage('q2');
          setCurrentQuestion("What is taking up too much of your time?");
          addBotMessage("What is taking up too much of your time?");
        }
      } else if (chatStage === 'q1_probe') {
        setAnswers(prev => ({ ...prev, q1: prev.q1 + " | Probe: " + userText }));
        setChatStage('q2');
        setCurrentQuestion("What is taking up too much of your time?");
        addBotMessage("What is taking up too much of your time?");
      } else if (chatStage === 'q2') {
        setAnswers(prev => ({ ...prev, q2: userText }));
        if (wordCount < 6) {
          setChatStage('q2_probe');
          setCurrentQuestion("How long does this take you each time it comes up?");
          addBotMessage("How long does this take you each time it comes up?");
        } else {
          setChatStage('q3');
          setCurrentQuestion("What problem keeps coming up again and again?");
          addBotMessage("What problem keeps coming up again and again?");
        }
      } else if (chatStage === 'q2_probe') {
        setAnswers(prev => ({ ...prev, q2: prev.q2 + " | Probe: " + userText }));
        setChatStage('q3');
        setCurrentQuestion("What problem keeps coming up again and again?");
        addBotMessage("What problem keeps coming up again and again?");
      } else if (chatStage === 'q3') {
        setAnswers(prev => ({ ...prev, q3: userText }));
        if (wordCount < 6) {
          setChatStage('q3_probe');
          setCurrentQuestion("What makes this problem keep recurring in your view?");
          addBotMessage("What makes this problem keep recurring in your view?");
        } else {
          setChatStage('done');
          setStep(3);
        }
      } else if (chatStage === 'q3_probe') {
        setAnswers(prev => ({ ...prev, q3: prev.q3 + " | Probe: " + userText }));
        setChatStage('done');
        setStep(3);
      }
    }, 500);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateScoring = () => {
    const errs = {};
    const aNum = Number(scoring.a);
    const bNum = Number(scoring.b);
    const cNum = Number(scoring.c);

    if (!scoring.a || isNaN(aNum) || aNum <= 0) errs.a = "Must be a positive number.";
    if (!scoring.b || isNaN(bNum) || bNum <= 0) errs.b = "Must be a positive number.";
    if (!scoring.c || isNaN(cNum) || cNum < 1 || cNum > 100) errs.c = "Must be between 1 and 100.";

    setScoringErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleClassify = async () => {
    if (!validateScoring()) return;
    setIsClassifying(true);
    setApiError('');

    try {
      // 1. Fetch from proxy
      let classifyData = null;
      try {
        const classifyRes = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers)
        });
        if (classifyRes.ok) {
          classifyData = await classifyRes.json();
        } else {
          console.warn('Classify API returned error status:', classifyRes.status);
          try {
            const errData = await classifyRes.json();
            console.warn('Error payload:', errData);
          } catch (_) {
            // ignore parsing error
          }
          // fallback mock response
          classifyData = { idea_summary: '', category: 'Automation' };
        }
      } catch (err) {
        console.error('Classify fetch failed:', err);
        classifyData = { idea_summary: '', category: 'Automation' };
      }

      // 2. Calculate Score and derive category based on score thresholds
      const A = Number(scoring.a);
      const B = Number(scoring.b);
      const C = Number(scoring.c);
      const rawScore = A * B * (C / 100);
      const roundedScore = Math.round(rawScore);

      // Determine tier as before
      let tier = "Needs More Detail";
      if (roundedScore >= 300) tier = "High Priority";
      else if (roundedScore >= 100) tier = "Medium Priority";

      // Derive category from score thresholds
      const derivedCategory = roundedScore >= 300 ? "Automation" : roundedScore >= 100 ? "AI Use Case" : "Process Fix";

      const finalResult = {
        ...classifyData,
        score: roundedScore,
        tier,
        // Override category with derived one for consistency with score
        category: derivedCategory
      };
      
      setResult(finalResult);
      setStep(5);

      // 3. Save to Tracker via Backend
      fetch('/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            account,
            idea_summary: finalResult.idea_summary,
            category: finalResult.category,
            A, B, C,
            score: finalResult.score,
            answers: { q1: answers.q1, q2: answers.q2, q3: answers.q3 },
            answerCounts: { x: answerCounts.x, y: answerCounts.y, z: answerCounts.z }
          })
        }).catch(err => console.error("Failed to save submission:", err));

    } catch (err) {
      setApiError(err.message || 'Something went wrong — please try again');
    } finally {
      setIsClassifying(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setName('');
    setAccount('');
    setMessages([]);
    setInputValue('');
    setChatStage('q1');
    setAnswers({ q1: '', q2: '', q3: '' });
    setCurrentQuestion("What is one thing at work you really don't want to do?");
    setScoring({ a: '', b: '', c: '' });
    setScoringErrors({});
    setResult(null);
    setApiError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <img src="/favicon.ico" alt="HCL Logo" style={{ width: '40px', height: '40px', borderRadius: '4px', marginRight: '15px' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>HCL Technologies</h1>
          <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>AI Value Discovery Series</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {step === 1 && (
          <div style={{ backgroundColor: colors.lightGray, color: colors.textDark, borderRadius: '12px', padding: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, color: colors.primaryBlue }}>Welcome to Account Mining</h2>
            <p>Please enter your details to begin.</p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Your Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '16px' }} 
              />
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Account</label>
              <input 
                type="text" 
                value={account} 
                onChange={e => setAccount(e.target.value)} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #CCC', fontSize: '16px' }} 
              />
            </div>

            <button 
              onClick={handleStart}
              disabled={!name.trim() || !account.trim()}
              style={{
                backgroundColor: (name.trim() && account.trim()) ? colors.primaryPurple : '#A0AEC0',
                color: colors.white,
                padding: '14px 24px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: (name.trim() && account.trim()) ? 'pointer' : 'not-allowed',
                width: '100%',
                transition: 'background-color 0.3s'
              }}
            >
              Start
            </button>
          </div>
        )}

        {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: colors.lightGray, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
              {/* Questions Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '5px' }}>
                {/* Question 1 */}
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#6B5B95', fontSize: '20px' }}>{"What is one thing at work you really don't want to do?"}</label>
                  <textarea
                    value={answers.q1}
                    onChange={e => setAnswers(prev => ({ ...prev, q1: e.target.value }))}
                    placeholder="Enter multiple points, each on a new line"
                    rows={6}
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '20px', resize: 'vertical' }}
                  />
                </div>
                {/* Question 2 */}
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                    <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#6B5B95', fontSize: '20px' }}>{"What is taking up too much of your time?"}</label>
                  <textarea
                    value={answers.q2}
                    onChange={e => setAnswers(prev => ({ ...prev, q2: e.target.value }))}
                    placeholder="Enter multiple points, each on a new line"
                    rows={6}
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '20px', resize: 'vertical' }}
                  />
                </div>
                {/* Question 3 */}
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                  <label style={{ fontWeight: 'bold', marginBottom: '4px', color: '#6B5B95', fontSize: '20px' }}>{"What problem keeps coming up again and again?"}</label>
                  <textarea
                    value={answers.q3}
                    onChange={e => setAnswers(prev => ({ ...prev, q3: e.target.value }))}
                    placeholder="Enter multiple points, each on a new line"
                    rows={6}
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #CCC', fontSize: '20px', resize: 'vertical' }}
                  />
                </div>
              </div>
              {/* Action Button */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: '0 5px 5px' }}>
                <button
                  onClick={() => {
                    const countLines = txt => (txt.trim() ? txt.trim().split(/\n+/).length : 0);
                    const x = countLines(answers.q1);
                    const y = countLines(answers.q2);
                    const z = countLines(answers.q3);
                    setAnswerCounts({ x, y, z });
                    setStep(3);
                  }}
                  style={{
                    backgroundColor: colors.primaryPurple,
                    color: colors.white,
                    padding: '12px 24px',
                    borderRadius: '3px',
                    border: 'none',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s'
                  }}
                >
                  Continue to Scoring
                </button>
              </div>
            </div>
    )}

        {step === 3 && (
          <div style={{ backgroundColor: colors.lightGray, color: colors.textDark, borderRadius: '12px', padding: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginTop: 0, color: colors.primaryBlue }}>Let's estimate the value</h2>
            <p>Please answer a few quick questions to help us score your idea.</p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>How many minutes does this take manually, each time?</label>
              <input 
                type="number" 
                value={scoring.a} 
                onChange={e => setScoring({...scoring, a: e.target.value})} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: `1px solid ${scoringErrors.a ? colors.highRed : '#CCC'}`, fontSize: '16px' }} 
              />
              {scoringErrors.a && <div style={{ color: colors.highRed, fontSize: '12px', marginTop: '4px' }}>{scoringErrors.a}</div>}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>How many times per week does this happen?</label>
              <input 
                type="number" 
                value={scoring.b} 
                onChange={e => setScoring({...scoring, b: e.target.value})} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: `1px solid ${scoringErrors.b ? colors.highRed : '#CCC'}`, fontSize: '16px' }} 
              />
              {scoringErrors.b && <div style={{ color: colors.highRed, fontSize: '12px', marginTop: '4px' }}>{scoringErrors.b}</div>}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>What % of that time do you think a solution would save? (1-100)</label>
              <input 
                type="number" 
                value={scoring.c} 
                onChange={e => setScoring({...scoring, c: e.target.value})} 
                style={{ width: '100%', padding: '12px', borderRadius: '6px', border: `1px solid ${scoringErrors.c ? colors.highRed : '#CCC'}`, fontSize: '16px' }} 
              />
              {scoringErrors.c && <div style={{ color: colors.highRed, fontSize: '12px', marginTop: '4px' }}>{scoringErrors.c}</div>}
            </div>

            {apiError && <div style={{ color: colors.highRed, marginBottom: '20px', fontWeight: 'bold', textAlign: 'center' }}>{apiError}</div>}

            <button 
              onClick={handleClassify}
              disabled={isClassifying}
              style={{
                backgroundColor: isClassifying ? '#A0AEC0' : colors.primaryPurple,
                color: colors.white,
                padding: '14px 24px',
                borderRadius: '6px',
                border: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: isClassifying ? 'wait' : 'pointer',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {isClassifying ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50" style={{ width: '20px', height: '20px', marginRight: '10px', animation: 'spin 1s linear infinite' }}>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round"></circle>
                  </svg>
                  Analysing your responses...
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </>
              ) : "Calculate & Classify"}
            </button>
          </div>
        )}

        {step === 5 && result && (
          <div style={{ backgroundColor: colors.lightGray, color: colors.textDark, borderRadius: '12px', padding: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '5px' }}>
              <div>
                <h3 style={{ margin: 0, color: colors.primaryBlue }}>{name}</h3>
                <p style={{ margin: 0, color: colors.lowGray }}>{account}</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10px', color: '#94A3B8' }}>
                HCL Technologies | AI Value Discovery Series | v1.0 | June 2026
              </div>
            </div>

            <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>{result.idea_summary}</h2>
            {renderCategoryReason()}            

            {result.category === 'Process Fix' ? (
              <div style={{ backgroundColor: '#FFF7ED', border: `1px solid ${colors.warningOrange}`, padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
                <strong style={{ color: colors.warningOrange }}>This is a process issue — fix the workflow before applying technology.</strong>
              </div>
            ) : (
              <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '8px', border: `1px solid #E2E8F0`, marginBottom: '30px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: colors.lowGray, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px' }}>Idea Category</div>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  color: colors.white,
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '15px',
                  backgroundColor:
                    result.category === 'Automation' ? colors.successGreen :
                    result.category === 'Process Fix' ? colors.warningOrange :
                    colors.infoBlue
                }}>
                  {result.category}
                </div>

                <div style={{ fontSize: '14px', color: colors.lowGray, textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '10px' }}>Priority Score</div>
                <div style={{ fontSize: '48px', fontWeight: '900', color: colors.primaryPurple, lineHeight: '1', marginBottom: '15px' }}>{result.score}</div>

                {/* Tier Badge */}
                <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', color: colors.white, fontWeight: 'bold', fontSize: '12px', marginBottom: '25px', backgroundColor: result.tier === 'High Priority' ? colors.highRed : result.tier === 'Medium Priority' ? colors.mediumYellow : colors.lowGray }}>
                  {result.tier}
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min((result.score / 500) * 100, 100)}%`,
                    height: '100%',
                    backgroundColor: colors.primaryBlue, 
                    borderRadius: '4px',
                    animation: 'fillBar 1.5s ease-out forwards'
                  }}></div>
                </div>
                <style>{`
                  @keyframes fillBar {
                    to { width: ${Math.min((result.score / 500) * 100, 100)}%; }
                  }
                `}</style>

                {/* Answers Grid */}
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ color: colors.primaryPurple, marginBottom: '15px' }}>Your Responses</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '10px', backgroundColor: colors.white, padding: '15px', borderRadius: '8px', border: `1px solid ${colors.lowGray}` }}>
                    <div style={{ fontWeight: 'bold' }}>Question</div>
                    <div style={{ fontWeight: 'bold' }}>Answer</div>
                    <div style={{ fontWeight: 'bold' }}>Count</div>
                    <div>What is one thing at work you really don't want to do?</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{answers.q1}</div>
                    <div>{answerCounts.x}</div>
                    <div>What is taking up too much of your time?</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{answers.q2}</div>
                    <div>{answerCounts.y}</div>
                    <div>What problem keeps coming up again and again?</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{answers.q3}</div>
                    <div>{answerCounts.z}</div>
                  </div>
                </div>
              </div>
            )}
            {step === 5 && (
              <button
                onClick={resetFlow}
                style={{
                  backgroundColor: 'transparent',
                  color: colors.primaryBlue,
                  border: `2px solid ${colors.primaryBlue}`,
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.target.style.backgroundColor = colors.primaryBlue; e.target.style.color = colors.white; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = colors.primaryBlue; }}
              >
                Start Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
