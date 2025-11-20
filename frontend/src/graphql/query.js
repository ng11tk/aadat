import { gql } from "@apollo/client";

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
export const GET_ALL_OPENING_UNLOADING = gql`
  query GET_ALL_OPENING_UNLOADING(
    $whereUnloading: opening_unloading_bool_exp = {}
    $whereUnloadingItems: opening_unloading_item_bool_exp = {}
  ) {
    opening_unloading(where: $whereUnloading) {
      id
      name
      amount
      advance_amount
      type
      unloading_date
      isDayClose
      kharcha_details
      bhada_details
      unloading_items(where: $whereUnloadingItems) {
        id
        name
        quantity
        rate
        isSellable
        unit
      }
    }
  }
`;

export const GET_ALL_OPENING_REMAINING_ITEMS = gql`
  query GET_ALL_OPENING_REMAINING_ITEMS(
    $whereUnloading: opening_unloading_bool_exp = {}
  ) {
    opening_unloading(where: $whereUnloading) {
      id
      name
      type
      unloading_date
      isDayClose
      unloading_items {
        quantity
        name
        unit
        rate
        remaining_items {
          id
          isSellable
          quantity
          closing_date
        }
      }
    }
  }
`;

export const FETCH_SUPPLIERS = gql`
  query FETCH_SUPPLIERS($where: supplier_supplier_bool_exp = {}) {
    supplier_supplier(where: $where) {
      id
      name
      type
    }
  }
`;

export const FETCH_SUPPLIERS_AGGREGATE = gql`
  query FETCH_SUPPLIERS_AGGREGATE(
    $whereSupplier: supplier_supplier_bool_exp = {}
  ) {
    supplier_supplier(where: $whereSupplier) {
      id
      name
      phone
      address
      type
      amount
      remaining_amount
      payment_status
    }
  }
`;

export const FETCH_SUPPLIER_DETAILS = gql`
  query FETCH_SUPPLIER_DETAILS($where: supplier_supplier_bool_exp = {}) {
    supplier_supplier(where: $where) {
      id
      name
      phone
      address
      supplier_unloadings_aggregate(where: {}) {
        aggregate {
          sum {
            amount
            remaining_amount
          }
        }
        nodes {
          id
          amount
          payment_status
          remaining_amount
          unloading_date
          unloading {
            unloading_items {
              id
              name
              quantity
              rate
              unit
            }
          }
        }
      }
    }
  }
`;

export const GET_BUYERS = gql`
  query GET_BUYERS($where: buyer_buyers_bool_exp = {}) {
    buyer_buyers(where: $where) {
      id
      name
    }
  }
`;
