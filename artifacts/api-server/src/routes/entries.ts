import { Router, type IRouter } from "express";
import { db, entriesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { CreateEntryBody, DeleteEntryParams, GetReflectQuestionBody } from "@workspace/api-zod";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CRISIS_KEYWORDS = [
  "kill myself", "suicide", "suicidal", "end my life", "want to die",
  "self-harm", "self harm", "hurt myself", "cutting myself", "overdose",
  "no reason to live", "better off dead", "don't want to be here", "not want to live",
];

function containsCrisisKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function parseJSON<T>(content: string, fallback: T): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

// Prompt: listen mode — single supportive response
const LISTEN_PROMPT = `You are a warm, grounded emotional reflection assistant. When a user shares how they are feeling, respond with a JSON object:
- "emotion": 1-2 words describing the primary emotion
- "reflection": 1-2 empathetic sentences acknowledging what the user shared, without judgment
- "suggestion": one small, practical, actionable next step

Tone: warm, grounded, non-judgmental, not overly cheerful, not clinical, not preachy, concise.
Return ONLY valid JSON. Example:
{"emotion":"anxious","reflection":"It sounds like you're carrying a lot right now, and it makes sense that your mind is racing.","suggestion":"Try placing one hand on your chest and taking three slow, deep breaths to ground yourself."}`;

// Prompt: reflect mode — first turn, returns short reflection + one follow-up question
const REFLECT_INITIAL_PROMPT = `You are a warm, grounded emotional reflection assistant. When a user shares how they are feeling, help them go deeper by responding with a JSON object:
- "reflection": 1-2 short empathetic sentences acknowledging what the user shared
- "question": one thoughtful, open-ended follow-up question that helps the user understand themselves better — not prying, just gently curious

Tone: warm, grounded, curious, non-clinical, concise.
Return ONLY valid JSON. Example:
{"reflection":"It sounds like this has been weighing on you for a while.","question":"What part of this feels hardest to sit with right now?"}`;

// Prompt: reflect mode — second turn, returns final structured response
const REFLECT_FOLLOWUP_PROMPT = `You are a warm, grounded emotional reflection assistant. The user has shared their feelings and then answered a follow-up question. Based on both responses, return a JSON object:
- "emotion": 1-2 words describing the primary emotion
- "reflection": 1-2 empathetic sentences acknowledging what the user shared across both messages
- "insight": one sentence naming a pattern, belief, or realization that emerged from the conversation
- "suggestion": one small, practical, actionable next step

Tone: warm, grounded, insightful, non-clinical, concise.
Return ONLY valid JSON. Example:
{"emotion":"overwhelmed","reflection":"You've been carrying a lot, and it makes sense that you needed space to process it.","insight":"It seems like a part of you knows what you need but feels unsure if you deserve to ask for it.","suggestion":"Write down one small thing you can do today just for yourself, no justification needed."}`;

async function callAI(systemPrompt: string, userContent: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });
  return completion.choices[0]?.message?.content ?? "{}";
}

function serializeEntry(e: typeof entriesTable.$inferSelect) {
  return {
    id: e.id,
    userText: e.userText,
    emotion: e.emotion,
    reflection: e.reflection,
    insight: e.insight ?? null,
    suggestion: e.suggestion,
    createdAt: e.createdAt.toISOString(),
  };
}

// GET /entries/insights — must be before /entries/:id
router.get("/entries/insights", async (req, res) => {
  try {
    const allEntries = await db.select().from(entriesTable).orderBy(desc(entriesTable.createdAt));
    const recentEntries = allEntries.slice(0, 10);

    const emotionMap: Record<string, number> = {};
    for (const entry of allEntries) {
      const e = entry.emotion.toLowerCase();
      emotionMap[e] = (emotionMap[e] ?? 0) + 1;
    }

    const emotionCounts = Object.entries(emotionMap)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      totalEntries: allEntries.length,
      mostCommonEmotion: emotionCounts[0]?.emotion ?? null,
      emotionCounts,
      recentEntries: recentEntries.map(serializeEntry),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get insights");
    res.status(500).json({ message: "Failed to load insights" });
  }
});

