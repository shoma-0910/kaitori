import { db } from "./db";
import { stores } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  const initialStores = [
    {
      name: "関西スーパー淀川店",
      address: "大阪府大阪市淀川区西中島3-12-15",
      population: 45000,
      averageAge: 42,
      averageIncome: 520,
      averageRent: 8.5,
      potentialScore: 92,
    },
    {
      name: "ライフ豊中店",
      address: "大阪府豊中市本町1-10-1",
      population: 38000,
      averageAge: 45,
      averageIncome: 480,
      averageRent: 7.8,
      potentialScore: 85,
    },
    {
      name: "イオン千里店",
      address: "大阪府吹田市千里中央1-1",
      population: 52000,
      averageAge: 40,
      averageIncome: 580,
      averageRent: 9.2,
      potentialScore: 88,
    },
    {
      name: "マルヤス吹田店",
      address: "大阪府吹田市江坂町1-23-5",
      population: 32000,
      averageAge: 48,
      averageIncome: 450,
      averageRent: 7.2,
      potentialScore: 78,
    },
    {
      name: "コーヨー高槻店",
      address: "大阪府高槻市芥川町1-2-10",
      population: 41000,
      averageAge: 43,
      averageIncome: 500,
      averageRent: 8.0,
      potentialScore: 82,
    },
  ];

  for (const store of initialStores) {
    await db.insert(stores).values(store).onConflictDoNothing();
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
