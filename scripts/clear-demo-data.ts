/* Removes the demo customers, reviews, orders and subscribers created by the seed.
 * Run before launch:  npm run db:clear-demo
 * The catalogue, journal, discount codes, settings and admin account are kept. */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const DEMO_DOMAIN = "@example.co.za";

async function main() {
  const demoUsers = await db.user.findMany({ where: { email: { endsWith: DEMO_DOMAIN }, role: "CUSTOMER" }, select: { id: true } });
  const ids = demoUsers.map((u) => u.id);

  const reviews = await db.review.deleteMany({ where: { userId: { in: ids } } });
  const orders = await db.order.deleteMany({ where: { notes: { startsWith: "Demo order" } } });
  const subscribers = await db.subscriber.deleteMany({ where: { email: { endsWith: DEMO_DOMAIN } } });
  const users = await db.user.deleteMany({ where: { id: { in: ids } } });

  console.log(`Removed ${orders.count} demo orders, ${reviews.count} reviews, ${users.count} customers, ${subscribers.count} subscribers.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
