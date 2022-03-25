# Import

You can now import a CSV directly into Segment for you to see what the data looks like.

### Boolean Values
The application automatically converts `true`,`TRUE`, `false`, `FALSE` stings to the corresponding boolean values.
### Date Strings
The application automatically converts dates like `2021-11-02 9:20:35` to the corresponding ` ISO-8601` format.


## Executing the Script
Run `npm start` then visit `localhost:3000`.
Provide  your `write api key` from any **analytics.js** source and select the `CSV` file.

## Track Event Example
The script parses column names with `.` as nested properties.
A `CSV file ` with the following column names
```csv
type,event,originalTimeStamp,properties.amount,properties.lot_id,properties.source,timestamp,type,userId
```
Will produce a JSON entry like this
```json
{
  "type": "track",
  "event": "User Placed Bid",
  "originalTimestamp": "2022-03-18T20:12:00.217Z",
  "properties": {
    "amount": 1300,
    "lot_id": "202201-1119-4529-10cf07d0-1fb4-48e3-b378-9bb7b47c5c50",
    "source": "unknown"
  },
  "timestamp": "2022-03-18T20:12:00.336Z",
  "userId": "2c79973c-13bc-4938-b540-1d27acaa9ef5"
}
```

## Identity Event Example
You can as many nested properties as you want. Check `address` fields and the corresponding generated JSON.
```
traits.address.country
traits.address.postalCode
traits.address.state
traits.address.street
```
```json
"traits": {
    "address": {
      "city": "Middletown",
      "country": "AW",
      "postalCode": "07700",
      "state": "NJ",
      "street": "fffsdAddress Line1"
    },
 }
```

```csv
action,userId,timestamp,traits.address.city,traits.address.country,traits.address.postalCode,traits.address.state,traits.street,traits.addressLine1,traits.addressLine2,traits.email,traits.name,traits.payment_method_provided,traits.phone,traits.shipping_address_provided,traits.registrationDate
identify,test0006041c-dc7a-4aee-8066-32d6436,2021-11-02 9:20:35,Diamond Bar,US,91765,CA,"2065 Shannon Ct, Ste A",2065 Shannon Ct,Ste A,test-yabingma@gmail.com,Yabing Ma,false,16267578611,false,2021-11-02 9:20:35

```

```json
{
    "action": "identify",
    "userId": "test0006041c-dc7a-4aee-8066-32d6436",
    "timestamp": "2021-11-02T14:20:35.000Z",
    "traits": {
      "address": {
        "city": "Diamond Bar",
        "country": "US",
        "postalCode": "91765",
        "state": "CA"
      },
      "street": "2065 Shannon Ct, Ste A",
      "addressLine1": "2065 Shannon Ct",
      "addressLine2": "Ste A",
      "email": "test-yabingma@gmail.com",
      "name": "Yabing Ma",
      "payment_method_provided": false,
      "phone": "16267578611",
      "shipping_address_provided": false,
      "registrationDate": "2021-11-02T14:20:35.000Z"
    }
  }
```


## Other Types
Inspect any event in Segment Source Debug page and check row. You don't need to send all the fields. Include `timestamp`.
![debugger example](https://snipboard.io/vqgVGl.jpg)