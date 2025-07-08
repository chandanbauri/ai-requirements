import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// IMPORTANT: Replace with your actual API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate-response', async (req, res) => {
  try {
    const { userInput, projectContext, sessionPhase, requirements } = req.body;

    // --- This is where the magic happens! --- //
    // We'll use the Gemini API to generate a more intelligent response.

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an AI assistant specialized in efficiently gathering software project requirements from **non-technical users**.
      Your primary goal is to have a simple, friendly conversation to understand their needs
      and generate a requirements document. You must avoid all technical jargon.

      **CRITICAL INSTRUCTIONS:**
      1.  **Speak Plain English:** Do NOT use technical terms like 'database', 'API', 'frontend', 'backend', etc. Instead of asking about the 'database', ask "Where will the information be stored?". Instead of asking about 'user authentication', ask "How will people sign in?".
      2.  **Focus on Goals, Not Implementation:** Ask about *what* the user wants to achieve, not *how* it should be built. Focus on business logic and user experience.
      3.  **Be Directive and Efficient:** Guide the conversation to gather all necessary requirements. Ask targeted, simple questions. Aim to summarize and confirm requirements after 3-5 exchanges.
      4.  **Avoid Repetition:** Do not ask questions that have already been answered.

      Current Conversation Phase: ${sessionPhase}
      User's Latest Message: "${userInput}"
      Current Project Context: ${JSON.stringify(projectContext, null, 2)}
      Already Gathered Requirements: ${JSON.stringify(requirements, null, 2)}

      Based on this information, generate a response that is:
      1.  **Simple and Clear:** Easy for a non-technical person to understand.
      2.  **Goal-Oriented:** Asks a targeted question about the user's objectives.
      3.  **Helpful:** Provides simple suggestions to help the user think through their needs.
      4.  **Natural:** Maintain a friendly and professional tone.

      Your response should be a single string to display to the user.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });

  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
