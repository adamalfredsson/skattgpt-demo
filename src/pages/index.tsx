import { Inter } from "next/font/google";
import { useReducer, useRef } from "react";
import { useMutation } from "react-query";

const inter = Inter({ subsets: ["latin"] });

export type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  messages: Message[];
};

type Action = {
  type: "addMessage";
  payload: Message;
};

const conversationReducer = (
  state: Conversation,
  action: Action
): Conversation => {
  switch (action.type) {
    case "addMessage":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    default:
      return state;
  }
};

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, dispatch] = useReducer(conversationReducer, {
    messages: [],
  });

  const ask = useMutation(
    async (question: string) => {
      const res = await fetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ question }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return res.json();
    },
    {
      onMutate(question) {
        dispatch({
          type: "addMessage",
          payload: { role: "user", content: question },
        });
      },
      onSuccess(data) {
        dispatch({ type: "addMessage", payload: data });
        formRef.current?.reset();
      },
    }
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const question = formData.get("question")?.toString();
    if (!question) return;
    ask.mutate(question);
  };

  return (
    <main
      className={`flex h-screen overflow-hidden flex-col justify-between ${inter.className}`}
    >
      <section className="flex-1 overflow-auto py-4 container flex flex-col gap-4">
        {state.messages.map((message, i) => (
          <div
            key={i}
            className={`p-4 rounded max-w-lg ${
              message.role === "user"
                ? "self-end bg-blue-500"
                : "self-start bg-red-500"
            }`}
          >
            {message.content}
          </div>
        ))}
      </section>
      <form
        className="container py-8 flex gap-4"
        ref={formRef}
        onSubmit={handleSubmit}
      >
        <input
          className="flex-1 p-2 rounded text-black"
          type="text"
          name="question"
          placeholder="Ställ en fråga!"
          disabled={ask.isLoading}
        />
        <button type="submit">Skicka</button>
      </form>
    </main>
  );
}
