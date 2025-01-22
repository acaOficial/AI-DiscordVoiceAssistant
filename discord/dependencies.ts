import { GoogleParser } from "./utils/parser/google/googleParser";
import { AiParser } from "./utils/parser/ai/aiParser";

export const voiceParser = new AiParser('127.0.0.1', 5067);