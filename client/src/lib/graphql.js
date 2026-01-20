import { GraphQLClient } from "graphql-request";

import dotenv from "dotenv";
dotenv.config();

export const gqlClient = new GraphQLClient(process.env.DATA_HUB, {
  headers: {
    "x-hasura-admin-secret": process.env.HASURA_GRAPHQL_ADMIN_SECRET,
  },
});
