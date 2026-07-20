export const syncCurrentUser = () => {

  const currentUser = JSON.parse(
    localStorage.getItem("homelyserv_user") || "null"
  );

  const users = JSON.parse(
    localStorage.getItem("homelyserv_users") || "[]"
  );


  if (!currentUser) return null;


  const updatedUser = users.find(
    user => user.email === currentUser.email
  );


  if (!updatedUser) return currentUser;


  localStorage.setItem(
    "homelyserv_user",
    JSON.stringify(updatedUser)
  );


  return updatedUser;
};