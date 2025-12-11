export const adminUsers = [
  "admin@assist-ten.com",
  "pintu@assist-ten.com",
];

export const isAdmin = (email: string) => {
  return adminUsers.includes(email.toLowerCase());
};
