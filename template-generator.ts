import { faker } from "@faker-js/faker";
import type { DataColumn } from "@/types/dataset";

export function generateTemplateData(columns: DataColumn[], rowCount: number) {
  const data = [];

  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, any> = {};

    for (const column of columns) {
      row[column.name] = generateValueForColumn(column);
    }

    data.push(row);
  }

  return data;
}

function generateValueForColumn(column: DataColumn) {
  switch (column.type) {
    case "string":
      return generateStringValue(column);
    case "number":
      return generateNumberValue(column);
    case "boolean":
      return faker.datatype.boolean();
    case "date":
      return faker.date.past().toISOString().split("T")[0];
    case "email":
      return faker.internet.email();
    case "phone":
      return faker.phone.number();
    case "address":
      return faker.location.streetAddress();
    default:
      return faker.lorem.word();
  }
}

function generateStringValue(column: DataColumn) {
  const columnId = column.id.toLowerCase();
  const columnName = column.name.toLowerCase();

  // Company and business related
  if (columnId.includes("company") || columnName.includes("company")) {
    return faker.company.name();
  }
  if (columnId.includes("industry") || columnName.includes("industry")) {
    const industries = [
      "Technology",
      "Healthcare",
      "Finance",
      "Retail",
      "Manufacturing",
      "Education",
      "Real Estate",
      "Transportation",
      "Energy",
      "Media",
      "Telecommunications",
      "Automotive",
      "Aerospace",
      "Pharmaceuticals",
      "Food & Beverage",
    ];
    return faker.helpers.arrayElement(industries);
  }
  if (columnId.includes("ceo") || columnName.includes("ceo")) {
    return faker.person.fullName();
  }
  if (columnId.includes("stock") && columnId.includes("symbol")) {
    return faker.string.alpha({ length: { min: 2, max: 4 }, casing: "upper" });
  }

  // Product related
  if (columnId.includes("product") || columnName.includes("product")) {
    return faker.commerce.productName();
  }
  if (columnId.includes("category") || columnName.includes("category")) {
    return faker.commerce.department();
  }
  if (columnId.includes("order") && columnId.includes("id")) {
    return faker.string.alphanumeric(8).toUpperCase();
  }

  // People names
  if (
    columnId.includes("customer") ||
    columnId.includes("patient") ||
    columnId.includes("student")
  ) {
    return faker.person.fullName();
  }
  if (
    columnId.includes("name") &&
    !columnId.includes("company") &&
    !columnId.includes("product")
  ) {
    return faker.person.fullName();
  }
  if (
    columnId.includes("doctor") ||
    columnId.includes("instructor") ||
    columnId.includes("manager")
  ) {
    return faker.person.fullName();
  }

  // Location related
  if (columnId.includes("country") || columnName.includes("country")) {
    return faker.location.country();
  }
  if (columnId.includes("city") || columnName.includes("city")) {
    return faker.location.city();
  }
  if (columnId.includes("state") || columnName.includes("state")) {
    return faker.location.state();
  }
  if (columnId.includes("zip") || columnId.includes("postal")) {
    return faker.location.zipCode();
  }

  // Medical related
  if (columnId.includes("condition") || columnId.includes("diagnosis")) {
    const conditions = [
      "Hypertension",
      "Diabetes",
      "Asthma",
      "Arthritis",
      "Depression",
      "Anxiety",
      "Migraine",
      "Back Pain",
      "Heart Disease",
      "Obesity",
    ];
    return faker.helpers.arrayElement(conditions);
  }
  if (columnId.includes("treatment")) {
    const treatments = [
      "Medication",
      "Physical Therapy",
      "Surgery",
      "Counseling",
      "Diet Change",
      "Exercise Program",
      "Monitoring",
      "Lifestyle Modification",
    ];
    return faker.helpers.arrayElement(treatments);
  }
  if (columnId.includes("blood") && columnId.includes("type")) {
    return faker.helpers.arrayElement([
      "A+",
      "A-",
      "B+",
      "B-",
      "AB+",
      "AB-",
      "O+",
      "O-",
    ]);
  }
  if (
    columnId.includes("department") &&
    (columnId.includes("medical") || columnName.includes("medical"))
  ) {
    const departments = [
      "Cardiology",
      "Neurology",
      "Orthopedics",
      "Pediatrics",
      "Emergency",
      "Surgery",
      "Radiology",
      "Oncology",
      "Psychiatry",
      "Internal Medicine",
    ];
    return faker.helpers.arrayElement(departments);
  }

  // Education related
  if (columnId.includes("course") || columnName.includes("course")) {
    const courses = [
      "Mathematics",
      "English Literature",
      "Computer Science",
      "Biology",
      "Chemistry",
      "Physics",
      "History",
      "Psychology",
      "Economics",
      "Art",
    ];
    return faker.helpers.arrayElement(courses);
  }
  if (columnId.includes("grade") && !columnId.includes("gpa")) {
    return faker.helpers.arrayElement([
      "A",
      "A-",
      "B+",
      "B",
      "B-",
      "C+",
      "C",
      "C-",
      "D",
      "F",
    ]);
  }
  if (columnId.includes("major") || columnId.includes("subject")) {
    const majors = [
      "Computer Science",
      "Business Administration",
      "Engineering",
      "Psychology",
      "Biology",
      "English",
      "Mathematics",
      "Art",
      "History",
      "Economics",
    ];
    return faker.helpers.arrayElement(majors);
  }

  // Real Estate related
  if (columnId.includes("property") && columnId.includes("type")) {
    return faker.helpers.arrayElement([
      "House",
      "Apartment",
      "Condo",
      "Townhouse",
      "Villa",
      "Studio",
    ]);
  }

  // Marketing related
  if (columnId.includes("channel") || columnName.includes("channel")) {
    return faker.helpers.arrayElement([
      "Google Ads",
      "Facebook",
      "Instagram",
      "Email",
      "SEO",
      "Direct Mail",
      "TV",
      "Radio",
    ]);
  }
  if (columnId.includes("campaign")) {
    return faker.company.catchPhrase();
  }

  // HR related
  if (columnId.includes("position") || columnId.includes("job")) {
    return faker.person.jobTitle();
  }
  if (columnId.includes("department") && !columnId.includes("medical")) {
    const departments = [
      "Engineering",
      "Marketing",
      "Sales",
      "HR",
      "Finance",
      "Operations",
      "Customer Service",
      "IT",
      "Legal",
      "Research & Development",
    ];
    return faker.helpers.arrayElement(departments);
  }
  if (
    columnId.includes("location") &&
    (columnId.includes("office") || columnName.includes("office"))
  ) {
    return faker.location.city() + ", " + faker.location.state();
  }

  // IoT related
  if (columnId.includes("device") && columnId.includes("id")) {
    return "DEV-" + faker.string.alphanumeric(6).toUpperCase();
  }
  if (columnId.includes("status")) {
    return faker.helpers.arrayElement([
      "Active",
      "Inactive",
      "Maintenance",
      "Error",
      "Offline",
    ]);
  }
  if (columnId.includes("firmware")) {
    return faker.system.semver();
  }

  // Payment and order related
  if (columnId.includes("payment") && columnId.includes("method")) {
    return faker.helpers.arrayElement([
      "Credit Card",
      "Debit Card",
      "PayPal",
      "Bank Transfer",
      "Cash",
      "Apple Pay",
    ]);
  }
  if (columnId.includes("order") && columnId.includes("status")) {
    return faker.helpers.arrayElement([
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
      "Returned",
    ]);
  }
  if (columnId.includes("employment") && columnId.includes("status")) {
    return faker.helpers.arrayElement([
      "Full-time",
      "Part-time",
      "Contract",
      "Intern",
      "Terminated",
    ]);
  }

  // Insurance related
  if (columnId.includes("insurance")) {
    const providers = [
      "Blue Cross Blue Shield",
      "Aetna",
      "Cigna",
      "UnitedHealth",
      "Kaiser Permanente",
      "Humana",
      "Anthem",
      "Medicare",
      "Medicaid",
    ];
    return faker.helpers.arrayElement(providers);
  }

  // Generic ID fields
  if (columnId.includes("id") && !columnId.includes("idea")) {
    return faker.string.alphanumeric(8).toUpperCase();
  }

  // Fallback for any remaining string fields - use more meaningful data
  if (columnName.includes("description")) {
    return faker.lorem.sentence();
  }
  if (columnName.includes("note") || columnName.includes("comment")) {
    return faker.lorem.sentence();
  }

  // Final fallback - use a business-related word instead of lorem
  const businessWords = [
    "Premium",
    "Standard",
    "Basic",
    "Professional",
    "Enterprise",
    "Starter",
    "Advanced",
    "Pro",
    "Elite",
    "Essential",
    "Complete",
    "Ultimate",
  ];
  return faker.helpers.arrayElement(businessWords);
}

