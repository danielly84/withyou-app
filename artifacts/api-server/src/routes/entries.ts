import { Router, type IRouter } from "express";
import { db, entriesTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { CreateEntryBody, DeleteEntryParams } from "@workspace/api-zod";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CRISIS_KEYWORDS = [
  "kill myself",
  "suicide",
  "suicidal",
  "end my life",
  "want to die",
  "self-harm",
  "self harm",
  "hurt myself",
  "cutting myself",
  "overdose",
  "no reason to live",
  "better off dead",
  "don't want to be here",
  "not want to live",
];

function containsCrisisKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

const REFLECTION_SYSTEM_PROMPT = `You are a warm, grounded emotional reflection assistant. When a user shares how they are feeling, respond with a structured JSON object containing:
- "emotion": 1-2 words describing the primary emotion (e.g. "anxious", "overwhelmed", "grateful")
- "reflection": 1-2 empathetic sentences that acknowledge what the user shared without judgment
- "suggestion": One small, practical, actionable step the user can take right now

Tone rules:
- Warm and grounded
- Non-judgmental
- Not overly cheerful
- Not clinical
- Not preachy
- Concise

Always return ONLY valid JSON. No extra text. Example:
{"emotion":"anxious","reflection":"It sounds like you're carrying a lot right now, and it makes sense that your mind is racing.","suggestion":"Try placing one hand on your chest and taking three slow, deep breaths to ground yourself."}`;

async function getAIReflection(userText: string): Promise<{
  emotion: string;
  reflection: string;
  suggestion: string;
}> {
  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 400,
    messages: [
      { role: "system", content: REFLECTION_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Here is what the user wrote: "${userText}"`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";

  try {
    const parsed = JSON.parse(content);
    return {
      emotion: parsed.emotion ?? "reflective",
      reflection:
        parsed.reflection ??
        "Thank you for sharing. Your feelings are valid.",
      suggestion:
        parsed.suggestion ??
        "Take a moment to breathe and be gentle with yourself.",
    };
  } catch {
    return {
      emotion: "reflective",
      reflection: "Thank you for sharing. Your feelings are valid.",
      suggestion: "Take a moment to breathe and be gentle with yourself.",
    };
  }
}

router.get("/entries/insights", async (req, res) => {
  try {
    const allEntries = await db
      .select()
      .from(entriesTable)
      .orderBy(desc(entriesTable.createdAt));

    const recentEntries = allEntries.slice(0, 10);

    const emotionMap: Record<string, number> = {};
    for (const entry of allEntries) {
      const e = entry.emotion.toLowerCase();
      emotionMap[e] = (emotionMap[e] ?? 0) + 1;
    }

    const emotionCounts = Object.entries(emotionMap)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count);

    const mostCommonEmotion =
      emotionCounts.length > 0 ? emotionCounts[0]!.emotion : null;

    res.json({
      totalEntries: allEntries.length,
      mostCommonEmotion,
      emotionCounts,
      recentEntries: recentEntries.map((e) => ({
        id: e.id,
        userText: e.userText,
        emotion: e.emotion,
        reflection: e.reflection,
        suggestion: e.suggestion,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get insights");
    res.status(500).json({ message: "Failed to load insights" });
  }
});

router.get("/entries", async (req, res) => {
  try {
    const entries = await db
      .select()
      .from(entriesTable)
      .orderBy(desc(entriesTable.createdAt));

    res.json(
      entries.map((e) => ({
        id: e.id,
        userText: e.userText,
        emotion: e.emotion,
        reflection: e.reflection,
        suggestion: e.suggestion,
        createdAt: e.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to get entries");
    res.status(500).json({ message: "Failed to load entries" });
  }
});

router.post("/entries", async (req, res) => {
  const parsed = CreateEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Please write something before reflecting." });
    return;
  }

  const { userText } = parsed.data;

  if (containsCrisisKeyword(userText)) {
    const crisisEntry = await db
      .insert(entriesTable)
      .values({
        userText,
        emotion: "crisis",
        reflection:
          "What you're going through sounds very serious. You don't have to face this alone. Please reach out to someone who can help right now — call or text 988 (Suicide & Crisis Lifeline) or go to your nearest emergency room.",
        suggestion:
          "Call or text 988 to reach a trained crisis counselor, available 24/7. If you're in immediate danger, call 911.",
      })
      .returning();

    res.status(201).json({
      ...crisisEntry[0],
      createdAt: crisisEntry[0]!.createdAt.toISOString(),
    });
    return;
  }

  try {
    const { emotion, reflection, suggestion } = await getAIReflection(userText);

    const [entry] = await db
      .insert(entriesTable)
      .values({ userText, emotion, reflection, suggestion })
      .returning();

    res.status(201).json({
      ...entry,
      createdAt: entry!.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create entry");
    res.status(500).json({ message: "Something went wrong generating your reflection. Please try again." });
  }
});

router.delete("/entries/:id", async (req, res) => {
  const parsed = DeleteEntryParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid entry id" });
    return;
  }

  const { id } = parsed.data;

  const deleted = await db
    .delete(entriesTable)
    .where(eq(entriesTable.id, id))
    .returning();

  if (deleted.length === 0) {
    res.status(404).json({ message: "Entry not found" });
    return;
  }

  res.status(204).send();
});

export default router;
