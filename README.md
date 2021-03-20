# Clonestagram

This is the backend repository of Clonestagram: A replication of [Instagram](https://www.instagram.com/)

## Dev Stack

    - Node.js
    - Express
    - MySQL

## Contributing

#### ✔ (최초 1회) 초기 설정

1. **Fork** the repo on GitHub
2. **Clone** the project to your local environment
3. Set james0918/Clonestagram to upstream repo

   ```bash
   $ git remote add upstream https://github.com/jamesj0918/Clonestagram
   ```

#### ❗ 매번 순서대로 진행

1. **Pull** the latest from upstream

   ```bash
   $ git pull upstream develop
   ```

2. **Commit** changes to your own branch
3. **Push** your work back up to your forked repo
4. Submit a **Pull request** so that we can review your changes

## Dependencies

    - Node.js
    - express
    - mysql2
    - crypto
    - jsonwebtoken
    - cors
    - multer

## Required Enviroment Variables

    - DB_HOST : Host for DB Connection
    - DB_USER : Username for DB
    - DB_PASSWORD : Password for DB
    - DB_DATABASE : Name of Database
    - SECRET_KEY : Secret key used for JWT
    - API_PORT : API Port (3000 for default)
    - API_HOST : API Host (localhost for default)
