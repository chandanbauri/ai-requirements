import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, Download, Sparkles, Brain, MessageSquare } from 'lucide-react';

type ContextClue = {
  category: string;
  keyword: string;
  context: string;
};

type Analysis = {
  projectType: string | null;
  detectedNeeds: any[];
  contextClues: ContextClue[];
  technicalTerms: string[];
  businessNeeds: any[];
};

type Requirements = {
  [key: string]: any;
  projectType?: string;
  targetUsers?: string;
  features?: string;
  timeline?: string;
  budget?: string;
  userInterface?: boolean;
  deviceFeatures?: boolean;
  hosting?: string;
  performance?: string;
  additionalDetails?: string;
};

type ProjectContext = {
  [key: string]: any;
  projectType?: string;
  technicalTerms?: string[];
  contextClues?: ContextClue[];
};

type Message = {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: Analysis;
};

type ProjectTypeKey = 'web application' | 'mobile application' | 'api/microservice' | 'data/analytics';

type SessionPhase = 'introduction' | 'discovery' | 'clarification' | 'summary';

const AIRequirementsGatherer = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [requirements, setRequirements] = useState<Requirements>({
    projectType: ''
  });
  const [projectContext, setProjectContext] = useState<ProjectContext>({
    projectType: ''
  });
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>('introduction');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // AI Knowledge Base and Logic
  const aiKnowledge = {
    projectTypes: {
      'web application': {
        keywords: ['website', 'web app', 'portal', 'dashboard', 'cms', 'e-commerce', 'saas'],
        criticalAreas: ['frontend', 'backend', 'database', 'authentication', 'hosting', 'security'],
        commonFeatures: ['user management', 'responsive design', 'api integration', 'payment processing']
      },
      'mobile application': {
        keywords: ['mobile app', 'ios', 'android', 'smartphone', 'tablet', 'native', 'hybrid'],
        criticalAreas: ['platform', 'ui/ux', 'offline capability', 'device features', 'app store'],
        commonFeatures: ['push notifications', 'camera integration', 'gps', 'social login']
      },
      'api/microservice': {
        keywords: ['api', 'rest', 'graphql', 'microservice', 'backend', 'integration'],
        criticalAreas: ['endpoints', 'authentication', 'rate limiting', 'documentation', 'versioning'],
        commonFeatures: ['crud operations', 'data validation', 'error handling', 'logging']
      },
      'data/analytics': {
        keywords: ['data', 'analytics', 'ml', 'ai', 'dashboard', 'reporting', 'etl'],
        criticalAreas: ['data sources', 'processing', 'visualization', 'storage', 'real-time'],
        commonFeatures: ['data ingestion', 'transformation', 'visualization', 'alerts']
      }
    } as Record<ProjectTypeKey, {
      keywords: string[];
      criticalAreas: string[];
      commonFeatures: string[];
    }>,

    contextClues: {
      urgency: ['asap', 'urgent', 'deadline', 'launch date', 'time-sensitive'],
      budget: ['budget', 'cost', 'expensive', 'cheap', 'funding', 'investment'],
      scale: ['users', 'concurrent', 'traffic', 'load', 'scalability', 'growth'],
      compliance: ['gdpr', 'hipaa', 'pci', 'compliance', 'regulation', 'security'],
      integration: ['integrate', 'connect', 'api', 'third-party', 'existing system']
    } as Record<string, string[]>
  };

  const analyzeUserInput = (input: string): Analysis => {
    const lowercaseInput = input.toLowerCase();
    const analysis: Analysis = {
      projectType: null,
      detectedNeeds: [],
      contextClues: [],
      technicalTerms: [],
      businessNeeds: []
    };

    // Detect project type
    Object.entries(aiKnowledge.projectTypes).forEach(([type, data]) => {
      if (data.keywords.some(keyword => lowercaseInput.includes(keyword))) {
        analysis.projectType = type;
      }
    });

    // Detect context clues
    Object.entries(aiKnowledge.contextClues).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (lowercaseInput.includes(keyword)) {
          analysis.contextClues.push({ category, keyword, context: extractContext(input, keyword) });
        }
      });
    });

    // Extract technical terms
    const techTerms = ['database', 'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'react', 'node.js', 'python', 'java'];
    techTerms.forEach(term => {
      if (lowercaseInput.includes(term)) {
        analysis.technicalTerms.push(term);
      }
    });

    return analysis;
  };

  const extractContext = (text: string, keyword: string): string => {
    const sentences = text.split(/[.!?]+/);
    return sentences.find(sentence => sentence.toLowerCase().includes(keyword)) || '';
  };

  const generateAIResponse = async (userInput: string): Promise<string> => {
    setIsTyping(true);

    const analysis = analyzeUserInput(userInput);
    const updatedContext = { ...projectContext, ...analysis };
    if (analysis.projectType && !projectContext.projectType) {
      updatedContext.projectType = analysis.projectType;
    }

    try {
      const response = await fetch('http://localhost:3001/api/generate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userInput,
          projectContext: updatedContext,
          sessionPhase,
          requirements,
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();

      // Update requirements and context based on the conversation
      const updatedRequirements = extractRequirementsFromInput(userInput, analysis, requirements);
      setRequirements(updatedRequirements);
      setProjectContext(updatedContext as any);

      // Advance session phase
      if (sessionPhase === 'introduction' && updatedContext.projectType) {
        setSessionPhase('discovery');
      } else if (sessionPhase === 'discovery' && Object.keys(updatedRequirements).length > 5) {
        setSessionPhase('clarification');
      }

      return data.response;
    } catch (error) {
      console.error("Error calling AI API:", error);
      return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
    } finally {
      setIsTyping(false);
    }
  };

  const getProjectTypeInsight = (projectType: ProjectTypeKey): string => {
    const insights: Record<ProjectTypeKey, string> = {
      'web application': "Web applications are fantastic for reaching users across different devices and platforms. ",
      'mobile application': "Mobile apps offer great user engagement and can leverage device-specific features. ",
      'api/microservice': "APIs are the backbone of modern software architecture, enabling seamless integrations. ",
      'data/analytics': "Data-driven solutions can provide incredible business insights and competitive advantages. "
    };
    return insights[projectType] || "This sounds like an interesting project! ";
  };

  const getInitialQuestions = (projectType: ProjectTypeKey): string[] => {
    const questions: Record<ProjectTypeKey, string[]> = {
      'web application': [
        "What's the main purpose or problem your web application will solve?",
        "Who are your target users?",
        "Do you need user authentication and accounts?"
      ],
      'mobile application': [
        "Which platforms do you want to target (iOS, Android, or both)?",
        "What's the core functionality users will use most?",
        "Do you need the app to work offline?"
      ],
      'api/microservice': [
        "What data or functionality will your API provide?",
        "Who will be consuming this API (internal teams, external developers, etc.)?",
        "What's your expected traffic volume?"
      ],
      'data/analytics': [
        "What data sources will you be working with?",
        "What insights are you hoping to extract?",
        "Who will be viewing these analytics?"
      ]
    };
    return questions[projectType] || [
      "What's the main goal of your project?",
      "Who will be using this system?",
      "What's your timeline looking like?"
    ];
  };

  /*@ts-ignore */
  const generateDiscoveryResponse = (input: string, analysis: Analysis, context: ProjectContext): string => {
    const responses = [
      "That's really helpful context! I'm getting a clearer picture of what you need.",
      "Interesting! That gives me some good insights into your requirements.",
      "Perfect! I can see how that fits into your overall vision.",
      "Great information! This helps me understand your priorities better."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateIntelligentFollowUps = (analysis: Analysis, context: ProjectContext): string[] => {
    const followUps: string[] = [];

    // Context-based follow-ups
    if (analysis.contextClues.some(c => c.category === 'urgency')) {
      followUps.push("Given your timeline, what features are absolutely essential for the initial launch?");
    }

    if (analysis.contextClues.some(c => c.category === 'scale')) {
      followUps.push("What's your expected user growth over the first year?");
    }

    if (analysis.technicalTerms.length > 0) {
      followUps.push(`I noticed you mentioned ${analysis.technicalTerms[0]}. Are there specific technical constraints or preferences I should know about?`);
    }

    // Project-type specific follow-ups
    if (context.projectType === 'web application' && !requirements.userInterface) {
      followUps.push("Do you have any specific design or user interface requirements?");
    }

    if (context.projectType === 'mobile application' && !requirements.deviceFeatures) {
      followUps.push("Will you need access to device features like camera, GPS, or push notifications?");
    }

    return followUps.slice(0, 2); // Limit to 2 follow-ups to avoid overwhelming
  };

  /*@ts-ignore */
  const generateClarificationResponse = (input: string, analysis: Analysis, context: ProjectContext): string => {
    return "Thanks for clarifying that! It really helps me understand your specific needs better.";
  };

  const generateClarificationQuestions = (requirements: Requirements): string[] => {
    const questions: string[] = [];

    if (requirements.projectType === 'web application') {
      if (!requirements.hosting) questions.push("Do you have preferences for hosting (cloud provider, on-premise, etc.)?");
      if (!requirements.performance) questions.push("Are there specific performance requirements (page load times, concurrent users)?");
    }

    if (!requirements.budget) questions.push("What's your budget range for this project?");
    if (!requirements.timeline) questions.push("What's your ideal timeline for completion?");

    return questions.slice(0, 2);
  };

  /*@ts-ignore */
  const extractRequirementsFromInput = (input: string, analysis: Analysis, currentReqs: Requirements): Requirements => {
    const newReqs = { ...currentReqs };

    // Extract specific requirements from natural language
    if (input.toLowerCase().includes('user') || input.toLowerCase().includes('customer')) {
      newReqs.targetUsers = input;
    }

    if (input.toLowerCase().includes('feature') || input.toLowerCase().includes('function')) {
      newReqs.features = (newReqs.features || '') + ' ' + input;
    }

    // Extract timeline information
    const timelineWords = ['week', 'month', 'year', 'deadline', 'launch'];
    if (timelineWords.some(word => input.toLowerCase().includes(word))) {
      newReqs.timeline = input;
    }

    // Extract budget information
    if (input.includes('$') || input.toLowerCase().includes('budget') || input.toLowerCase().includes('cost')) {
      newReqs.budget = input;
    }

    return newReqs;
  };

  /*@ts-ignore */
  const refineRequirements = (input: string, analysis: Analysis, currentReqs: Requirements): Requirements => {
    // Refine and add details to existing requirements
    return { ...currentReqs, additionalDetails: (currentReqs.additionalDetails || '') + ' ' + input };
  };

  const generateContextualInsights = (contextClues: ContextClue[], _: ProjectContext): string => {
    let insights = "💡 **AI Insights:** ";

    if (contextClues.some(c => c.category === 'compliance')) {
      insights += "I notice compliance is important to you. We'll need to ensure proper data handling and security measures are in place. ";
    }

    if (contextClues.some(c => c.category === 'integration')) {
      insights += "Integration capabilities will be crucial for your project. We should discuss API requirements and data flow. ";
    }

    if (contextClues.some(c => c.category === 'scale')) {
      insights += "Scalability seems to be a key concern. We should plan for architecture that can grow with your needs. ";
    }

    return insights;
  };

  const generateRequirementsDocument = (): string => {
    const projectName = projectContext.projectType || 'Software Project';

    let doc = `# ${projectName.charAt(0).toUpperCase() + projectName.slice(1)} Requirements Document\n\n`;
    doc += `**Generated by AI Requirements Assistant**\n`;
    doc += `**Date:** ${new Date().toLocaleDateString()}\n\n`;

    doc += `## Executive Summary\n`;
    doc += `This document outlines the requirements for a ${projectContext.projectType} based on intelligent analysis of stakeholder conversations.\n\n`;

    if (Object.keys(requirements).length > 0) {
      doc += `## Gathered Requirements\n\n`;

      Object.entries(requirements).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          doc += `### ${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}\n`;
          doc += `${value.trim()}\n\n`;
        }
      });
    }

    if (projectContext.technicalTerms && projectContext.technicalTerms.length > 0) {
      doc += `## Technical Considerations\n`;
      doc += `Mentioned technologies: ${projectContext.technicalTerms.join(', ')}\n\n`;
    }

    doc += `## AI Analysis Summary\n`;
    doc += `- **Project Type Detected:** ${projectContext.projectType || 'Not determined'}\n`;
    doc += `- **Key Context Clues:** ${projectContext.contextClues ? projectContext.contextClues.map(c => c.category).join(', ') : 'None detected'}\n`;
    doc += `- **Conversation Phase:** ${sessionPhase}\n\n`;

    doc += `## Next Steps\n`;
    doc += `1. Review and validate the gathered requirements\n`;
    doc += `2. Prioritize features based on business value\n`;
    doc += `3. Create detailed technical specifications\n`;
    doc += `4. Develop project timeline and resource allocation\n`;

    return doc;
  };

  const downloadDocument = () => {
    const doc = generateRequirementsDocument();
    const blob = new Blob([doc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-generated-requirements-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = { type: 'user', content: inputMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = inputMessage;
    setInputMessage('');

    try {
      const aiResponse = await generateAIResponse(currentInput, projectContext);
      const assistantMessage: Message = {
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        analysis: analyzeUserInput(currentInput)
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        type: 'assistant',
        content: "I apologize, but I encountered an error processing your message. Could you please try rephrasing your question?",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial AI greeting
    const initialMessage: Message = {
      type: 'assistant',
      content: `Hello! I'm your AI Requirements Gathering Assistant. 🤖\n\nI use advanced natural language processing to understand your project needs and ask intelligent follow-up questions. Unlike traditional forms, I can:\n\n• **Understand context** from your natural conversation\n• **Ask smart follow-ups** based on what you tell me\n• **Detect project type** automatically\n• **Identify technical needs** from your descriptions\n• **Generate comprehensive documentation**\n\nLet's start! Tell me about the project you're planning to build. Don't worry about being too structured - just describe it naturally, and I'll ask the right questions to gather all the details we need.`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, []);

  return (
    <div className="mx-auto p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 min-h-screen">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="relative">
            <Brain className="text-purple-600" size={40} />
            <Sparkles className="absolute -top-1 -right-1 text-yellow-500" size={16} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Requirements Assistant
          </h1>
        </div>
        <p className="text-lg text-gray-600">Intelligent conversation-based requirements gathering</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-xl">
              <div className="flex items-center space-x-3">
                <Bot size={24} />
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-sm opacity-90">Phase: {sessionPhase}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-purple-500 text-white'
                      }`}>
                      {message.type === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`rounded-lg p-4 ${message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      {message.analysis && (
                        <div className="mt-2 pt-2 border-t border-gray-300 text-xs opacity-70">
                          AI detected: {message.analysis.projectType || 'analyzing...'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center">
                      <Bot size={16} />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Describe your project naturally..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Project Context */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-purple-500">
              <MessageSquare className="mr-2 text-purple-500" size={20} />
              Project Context
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <p className="text-sm text-gray-600">{projectContext.projectType || 'Not detected yet'}</p>
              </div>

              <div>
                <span className="text-sm font-medium text-gray-600">Phase:</span>
                <p className="text-sm capitalize text-gray-600">{sessionPhase}</p>
              </div>

              {projectContext.technicalTerms && projectContext.technicalTerms.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Tech Mentioned:</span>
                  <p className="text-sm text-gray-600">{projectContext.technicalTerms.join(', ')}</p>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-600">Requirements Gathered:</span>
                <p className="text-sm text-gray-600">{Object.keys(requirements).length} items</p>
              </div>
            </div>
          </div>

          {/* AI Capabilities */}
          <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="mr-2 text-yellow-500" size={20} />
              AI Capabilities
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Natural language understanding</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Context-aware questioning</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Project type detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Smart follow-up generation</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Requirements extraction</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-blue-500">
              <FileText className="mr-2 text-blue-500" size={20} />
              Document
            </h3>

            <button
              onClick={downloadDocument}
              disabled={Object.keys(requirements).length === 0}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Download size={16} />
              <span>Generate Requirements Doc</span>
            </button>

            <p className="text-xs text-gray-500 mt-2 text-center">
              AI-powered document generation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRequirementsGatherer;
