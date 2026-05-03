import { Pool } from "pg";
// lib/db.ts (lub tam, gdzie inicjalizujesz Prismę)
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Tworzymy klienta z użyciem adaptera - to całkowicie omija serwery Prismy i ich limity
export const db = new PrismaClient({ adapter });
