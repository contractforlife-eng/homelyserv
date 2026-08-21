// Explicit Prisma projection for User data embedded in hire responses.
// Keep this allowlist narrow so future internal User fields cannot leak through
// the response when the Prisma User model grows.
export const HIRE_USER_SELECT = Object.freeze({
  id: true,
  fullName: true,
  email: true,
  phone: true,
  city: true,
  profileImage: true,
});

export const projectHireUser = (user) => {
  if (!user) return null;

  return Object.fromEntries(
    Object.keys(HIRE_USER_SELECT)
      .filter((field) => Object.prototype.hasOwnProperty.call(user, field))
      .map((field) => [field, user[field]])
  );
};
