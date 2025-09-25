// update-user-email.js
import { createClient } from "@supabase/supabase-js";

// 👇 replace these with your real values (no !, no quotes around env vars)
const supabase = createClient(
  process.env.SUPABASE_URL || "https://eecbrvehrhrvdzuutliq.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlY2JydmVocmhydmR6dXV0bGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ4NjYzOCwiZXhwIjoyMDYwMDYyNjM4fQ.1FEbdFSWxQLQDqmA0CSquYiM3Wy3tOVjXM1EUnPh4MM"
);

async function main() {
  // 🔒 Hard-coded values
  const oldEmail = "amber.daros@mmtransport.com";
  const newEmail = "bestburper9189@gmail.com";

  // List all users (default limit is 50, bump if needed)
  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (fetchError) {
    console.error("Error fetching users:", fetchError);
    process.exit(1);
  }

  const user = users.users.find((u) => u.email === oldEmail);
  if (!user) {
    console.error("❌ No user found with email:", oldEmail);
    process.exit(1);
  }

  // Update their email
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    email: newEmail,
  });

  if (error) {
    console.error("❌ Error updating user:", error);
    process.exit(1);
  }

  console.log(`✅ Changed ${oldEmail} → ${newEmail}`);
  console.log(data);
}

main();
