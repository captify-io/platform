import { getServerSession } from "@captify/core/lib";

export async function UserWelcome() {
  const session = await getServerSession();
  
  if (!session?.user) {
    return null;
  }

  return (
    <p className="text-lg text-primary mt-4">
      Welcome back, {session.user.name || session.user.email}!
    </p>
  );
}
