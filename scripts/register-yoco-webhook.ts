/* Registers https://APP_URL/api/webhooks/yoco with Yoco and prints the signing secret.
 * Run once per environment:  npm run yoco:webhook
 * Then put the printed secret in YOCO_WEBHOOK_SECRET. */
import { registerYocoWebhook } from "../src/lib/payments/yoco";

async function main() {
  const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
  if (!appUrl.startsWith("https://")) {
    throw new Error("APP_URL must be your public https:// URL (Yoco can't reach localhost — use a tunnel such as ngrok for testing).");
  }
  const result = await registerYocoWebhook(`${appUrl}/api/webhooks/yoco`);
  console.log("Webhook registered:", result.id);
  console.log("\nAdd this to your environment:\n");
  console.log(`YOCO_WEBHOOK_SECRET="${result.secret}"\n`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
