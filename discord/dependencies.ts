import { GoogleParser } from "./utils/parser/google/googleParser";
import { AiParser } from "./utils/parser/ai/aiParser";

export const voiceParser = new AiParser('localhost', 5067);