import { Inter } from "next/font/google";
import { useReducer, useRef } from "react";
import { useMutation } from "react-query";
import { Document, Message } from "../types";

const inter = Inter({ subsets: ["latin"] });

type Conversation = {
  history: {
    message: Message;
    documents?: Document[];
  }[];
};

type Action =
  | {
      type: "addUserMessage";
      payload: Message;
    }
  | {
      type: "addAssistantMessage";
      payload: {
        message: Message;
        documents: Document[];
      };
    };

const conversationReducer = (
  state: Conversation,
  action: Action
): Conversation => {
  switch (action.type) {
    case "addUserMessage":
      return {
        ...state,
        history: [...state.history, { message: action.payload }],
      };
    case "addAssistantMessage":
      return {
        ...state,
        history: [
          ...state.history,
          {
            message: action.payload.message,
            documents: action.payload.documents,
          },
        ],
      };
    default:
      return state;
  }
};

export default function Home() {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, dispatch] = useReducer(conversationReducer, {
    history: [],
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
          type: "addUserMessage",
          payload: { role: "user", content: question },
        });
      },
      onSuccess(data) {
        dispatch({ type: "addAssistantMessage", payload: data });
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
        {state.history.map(({ message, documents }, i) => (
          <div className="flex flex-col gap-2">
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
            {documents ? (
              <ul className="flex gap-2">
                {documents.map((document) => (
                  <li className="flex-1">
                    <a
                      className="p-4 rounded bg-gray-300 block text-black"
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <strong>{document.title}</strong>
                      <p>{document.content}</p>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
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
