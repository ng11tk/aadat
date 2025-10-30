import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "https://daily-progress.hasura.app/v1/graphql", // Hasura endpoint
    headers: {
      "x-hasura-admin-secret":
        "4MzPVqUxP8NnDGpxZplbJ6KHY55sKHxcEjOHTyqCmkhljlVKUTCUP5gbJyULrVQ2", // Or JWT for auth
    },
  }),
  cache: new InMemoryCache(),
});

export default client;
