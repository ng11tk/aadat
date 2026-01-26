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

export const INSERT_OPENING = `
   mutation INSERT_UNLOADING($object: opening_unloading_insert_input!) {
    insert_opening_unloading_one(object: $object) {
      id
    }
  }
`;

export const UPDATE_UNLOADING = `
  mutation UPDATE_UNLOADING($pk_columns: opening_unloading_pk_columns_input = {id: ""},  $_set: opening_unloading_set_input = {}) {
  update_opening_unloading_by_pk(pk_columns: $pk_columns, _set: $_set) {
    id
  }
}
`;
