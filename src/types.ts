export type Chunk = {
  id: string;
  title: string;
  url: string;
  content: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Document = Chunk;
