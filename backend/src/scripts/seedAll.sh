#!/bin/bash
# Script to run all seed scripts in sequence

echo "Beginning database seeding process..."

# Run the doctor seed script
echo "Seeding doctors database..."
npx ts-node src/scripts/seed.ts

# Check if the previous command was successful
if [ $? -ne 0 ]; then
  echo "Error seeding doctors data. Aborting."
  exit 1
fi

# Run the patient seed script
echo "Seeding patients database..."
npx ts-node src/scripts/seedPatients.ts

# Check if the previous command was successful
if [ $? -ne 0 ]; then
  echo "Error seeding patients data. Aborting."
  exit 1
fi

# Run the operation history seed script
echo "Seeding operation history database..."
npx ts-node src/scripts/seedOpHistory.ts

# Check if the previous command was successful
if [ $? -ne 0 ]; then
  echo "Error seeding operation history data. Aborting."
  exit 1
fi

echo "Database seeding completed successfully!"