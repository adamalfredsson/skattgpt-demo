// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import dedent from "dedent";
import type { NextApiRequest, NextApiResponse } from "next";
import { openai } from "../../services/openai";
import { COLLECTION_NAME, qdrant } from "../../services/qdrant";
import { Document, Message } from "../../types";

async function search(query: string) {
  const queryVector = await openai.embeddings.create({
    input: [query],
    model: "text-embedding-ada-002",
  });

  const documents = await qdrant.search(COLLECTION_NAME, {
    vector: queryVector.data[0].embedding,
    limit: 4,
  });

  return documents.map(
    (document) =>
      ({
        id: document.id as string,
        title: document.payload!.title,
        content: document.payload!.content,
        url: document.payload!.url,
      } as Document)
  );
}

async function ask(
  question: string,
  history: Message[],
  documents: Document[] = []
) {
  const res = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Du är en expert som svarar på skattefrågor. Du måste söka efter information från skatteverket för att svara på skattefrågor, svara annars att du inte vet.",
      },
      ...history,
      {
        role: "user",
        content: question,
      },
      ...(documents.length
        ? [
            {
              role: "function",
              name: "lookup",
              content: documents
                .map(
                  (document) => dedent`
                    ---
                    ${document.title}
                    ${document.content}
                    ---
                  `
                )
                .join("\n"),
            } as const,
          ]
        : []),
    ],
    functions: [
      {
        name: "lookup",
        description: "Sök efter information på Skatteverkets webbplats",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Sökfråga",
            },
          },
          required: ["query"],
        },
      },
    ],
    model: "gpt-3.5-turbo",
  });

  const message = res.choices[0].message;

  if (message.function_call?.name === "lookup") {
    console.log(message.function_call.arguments);
    const { query } = JSON.parse(message.function_call.arguments);
    return ask(question, history, [...documents, ...(await search(query))]);
  }

  return {
    message: res.choices[0].message,
    documents,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { question } = req.body;
  const answer = await ask(question, []);

  if (!answer.message.content) {
    throw new Error("No answer from OpenAI");
  }

  res.json({
    message: {
      content: answer.message.content,
      role: "assistant",
    },
    documents: answer.documents,
  });
}
