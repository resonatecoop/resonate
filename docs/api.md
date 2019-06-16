# Stream2own REST API

Url: [api.resonate.is](https://api.resonate.is)

Stream2own API is not open for usage by third parties yet. Feel free to contact us if you have questions.

You can open an issue in stream2own repo if you have a problem with the stream2own API.

If you're looking for our new API, head over [resonatecoop/users-api](https://github.com/resonatecoop/users-api) repository.

## Authentication

**Authenticate with password**
----
 Password authentication is the primary authentication mode.
 Oauth2 is not fully implemented at the moment.

* **URL**

  `/v1/oauth2/password`

* **Method:**
  
  `POST`

* **Data Params**

  ```json
  {
        "username": "hello@auggod.tech", 
        "password": "********"
  }
  ```

* **Success Response:**
  
  * **Code:** 200 <br />
    **Content:** 

    ```json
    {
      "data":{
        "access_token":"11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000",
        "access_token_expires":1555693935,
        "client_id":"41a8e20d-e7a8-435c-91cf-bd491a07ad80",
        "user": {
          "uid": 2124,
          "email":"auggod@resonate.is",
          "login":"auggod",
          "name":"auggod",
          "avatar": { ... },
          "credits":"100.000",
          "username":"auggod"
        }
      "status": "ok"
    }
    ```
 
* **Error Response:**

  * **Code:** 40* <br />
    **Content:**
    
```json
{
    "message":"Unauthorized",
    "status": 400
}
```

* **Sample Call:**

  ```js
    const generateApi = require('@resonate/api-factory-generator')
    
    const api = generateApi({
        auth: {
            login: {
                path: '/oauth2/password',
                options: {
                method: 'POST'
            },
            schema: {
                type: 'object',
                properties: {
                    username: {
                        type: 'string'
                    },
                    password: {
                        type: 'string'
                    }
                }
            }
        }
    }, {
        domain: process.env.API_DOMAIN || 'api.resonate.is',
        prefix: process.env.API_PREFIX || '/v1'
    })
    
    api.auth.login({
        username: "auggod@resonate.is":
        password: "very-secure-password"
    }).then(response => {
        state.user = response.data.user
        // do something useful with user data
    })

  ``

**Retrieve or verify a token**
----

* **URL**

  `/v1/oauth2/tokens`

* **Method:**
  
  `POST`

* **Data Params**

  ```json
  {
        "access_token":"11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000",
        "client_id":"41a8e20d-e7a8-435c-91cf-bd491a07ad80",
  }
  ```

* **Notes:**

Calling this enpoint will save the cookie `token` on `api.resonate.is` domain.

## Tracks

**Fetch tracks**
----

* **URL**

  `/v1/tracks`

* **Method:**
  
  `GET`

* **URL Params**

  **Optional:**

  `limit=[integer]`

  `page=[integer]`

**Fetch a single track**
----

* **URL**

  `/v1/tracks/[:tid]`

## Artists

**Fetch artists**
----

* **URL**

  `/v1/artists`

* **Method:**
  
  `GET`

* **URL Params**

   **Optional:**
 
   `limit=[integer]`

   `page=[integer]`

   `order_by=[name|id]`
   
   `order=[asc|desc]`

* **Notes:**

Default order is `asc` by `name`.

Artists which don't have tracks are not returned.

**Fetch a single artist**
----

* **URL**

  `/v1/artists/[:uid]`

* **Method:**
  
  `GET`

## Labels

**Fetch labels**
----

* **URL**

  `/v1/labels`

* **Method:**
  
  `GET`

* **URL Params**

  **Optional:**

  `limit=[integer]`

  `page=[integer]`

* **Notes:**

Labels which don't have artists or tracks are not returned.

**Fetch a single label**
----

* **URL**

  `/v1/labels/[:uid]`

* **Method:**
  
  `GET`

**Fetch label albums**
----

* **URL**

  `/v1/labels/[:uid]/albums`

* **Method:**
  
  `GET`

* **URL Params**

  **Optional:**

  `limit=[integer]`

  `page=[integer]`

**Fetch label artists**
----

* **URL**

  `/v1/labels/[:uid]/artists`

* **Method:**
  
  `GET`

* **URL Params**

  **Optional:**

  `limit=[integer]`

  `page=[integer]`

**Fetch label tracks**
----

* **URL**

  `/v1/labels/[:uid]/tracks`

* **Method:**
  
  `GET`

* **URL Params**

  **Optional:**

  `limit=[integer]`

  `page=[integer]`

**Fetch tracks of a given type**
----

* **URL**

  `/v1/tracklists/[random|random-all|random-new|top|top-fav|latest|recommended|staff-picks|:type]`

* **Method:**
  
  `GET`

* **URL Params**

  **Optional:**

  `client_id=[string]`

  `limit=[integer]`

  `page=[integer]`

* **Notes:**

Pagination is available for type: `latest`.

## Users

### Tracks

**Get an user favorite tracks**
----

* **URL**

  `/v1/users/[:uid]/tracks/favorites`

* **Method:**
  
  `GET`

* **URL Params**

  **Required:**

  `client_id=[string]`

  **Optional:**

  `limit=[integer]`

  `page=[integer]`

**Fetch user owned tracks**
----

* **URL**

  `/v1/users/[:uid]/tracks/owned`

* **Method:**
  
  `GET`

* **URL Params**

  **Required:**

  `client_id=[string]`

  **Optional:**

  `limit=[integer]`

  `page=[integer]`

**Fetch user plays**
----

Provides plays history.

* **URL**

  `/v1/users/[:uid]/plays`

* **Method:**
  
  `GET`

* **URL Params**

  **Optional:**

  `limit=[integer]`

  `page=[integer]`

  `status=[paid|free]` Not implemented

* **Notes:**

Response contains both paid and free plays.

**Save a play**
----

* **URL**

  `/v1/users/[:uid]/plays`

* **Method:**
  
  `POST`

* **Data Params**

  ```json
  {
        "tid": "1"
  }
  ```

* **URL Params**

  **Required:**

  `client_id=[string]`

## Payment

**Topup credits**
----
 Password authentication is at the moment the only authentication mode available.

* **URL**

  `/v1/users/[:uid]/payment/charge`

* **Method:**
  
  `POST`

* **Authentication mode:**
  
  `bearer`

* **URL Params**

  **Required:**

  `client_id=[string]`

* **Data Params**

  ```json
  {
        "tok": "card_tok", 
        "amount": 500
  }
  ```

* **Success Response:**
  
  * **Code:** 200 <br />
    **Content:** 

    ```json
    {
      "data":{
        "item_name":"RESONATE BEYOND STREAMING LIMITED",
        "stripeToken":"tok_visa",
        "stripeTokenType":"card",
        "stripeEmail":"auggod@resonate.is",
        "item_quantity":"1",
        "item_price":500,
        "currency_code":"EUR",
        "txn_id":"ch_1ET6ZgI6fbO2UESs2iPoGBRg",
        "charge_description":"Purchase Credits",
        "billing_address":null,
        "vat":0
      },
      "message":"Transaction was successfull",
      "status":"ok"
    }
    ```
 
* **Error Response:**

  * **Code:** 40* <br />
    **Content:**
    
```json
{
    "message":"Unauthorized",
    "status": 401
}
```

## Stream

**Stream a track**
----

* **URL**

  `/v1/stream/[i:tid]`

* **Method:**
  
  `GET`

* **URL Params**

  **Optional:**

  `client_id=[string]`

* **Notes:**

If you don't provide a client id, the backend sends a truncated track. (45 seconds)

## Download

**Download a track**
----

Provides a way to download user owned tracks. The downloaded file is of type: `zip` and contains `flac` and `m4a` files.

* **URL**

  `/v1/download/[i:tid]`

* **Method:**
  
  `GET`

* **URL Params**

  **Required:**

  `client_id=[string]`

* **Notes:**

This endpoint will get deprecated soon and moved under `users/[:uid]`

The artwork is not included.

## API Vocab

* **Access token**

`access_token` is oauth2 bearer token. We support sending credentials through `Authorization` header.

* **Client id**

`client_id` helps us identify user to associate play counts and favorites to tracks without the need of strong authentication.

