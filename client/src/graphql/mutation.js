import { gql } from "@apollo/client";

export const INSERT_SALES_ORDER_ITEMS = gql`
  mutation INSERT_SALES_ORDER_ITEMS(
    $objects: [sales_sales_order_item_insert_input!] = {}
  ) {
    insert_sales_sales_order_item(objects: $objects) {
      affected_rows
    }
  }
`;
