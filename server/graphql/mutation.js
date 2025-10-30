export const INSERT_USER = `
mutation INSERT_USER($object: users_user_insert_input!) {
  insert_users_user_one(object: $object) {
    name
    email
    surname
  }
}
`;

export const INSERT_LOGIN_TOKEN = `
mutation INSERT_LOGIN_TOKEN($objects: [users_refresh_tokens_insert_input!] = {}) {
  insert_users_refresh_tokens(objects: $objects) {
    affected_rows
    returning {
      id
    }
  }
}
`;

export const DELETE_LOGIN_TOKEN = `
mutation DELETE_LOGIN_TOKEN($where: users_refresh_tokens_bool_exp = {}) {
  delete_users_refresh_tokens(where: $where) {
    affected_rows
  }
}
`;
