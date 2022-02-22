const {buildSchema} = require("graphql");

module.exports = buildSchema(`
  type Post {
    _id: ID!
    content: String!
    creator: User!
    createdAt: String!
    updatedAt: String!
  }

  type User {
    _id: ID!
    firstName: String!
    email: String!
    password: String!
    posts: [Post!]!
  }

  input UserInputData {
    firstName: String!
    email: String!
    password: String!
  }

  type AuthData {
    token: String!
    userId: String!
  }

  type PostData {
    posts: [Post!]!
  }

  type RootQuery {
    login(email: String!, password: String!): AuthData!
    posts: PostData!
    post(id: ID!): Post!
  }

  type RootMutation {
    signup(userInput: UserInputData): User!
    addPost(content: String!): Post!
    updatePost(id: ID!, content: String!): Post!
    deletePost(id: ID!): Boolean
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
`);
