# Redis Cache Example

Just a simple example of how to use Redis Cache using Typescript with ioredis lib.

## How to use

1. Install the dependencies

```sh
yarn
```

2. Create DB file

```sh
yarn migration:run
```

3. Start Server

```sh
yarn start:dev
```

## Routes

**CheckStatus**

```
[GET] http://{{host}}:{{port}}/v1/checkstatus
```

**List Squads**

```
[GET] http://{{host}}:{{port}}/v1/squad
```

**Get Squad**

```
[GET] http://{{host}}:{{port}}/v1/squad/:id
```

**Create Squad**

```
[POST] http://{{host}}:{{port}}/v1/squad/
```
Body:
```json
{
    "name": "Millenium Falcon",
    "product": "Pulse",
    "tool": "Pulse Tool",
    "memberCount": 11,
}
```

**Update Squad**
```
[PUT] http://{{host}}:{{port}}/v1/squad/:id
```
> **Note:** Body is the same as **Create Squad** body, but you only have to send the properties you want to update.

Body:
```json
{
    "memberCount": 10,
}
```

**Delete Squad**
```
[DELETE] http://{{host}}:{{port}}/v1/squad/:id
```
