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
query GET_LOGIN_TOKENS(
  $where: users_refresh_tokens_bool_exp!
  $order_by: [users_refresh_tokens_order_by!]
  $limit: Int
) {
  users_refresh_tokens(where: $where, order_by: $order_by, limit: $limit) {
    token
    user{
      id
      name
    }
  }
}
`;

export const FIND_SALES_ORDERS = `
  query FIND_SALES_ORDERS($where: sales_sales_order_bool_exp = {}) {
    sales_sales_order(where: $where) {
      id
      total_amount
      items_missing_rate_count
    }
  }
`;
