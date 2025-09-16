// FILE: src/worker.ts
import "dotenv/config";
import "./queues/processors/plannerProcessor";
import "./queues/processors/codegenProcessor";
import "./queues/processors/frontendProcessor";
import "./queues/processors/framerProcessor";
import "./queues/processors/contentProcessor";
import "./queues/processors/publishProcessor";

console.log("Agent workers ready.");
