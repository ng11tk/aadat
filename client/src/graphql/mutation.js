import { gql } from "@apollo/client";

export const UPDATE_UNLOADING_STATUS = gql`
  mutation UPDATE_UNLOADING_STATUS(
    $pk_columns: opening_unloading_pk_columns_input = { id: "" }
    $isDayClose: Boolean = false
  ) {
    update_opening_unloading_by_pk(
      pk_columns: $pk_columns
      _set: { isDayClose: $isDayClose }
    ) {
      id
    }
  }
`;

export const INSERT_SUPPLIER = gql`
  mutation INSERT_SUPPLIER($object: supplier_supplier_insert_input = {}) {
    insert_supplier_supplier_one(object: $object) {
      id
    }
  }
`;

export const INSERT_SUPPLIER_TRANSACTION = gql`
  mutation INSERT_SUPPLIER_TRANSACTION(
    $objects: [supplier_supplier_transaction_insert_input!] = {}
  ) {
    insert_supplier_supplier_transaction(objects: $objects) {
      affected_rows
    }
  }
`;

export const INSERT_BUYER = gql`
  mutation INSERT_BUYER($object: buyer_buyers_insert_input = {}) {
    insert_buyer_buyers_one(object: $object) {
      id
    }
  }
`;

export const UPSERT_SALES_ORDER = gql`
  mutation UPSERT_SALES_ORDER($object: sales_sales_order_insert_input = {}) {
    insert_sales_sales_order_one(
      object: $object
      on_conflict: {
        constraint: sales_order_buyer_id_order_date_key
        update_columns: total_amount
      }
    ) {
      id
      total_amount
    }
  }
`;

export const INSERT_SALES_ORDER_ITEMS = gql`
  mutation INSERT_SALES_ORDER_ITEMS(
    $objects: [sales_sales_order_item_insert_input!] = {}
  ) {
    insert_sales_sales_order_item(objects: $objects) {
      affected_rows
    }
  }
`;

export const INSERT_BUYER_TRANSACTION = gql`
  mutation INSERT_BUYER_TRANSACTION(
    $objects: [buyer_buyer_transactions_insert_input!] = {}
  ) {
    insert_buyer_buyer_transactions(objects: $objects) {
      affected_rows
    }
  }
`;
export const INSERT_EXPENSE_BILLS = gql`
  mutation INSERT_EXPENSE_BILLS(
    $objects: [expense_expense_bills_insert_input!] = {}
  ) {
    insert_expense_expense_bills(objects: $objects) {
      affected_rows
    }
  }
`;

export const INSERT_EXPENSE_TRANSACTIONS = gql`
  mutation INSERT_EXPENSE_TRANSACTIONS(
    $objects: [expense_expense_transactions_insert_input!] = {}
  ) {
    insert_expense_expense_transactions(objects: $objects) {
      affected_rows
    }
  }
`;
