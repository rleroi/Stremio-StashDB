# StashDB graphql API examples

# Usage
- header {"apikey": STASHDB_API_KEY}
- url https://stashdb.org/graphql

Get trending scenes (graphql introspection is on so feel free to check what fields we actually wanna use)
```graphql
query QueryScenes {
    queryScenes(input: { page: 1, sort: TRENDING }) {
        scenes {
            id
            title
            details
            date
            release_date
            production_date
            duration
            director
            code
            created
            updated
            studio {
                id
                name
                aliases
            }
            tags {
                name
                id
            }
            deleted
        }
        count
    }
}
```

Response:
```json
{
    "data": {
        "queryScenes": {
            "scenes": [
                {
                    "id": "7d9e9c98-431c-4542-ba65-5cc73a0a7f62",
                    "title": "Some video title",
                    "details": "Some description.",
                    "date": "2025-11-02",
                    "release_date": "2025-11-02",
                    "production_date": null,
                    "duration": 2459,
                    "director": "Some Name",
                    "code": "106027",
                    "created": "2025-11-02T21:19:16.911483Z",
                    "updated": "2025-11-02T21:19:16.911483Z",
                    "studio": {
                        "id": "eb58505f-428e-4a30-a151-bfab62b2694a",
                        "name": "Site Name",
                        "aliases": []
                    },
                    "tags": [
                        {
                            "name": "Professional Production",
                            "id": "934f989a-642b-4920-a074-55b8867416a4"
                        },
                        {
                            "name": "Indoors",
                            "id": "95e70909-1591-405a-bc34-af443604ab95"
                        },
                        {
                            "name": "Long Hair",
                            "id": "df9ead0e-43cf-4c56-9c36-292b6c03e47d"
                        },
                        {
                            "name": "Slim",
                            "id": "fb327dd2-96de-4555-aa97-143d4dedbe13"
                        }
                    ],
                    "deleted": false
                },
            ],
            "count": 193653
        }
    }
}
```