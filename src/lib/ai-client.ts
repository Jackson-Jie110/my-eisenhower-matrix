import type { QuadrantId, Task } from "../types";

type AnalyzeResult = {
  id: string;
  quadrantId: QuadrantId;
};

type AnalyzeResponse = {
  results: AnalyzeResult[];
};

const quadrantPool: QuadrantId[] = ["q1", "q2", "q3", "q4"];

const normalizeJson = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("```")) {
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return trimmed;
};

export async function analyzeTasks(
  tasks: Task[],
  apiKey?: string
): Promise<AnalyzeResponse> {
  if (tasks.length === 0) {
    return { results: [] };
  }

  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return {
      results: tasks.map((task) => ({
        id: task.id,
        quadrantId:
          quadrantPool[Math.floor(Math.random() * quadrantPool.length)],
      })),
    };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are an Eisenhower Matrix expert. Classify tasks into q1(Urgent+Important), q2(Important+Not Urgent), q3(Urgent+Not Important), q4(Not Urgent+Not Important). Return purely JSON format: { \"results\": [{ \"id\": \"task_id\", \"quadrantId\": \"q1\" }] }.",
        },
        {
          role: "user",
          content: JSON.stringify(
            tasks.map((task) => ({
              id: task.id,
              title: task.title,
              context: task.context,
            }))
          ),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data?.choices?.[0]?.message?.content ?? "";
  const jsonText = normalizeJson(content);

  if (!jsonText) {
    throw new Error("OpenAI response missing JSON content.");
  }

  return JSON.parse(jsonText) as AnalyzeResponse;
}
