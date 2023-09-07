// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import { type Message } from "..";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function ask(question: string, history: Message[]) {
  const res = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "Du är en expert som svarar på skattefrågor.",
      },
      ...history,
      {
        role: "user",
        content: question,
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
