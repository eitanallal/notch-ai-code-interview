import { Message } from "./message.type";

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}
