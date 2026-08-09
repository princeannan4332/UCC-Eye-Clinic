import { ConfanaClient } from "@dexel-confana/confana-dev";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.CONFANA_API_KEY || "cnf_live_64524b6e537b65b58f08d2958b2f7540ca3fe18d3c8e4066";
const baseUrl = process.env.CONFANA_BASE_URL || "http://localhost:8080";
const engineUrl = process.env.CONFANA_ENGINE_URL || "http://127.0.0.1:8001";

export const confanaClient = new ConfanaClient({
  api_key: apiKey,
  base_url: baseUrl,
  engine_url: engineUrl,
});
