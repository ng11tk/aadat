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
        remaining_quantity
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
    supplier_supplier(
      where: $whereSupplier
      order_by: { updated_at: desc_nulls_first }
    ) {
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
  query FETCH_SUPPLIER_DETAILS(
    $where: supplier_supplier_bool_exp = {}
    $whereSupplierUnloading: supplier_supplier_unloading_bool_exp = {}
  ) {
    supplier_supplier(where: $where) {
      id
      name
      phone
      address
      supplier_unloadings_aggregate(where: $whereSupplierUnloading) {
        aggregate {
          sum {
            amount
            remaining_amount
            advance_amount
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

export const FETCH_MODI_ITEMS = gql`
  query FETCH_MODI_ITEMS($where: opening_unloading_bool_exp = {}) {
    opening_unloading(where: $where) {
      id
      name
      type
      unloading_items {
        id
        name
        quantity
        remaining_quantity
        isSellable
      }
    }
  }
`;

export const FETCH_BUYERS_LIST = gql`
  query FETCH_BUYERS_LIST($whereBuyer: buyer_buyers_bool_exp = {}) {
    buyer_buyers(
      where: $whereBuyer
      order_by: { updated_at: desc_nulls_first }
    ) {
      id
      name
      phone
      address
      total_amount
      remaining_amount
      payment_status
    }
  }
`;

export const FETCH_BUYER_DETAILS = gql`
  query FETCH_BUYER_DETAILS(
    $id: uuid = ""
    $where: buyer_buyer_purchase_bool_exp = {}
  ) {
    buyer_buyers_by_pk(id: $id) {
      id
      name
      phone
      address
      payment_status
      buyer_purchases_aggregate(
        where: $where
        order_by: { purchase_date: desc_nulls_first }
      ) {
        aggregate {
          sum {
            remaining_amount
            total_amount
          }
        }
        nodes {
          id
          total_amount
          remaining_amount
          payment_status
          purchase_date
          sales_order {
            order_date
            items_missing_rate_count
            sales_order_items {
              item_date
              item_name
              item_weight
              quantity
              supplier_name
              unit
              unit_price
            }
          }
        }
      }
    }
  }
`;

export const GET_EXPENSE_CATEGORIES_AGGREGATE = gql`
  query GET_EXPENSE_CATEGORIES_AGGREGATE(
    $where: expense_categories_bool_exp = {}
    $whereBill: expense_expense_bills_bool_exp = {}
  ) {
    expense_categories(where: $where) {
      id
      category
      expense_bills_aggregate(where: $whereBill) {
        aggregate {
          sum {
            advance
            amount
          }
        }
      }
    }
  }
`;
export const FETCH_EXPENSE_BILLS = gql`
  query FETCH_EXPENSE_BILLS(
    $where: expense_expense_bills_bool_exp = {}
    $order_by: [expense_expense_bills_order_by!] = {
      created_at: desc_nulls_first
    }
  ) {
    expense_expense_bills_aggregate(order_by: $order_by, where: $where) {
      aggregate {
        sum {
          advance
          amount
          remaining_amount
        }
      }
      nodes {
        id
        date
        category
        amount
        advance
        bhada_details
        description
        employee {
          name
        }
        remaining_amount
        payment_status
        unloading_id
      }
    }
  }
`;

export const FETCH_EMPLOYEES = gql`
  query FETCH_EMPLOYEES($where: expense_employees_bool_exp = {}) {
    expense_employees(where: $where) {
      id
      name
      category
      phone
      address
      salary
      date_of_join
    }
  }
`;

export const FETCH_SALES = gql`
  query FETCH_SALES($where: sales_sales_order_bool_exp = {}) {
    sales_sales_order(
      order_by: { created_at: desc_nulls_first }
      where: $where
    ) {
      id
      order_date
      buyer_id
      buyer {
        name
      }
      total_amount
      sales_order_items {
        id
        item_date
        item_name
        item_weight
        quantity
        supplier {
          name
          type
        }
        unit
        unit_price
      }
    }
  }
`;
