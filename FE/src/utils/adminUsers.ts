export const adminUsers = [
  "admin@assist10.com",
  "pintu@assist10.com",
];

export const isAdmin = (email: string) => {
  return adminUsers.includes(email.toLowerCase());
};
