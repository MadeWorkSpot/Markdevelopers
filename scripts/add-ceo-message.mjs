import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = join(__dirname, "..", ".env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  let value = trimmed.slice(eqIdx + 1);
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase credentials. Check .env");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const db = getFirestore(app);

const ceoMessage = {
  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
  alt: "Rajesh Kumar - Founder & CEO of Mark Developers",
  name: "Rajesh Kumar",
  title: "Founder & CEO",
  message:
    "At Mark Developers, we don't just build structures — we build trust. Every project we undertake is a promise to our clients that quality, transparency, and commitment will never be compromised. Our journey has been one of relentless dedication to transforming visions into reality, and I am proud of every milestone we've achieved together.",
};

await db.collection("content").doc("about").set(
  { ceoMessage },
  { merge: true }
);

console.log("CEO message added to about document.");
process.exit(0);
