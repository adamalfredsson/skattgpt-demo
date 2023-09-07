// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { type Message } from "..";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Message>
) {
  const { question } = req.body;

  res.json({
    content: "Hi there!" + question,
    role: "assistant",
  });
}
