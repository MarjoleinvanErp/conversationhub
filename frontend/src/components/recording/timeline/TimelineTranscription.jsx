import React, { useState, useEffect, useRef } from 'react';

const TimelineTranscription = ({ 
  liveTranscriptions = [],
  whisperTranscriptions = [],
  isRecording = false,
  meetingStartTime = null,
  onTranscriptionUpdate = () => {}
}) => {
  // View state
  const [viewMode, setViewMode] = useState('both'); // 'both', 'smart', 'whisper', 'live'
  const [syncScroll, setSyncScroll] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [selectedTimeblock, setSelectedTimeblock] = useState(null);

  // Timeline state
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  
  // Auto-scroll refs
  const liveScrollRef = useRef(null);
  const whisperScrollRef = useRef(null);
  const isUserScrolling = useRef(false);

  // Update current time
  useEffect(() => {
    if (isRecording && meetingStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((new Date() - new Date(meetingStartTime)) / 1000);
        setCurrentTime(elapsed);
        setTotalDuration(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRecording, meetingStartTime]);

  // Format time for display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Group transcriptions by time blocks (30-second intervals)
  const groupTranscriptionsByTime = (transcriptions, type) => {
    const groups = {};
    
    transcriptions.forEach(transcription => {
      const transcriptionTime = new Date(transcription.timestamp);
      const meetingStart = new Date(meetingStartTime || transcription.timestamp);
      const relativeTime = Math.floor((transcriptionTime - meetingStart) / 1000);
      
      // Group into 30-second blocks
      const timeBlock = Math.floor(relativeTime / 30) * 30;
      
      if (!groups[timeBlock]) {
        groups[timeBlock] = {
          timeBlock,
          startTime: timeBlock,
          endTime: timeBlock + 30,
          transcriptions: [],
          type,
          aggregatedText: '',
          avgConfidence: 0,
          speaker: null,
          speakerColor: '#6B7280'
        };
      }
      
      groups[timeBlock].transcriptions.push(transcription);
    });

    // Aggregate text within each time block
    Object.values(groups).forEach(group => {
      group.aggregatedText = group.transcriptions
        .map(t => t.text)
        .join(' ')
        .trim();
      
      group.avgConfidence = group.transcriptions.reduce((sum, t) => sum + (t.confidence || 0), 0) / group.transcriptions.length;
      
      // Use speaker from first transcription in block
      if (group.transcriptions.length > 0) {
        group.speaker = group.transcriptions[0].speaker;
        group.speakerColor = group.transcriptions[0].speakerColor || '#6B7280';
      }
    });

    return Object.values(groups).sort((a, b) => a.timeBlock - b.timeBlock);
  };

  const liveTimeBlocks = groupTranscriptionsByTime(liveTranscriptions, 'live');
  const whisperTimeBlocks = groupTranscriptionsByTime(whisperTranscriptions, 'whisper');

  // Find all unique time blocks
  const allTimeBlocks = [...new Set([
    ...liveTimeBlocks.map(t => t.timeBlock),
    ...whisperTimeBlocks.map(t => t.timeBlock)
  ])].sort((a, b) => a - b);

  // Get transcription for specific time block
  const getTranscriptionForTime = (timeBlock, type) => {
    const blocks = type === 'live' ? liveTimeBlocks : whisperTimeBlocks;
    return blocks.find(block => block.timeBlock === timeBlock);
  };

  // Synchronized scroll handler
  const handleScroll = (scrollingPanel, event) => {
    if (!syncScroll || isUserScrolling.current) return;
    
    isUserScrolling.current = true;
    const { scrollTop, scrollHeight, clientHeight } = event.target;
    const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
    
    const otherPanel = scrollingPanel === 'live' ? whisperScrollRef.current : liveScrollRef.current;
    if (otherPanel) {
      const otherScrollHeight = otherPanel.scrollHeight - otherPanel.clientHeight;
      otherPanel.scrollTop = scrollPercentage * otherScrollHeight;
    }
    
    setTimeout(() => {
      isUserScrolling.current = false;
    }, 100);
  };

  // Show comparison for specific time block
  const showTimeBlockComparison = (timeBlock) => {
    setSelectedTimeblock(timeBlock);
    setShowComparison(true);
  };

  // Determine what to show based on view mode
  const shouldShowLive = (timeBlock) => {
    if (viewMode === 'whisper') return false;
    if (viewMode === 'live') return true;
    if (viewMode === 'smart') {
      const hasWhisper = getTranscriptionForTime(timeBlock, 'whisper');
      return !hasWhisper;
    }
    return true; // both mode
  };

  const shouldShowWhisper = (timeBlock) => {
    if (viewMode === 'live') return false;
    return true;
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* Header with timeline and controls */}
      <div className="p-4 border-b bg-gray-50">
        {/* Timeline Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>🕐 Timeline</span>
            <span>{formatTime(currentTime)} {totalDuration > 0 && `/ ${formatTime(totalDuration)}`}</span>
          </div>
          
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: totalDuration > 0 ? `${(currentTime / totalDuration) * 100}%` : '0%' 
                }}
              ></div>
            </div>
            
            {/* Time markers */}
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start</span>
              {isRecording && <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </span>}
              <span>Now</span>
            </div>
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">📱 Display Mode:</label>
            <select 
              value={viewMode} 
              onChange={(e) => setViewMode(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="both">Both panels (comparison)</option>
              <option value="smart">Smart auto-hide (best quality)</option>
              <option value="whisper">Whisper only (clean view)</option>
              <option value="live">Web Speech only (immediate)</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm">
              <input 
                type="checkbox" 
                checked={syncScroll} 
                onChange={(e) => setSyncScroll(e.target.checked)}
                className="rounded"
              />
              <span>🔄 Sync Scroll</span>
            </label>
            
            <div className="text-xs text-gray-500">
              Live: {liveTimeBlocks.length} • Whisper: {whisperTimeBlocks.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main transcription area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4" style={{ height: '500px' }}>
        
        {/* Left Panel: Web Speech (Live) */}
        {(viewMode === 'both' || viewMode === 'live' || viewMode === 'smart') && (
          <div className="flex flex-col border rounded-lg">
            <div className="bg-blue-50 px-3 py-2 border-b">
              <h4 className="font-medium text-blue-800 text-sm flex items-center space-x-2">
                <span>🎤</span>
                <span>Web Speech (Live)</span>
                <span className="text-xs bg-blue-200 px-2 py-1 rounded">{liveTimeBlocks.length}</span>
                {isRecording && (
                  <span className="text-xs bg-red-200 text-red-700 px-2 py-1 rounded animate-pulse">
                    Recording...
                  </span>
                )}
              </h4>
            </div>
            
            <div 
              ref={liveScrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-3"
              onScroll={(e) => handleScroll('live', e)}
            >
              {allTimeBlocks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">🎤</div>
                  <p className="text-sm">Live transcriptie verschijnt hier</p>
                  <p className="text-xs text-gray-400 mt-1">Real-time browser speech recognition</p>
                </div>
              ) : (
                allTimeBlocks.map(timeBlock => {
                  const liveBlock = getTranscriptionForTime(timeBlock, 'live');
                  
                  if (!shouldShowLive(timeBlock) || !liveBlock) {
                    return (
                      <div key={timeBlock} className="opacity-30 text-center py-2 text-xs text-gray-400">
                        [{formatTime(timeBlock)}] Whisper enhanced beschikbaar →
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={timeBlock}
                      className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400 cursor-pointer hover:bg-blue-100"
                      onClick={() => showTimeBlockComparison(timeBlock)}
                    >
                      {/* Time and speaker header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-blue-700 bg-blue-200 px-2 py-1 rounded">
                            {formatTime(timeBlock)}
                          </span>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: liveBlock.speakerColor }}
                          ></div>
                          <span className="font-medium text-sm text-blue-700">
                            {liveBlock.speaker}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-blue-600">
                            {Math.round(liveBlock.avgConfidence * 100)}%
                          </span>
                          <span className="text-xs text-gray-500">
                            📏 {liveBlock.transcriptions.length} chunks
                          </span>
                        </div>
                      </div>

                      {/* Aggregated text */}
                      <div className="text-sm text-blue-900 leading-relaxed">
                        {liveBlock.aggregatedText}
                      </div>

                      {/* Status indicators */}
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded">
                            ⚡ Live
                          </span>
                          <span className="text-blue-600">
                            {liveBlock.endTime - liveBlock.startTime}s aggregated
                          </span>
                        </div>
                        
                        {!getTranscriptionForTime(timeBlock, 'whisper') && isRecording && (
                          <span className="text-orange-600 animate-pulse">
                            🕐 Whisper ETA: ~{30 - ((currentTime - timeBlock) % 30)}s
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Right Panel: Whisper (Enhanced) */}
        {(viewMode === 'both' || viewMode === 'whisper' || viewMode === 'smart') && (
          <div className="flex flex-col border rounded-lg">
            <div className="bg-green-50 px-3 py-2 border-b">
              <h4 className="font-medium text-green-800 text-sm flex items-center space-x-2">
                <span>🤖</span>
                <span>Whisper Enhanced</span>
                <span className="text-xs bg-green-200 px-2 py-1 rounded">{whisperTimeBlocks.length}</span>
                <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-1 rounded">
                  ~30s delay
                </span>
              </h4>
            </div>
            
            <div 
              ref={whisperScrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-3"
              onScroll={(e) => handleScroll('whisper', e)}
            >
              {whisperTimeBlocks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-2xl mb-2">🤖</div>
                  <p className="text-sm">Whisper enhanced transcriptie verschijnt hier</p>
                  <p className="text-xs text-gray-400 mt-1">Azure OpenAI Whisper iedere 30 seconden</p>
                </div>
              ) : (
                allTimeBlocks.map(timeBlock => {
                  const whisperBlock = getTranscriptionForTime(timeBlock, 'whisper');
                  const liveBlock = getTranscriptionForTime(timeBlock, 'live');
                  
                  if (!shouldShowWhisper(timeBlock) || !whisperBlock) {
                    return (
                      <div key={timeBlock} className="opacity-30 text-center py-2 text-xs text-gray-400">
                        [{formatTime(timeBlock)}] {liveBlock ? '⏳ Whisper processing...' : 'No data'}
                      </div>
                    );
                  }

                  const isImproved = liveBlock && liveBlock.aggregatedText.trim() !== whisperBlock.aggregatedText.trim();

                  return (
                    <div 
                      key={timeBlock}
                      className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400 cursor-pointer hover:bg-green-100"
                      onClick={() => showTimeBlockComparison(timeBlock)}
                    >
                      {/* Time and speaker header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-green-700 bg-green-200 px-2 py-1 rounded">
                            {formatTime(timeBlock)}
                          </span>
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: whisperBlock.speakerColor }}
                          ></div>
                          <span className="font-medium text-sm text-green-700">
                            {whisperBlock.speaker}
                          </span>
                          {isImproved && (
                            <span className="text-xs bg-orange-200 text-orange-700 px-2 py-1 rounded">
                              ✨ IMPROVED
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-green-600">
                            {Math.round(whisperBlock.avgConfidence * 100)}%
                          </span>
                          <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">
                            ✅ Verified
                          </span>
                        </div>
                      </div>

                      {/* Enhanced text */}
                      <div className="text-sm text-green-900 leading-relaxed font-medium">
                        {whisperBlock.aggregatedText}
                      </div>

                      {/* Status indicators */}
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="bg-green-200 text-green-700 px-2 py-1 rounded">
                            🤖 Whisper
                          </span>
                          <span className="text-green-600">
                            💾 Saved to database
                          </span>
                        </div>
                        
                        {isImproved && (
                          <span className="text-orange-600">
                            +{Math.round(((whisperBlock.avgConfidence - (liveBlock?.avgConfidence || 0)) / (liveBlock?.avgConfidence || 1)) * 100)}% better
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Modal */}
      {showComparison && selectedTimeblock !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowComparison(false)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                📝 Comparison [{formatTime(selectedTimeblock)}]
              </h3>
              <button 
                onClick={() => setShowComparison(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Live version */}
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center space-x-2">
                  <span>🎤</span>
                  <span>Web Speech</span>
                </h4>
                <div className="text-sm text-gray-900">
                  {getTranscriptionForTime(selectedTimeblock, 'live')?.aggregatedText || 'No live transcription'}
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  {Math.round((getTranscriptionForTime(selectedTimeblock, 'live')?.avgConfidence || 0) * 100)}% confidence
                </div>
              </div>
              
              {/* Whisper version */}
              <div className="border rounded-lg p-3">
                <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center space-x-2">
                  <span>🤖</span>
                  <span>Whisper Enhanced</span>
                </h4>
                <div className="text-sm text-gray-900 font-medium">
                  {getTranscriptionForTime(selectedTimeblock, 'whisper')?.aggregatedText || 'No Whisper transcription yet'}
                </div>
                <div className="text-xs text-green-600 mt-2">
                  {Math.round((getTranscriptionForTime(selectedTimeblock, 'whisper')?.avgConfidence || 0) * 100)}% confidence
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineTranscription;