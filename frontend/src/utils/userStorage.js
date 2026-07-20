export const getUsers = () => {
  return JSON.parse(
    localStorage.getItem("homelyserv_users") || "[]"
  );
};


export const getProfiles = () => {

  const users = getUsers();

  return users.map(user => {

    const profiles = JSON.parse(
      localStorage.getItem("homelyserv_profiles") || "{}"
    );

    return {
      ...user,
      ...(profiles[user.email] || {})
    };

  });

};