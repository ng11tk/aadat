import { gql } from "@apollo/client";

export const INSERT_UNLOADING = gql`
  mutation INSERT_UNLOADING($object: opening_unloading_insert_input!) {
    insert_opening_unloading_one(object: $object) {
      id
    }
  }
`;

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

export const INSERT_UNLOADING_REMAINING_ITEM = gql`
  mutation INSERT_UNLOADING_REMAINING_ITEM(
    $objects: [opening_remaining_item_insert_input!] = {}
  ) {
    insert_opening_remaining_item(objects: $objects) {
      affected_rows
    }
  }
`;
