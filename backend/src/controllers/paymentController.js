// In MongoDB shell or Compass
db.payments.insertMany([
  {
    employerId: ObjectId("EMPLOYER_USER_ID"),
    workerId: ObjectId("WORKER_USER_ID"),
    jobId: ObjectId("JOB_ID"),
    hireId: ObjectId("HIRE_ID"),
    amount: 3500,
    currency: "EGP",
    status: "completed",
    paymentMethod: "Bank Transfer",
    description: "Payment for Senior Nanny - Full Time",
    reference: "REF-2026-001",
    hasReceipt: true,
    createdAt: new Date("2026-06-25"),
    updatedAt: new Date("2026-06-25")
  },
  {
    employerId: ObjectId("EMPLOYER_USER_ID"),
    workerId: ObjectId("WORKER_USER_ID_2"),
    jobId: ObjectId("JOB_ID_2"),
    hireId: ObjectId("HIRE_ID_2"),
    amount: 2800,
    currency: "EGP",
    status: "pending",
    paymentMethod: "Mobile Wallet",
    description: "Payment for Professional Cleaner - Part Time",
    reference: "REF-2026-002",
    hasReceipt: false,
    createdAt: new Date("2026-06-20"),
    updatedAt: new Date("2026-06-20")
  }
]);