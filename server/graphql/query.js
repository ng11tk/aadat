export const GET_USER_BY_EMAIL = `
  query GetUserByEmail($email: String!) {
    users_user_by_pk(email: $email) {
      email
      id
      password
    }
  }
`;

export const GET_LOGIN_TOKENS = `
query GET_LOGIN_TOKENS($where: users_refresh_tokens_bool_exp = {}) {
  users_refresh_tokens(where: $where) {
    token
    user{
      id
      name
    }
  }
}
`;