function generateNumberValue(column: DataColumn) {
  const columnId = column.id.toLowerCase();
  const columnName = column.name.toLowerCase();

  if (columnId.includes("age")) {
    return faker.number.int({ min: 18, max: 80 });
  }
  if (columnId.includes("price") || columnId.includes("cost")) {
    return Number(faker.commerce.price({ min: 10, max: 1000 }));
  }
  if (columnId.includes("revenue") || columnId.includes("sales")) {
    return faker.number.int({ min: 100000, max: 50000000 });
  }
  if (columnId.includes("market") && columnId.includes("cap")) {
    return faker.number.int({ min: 1000000, max: 1000000000 });
  }
  if (columnId.includes("employees") || columnId.includes("count")) {
    return faker.number.int({ min: 1, max: 10000 });
  }
  if (columnId.includes("year") || columnId.includes("founded")) {
    return faker.number.int({ min: 1950, max: 2023 });
  }
  if (
    columnId.includes("percent") ||
    columnId.includes("rate") ||
    columnId.includes("margin")
  ) {
    return Number(
      faker.number.float({ min: 0, max: 100, precision: 0.01 }).toFixed(2)
    );
  }
  if (columnId.includes("quantity")) {
    return faker.number.int({ min: 1, max: 100 });
  }
  if (columnId.includes("bedrooms")) {
    return faker.number.int({ min: 1, max: 6 });
  }
  if (columnId.includes("bathrooms")) {
    return faker.number.int({ min: 1, max: 4 });
  }
  if (columnId.includes("sq") || columnId.includes("footage")) {
    return faker.number.int({ min: 500, max: 5000 });
  }
  if (columnId.includes("temperature")) {
    return Number(
      faker.number.float({ min: -10, max: 40, precision: 0.1 }).toFixed(1)
    );
  }
  if (columnId.includes("humidity")) {
    return Number(
      faker.number.float({ min: 20, max: 90, precision: 0.1 }).toFixed(1)
    );
  }
  if (columnId.includes("battery")) {
    return faker.number.int({ min: 0, max: 100 });
  }
  if (columnId.includes("gpa")) {
    return Number(
      faker.number.float({ min: 2.0, max: 4.0, precision: 0.01 }).toFixed(2)
    );
  }
  if (columnId.includes("salary")) {
    return faker.number.int({ min: 30000, max: 200000 });
  }
  if (columnId.includes("performance")) {
    return Number(
      faker.number.float({ min: 1, max: 5, precision: 0.1 }).toFixed(1)
    );
  }
  if (columnId.includes("attendance")) {
    return Number(
      faker.number.float({ min: 0.7, max: 1.0, precision: 0.01 }).toFixed(2)
    );
  }
  if (columnId.includes("impressions") || columnId.includes("clicks")) {
    return faker.number.int({ min: 1000, max: 100000 });
  }
  if (columnId.includes("budget")) {
    return faker.number.int({ min: 1000, max: 100000 });
  }
  if (columnId.includes("conversions")) {
    return faker.number.int({ min: 10, max: 1000 });
  }
  if (columnId.includes("ctr")) {
    return Number(
      faker.number.float({ min: 0.5, max: 15, precision: 0.01 }).toFixed(2)
    );
  }
  if (columnId.includes("roi")) {
    return Number(
      faker.number.float({ min: -50, max: 500, precision: 0.01 }).toFixed(2)
    );
  }
  if (columnId.includes("discount")) {
    return Number(
      faker.number.float({ min: 0, max: 50, precision: 0.01 }).toFixed(2)
    );
  }
  if (columnId.includes("shipping")) {
    return Number(
      faker.number.float({ min: 0, max: 50, precision: 0.01 }).toFixed(2)
    );
  }

  // Default fallback
  return faker.number.int({ min: 1, max: 1000 });
}