// POST /entries/question — reflect mode first turn, not saved to DB
router.post("/entries/question", async (req, res) => {
  const parsed = GetReflectQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please write something before reflecting." });
    return;
  }

  const { userText } = parsed.data;

  if (containsCrisisKeyword(userText)) {
    res.json({
      reflection: "What you're going through sounds very serious. You don't have to face this alone.",
      question: "Are you safe right now? If you're in immediate danger, please call 988 or emergency services.",
    });
    return;
  }

  try {
    const content = await callAI(REFLECT_INITIAL_PROMPT, `The user wrote: "${userText}"`);
    const parsed = parseJSON<{ reflection?: string; question?: string }>(content, {});
    res.json({
      reflection: parsed.reflection ?? "Thank you for sharing that.",
      question: parsed.question ?? "What feels most important for you to express right now?",
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get reflect question");
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

// GET /entries
router.get("/entries", async (req, res) => {
  try {
    const entries = await db.select().from(entriesTable).orderBy(desc(entriesTable.createdAt));
    res.json(entries.map(serializeEntry));
  } catch (err) {
    req.log.error({ err }, "Failed to get entries");
    res.status(500).json({ message: "Failed to load entries" });
  }
});

// POST /entries — save final entry (listen or reflect followup)
router.post("/entries", async (req, res) => {
  const parsed = CreateEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please write something before reflecting." });
    return;
  }

  const { userText, mode, followupText } = parsed.data;
  const fullText = followupText ? `${userText}\n\nFollow-up: ${followupText}` : userText;

  // Crisis check on any user text
  if (containsCrisisKeyword(userText) || (followupText && containsCrisisKeyword(followupText))) {
    const [crisisEntry] = await db
      .insert(entriesTable)
      .values({
        userText: fullText,
        emotion: "crisis",
        reflection: "What you're going through sounds very serious. You don't have to face this alone. Please reach out to someone who can help right now — call or text 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.",
        insight: null,
        suggestion: "Call or text 988 to reach a trained crisis counselor, available 24/7. If you're in immediate danger, call 911.",
      })
      .returning();

    res.status(201).json(serializeEntry(crisisEntry!));
    return;
  }

  try {
    let emotion: string;
    let reflection: string;
    let insight: string | null = null;
    let suggestion: string;

    if (mode === "reflect" && followupText) {
      // Two-turn reflect — final response
      const userContent = `First message: "${userText}"\n\nFollow-up answer: "${followupText}"`;
      const content = await callAI(REFLECT_FOLLOWUP_PROMPT, userContent);
      const data = parseJSON<{ emotion?: string; reflection?: string; insight?: string; suggestion?: string }>(content, {});
      emotion = data.emotion ?? "reflective";
      reflection = data.reflection ?? "Thank you for sharing. Your feelings are valid.";
      insight = data.insight ?? null;
      suggestion = data.suggestion ?? "Take a moment to breathe and be gentle with yourself.";
    } else {
      // Listen mode — single response
      const content = await callAI(LISTEN_PROMPT, `The user wrote: "${userText}"`);
      const data = parseJSON<{ emotion?: string; reflection?: string; suggestion?: string }>(content, {});
      emotion = data.emotion ?? "reflective";
      reflection = data.reflection ?? "Thank you for sharing. Your feelings are valid.";
      suggestion = data.suggestion ?? "Take a moment to breathe and be gentle with yourself.";
    }

    const [entry] = await db
      .insert(entriesTable)
      .values({ userText: fullText, emotion, reflection, insight, suggestion })
      .returning();

    res.status(201).json(serializeEntry(entry!));
  } catch (err) {
    req.log.error({ err }, "Failed to create entry");
    res.status(500).json({ message: "Something went wrong generating your reflection. Please try again." });
  }
});

// DELETE /entries/:id
router.delete("/entries/:id", async (req, res) => {
  const parsed = DeleteEntryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid entry id" });
    return;
  }

  const deleted = await db.delete(entriesTable).where(eq(entriesTable.id, parsed.data.id)).returning();

  if (deleted.length === 0) {
    res.status(404).json({ message: "Entry not found" });
    return;
  }

  res.status(204).send();
});

export default router;
