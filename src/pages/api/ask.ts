// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import dedent from "dedent";
import type { NextApiRequest, NextApiResponse } from "next";
import { type Message } from "..";
import { openai } from "../../services/openai";
import { COLLECTION_NAME, qdrant } from "../../services/qdrant";

async function ask(question: string, history: Message[]) {
  const questionVector = await openai.embeddings.create({
    input: [question],
    model: "text-embedding-ada-002",
  });

  const documents = await qdrant.search(COLLECTION_NAME, {
    vector: questionVector.data[0].embedding,
    limit: 4,
  });

  const res = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "Du är en expert som svarar på skattefrågor.",
      },
      ...history,
      {
        role: "user",
        content: dedent`
          Använd följande information för att svara på frågan:
          
          ${documents
            .map(
              (document) => dedent`
                ---
                ${document.payload!.title}

                ${document.payload!.content}
                ---
              `
            )
            .join("\n")}

          Fråga: "${question}"
        `,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  return res.choices[0].message;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Message>
) {
  const { question } = req.body;
  const answer = await ask(question, []);

  if (!answer.content) {
    throw new Error("No answer from OpenAI");
  }

  res.json({
    content: answer.content,
    role: "assistant",
  });
}
