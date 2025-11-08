# Code examples for Easynews API
Make sure to convert examples to our current stack (NodeJS, stremio-addon-sdk, Beamup, Axios)

## Response Data Item Fields

Based on actual Easynews API responses, each data item in `searchResponse.data` array contains:

- `0` - Post hash (for URL construction)
- `4` - Filesize
- `10` - Filename
- `11` - File extension (e.g., ".mp4", ".mkv")
- `12` - encoding string (e.g., "H264", "HEVC")
- `14` - duration string (e.g., "30m:30s")
- `type` - e.g., "VIDEO". Only videos should be used.
- `fullres` - e.g., "1920 x 1080"

Example data item:
```json
    {
      "0": "f82497706e157e50cc96fb861520f8790b445e2a5",
      "1": "",
      "2": ".mp4",
      "3": "240 x 135",
      "4": "1.7 GB",
      "5": "11-06-2025 13:55:52",
      "6": "R3dOkTpXxyOL9Ux2EwZvdLZM3 (sitename.25.11.06.jade.kimiko.mp4 AutoUnRAR)",
      "7": "FRIENDS &lt;friends@group.local&gt;",
      "8": "<autorar-QlMtXlEuGhFsPoAyGlJwNlJc-1762437112868@nyuu-f1940cff>",
      "9": "alt.binaries.friends",
      "10": "sitename.25.11.06.jade.kimiko",
      "11": ".mp4",
      "12": "H264",
      "13": "1",
      "14": "30m:30s",
      "15": 8030,
      "16": 44100,
      "17": 29.97,
      "18": "AAC",
      "19": "5ffb650b8ece9c358f43c20f051f3d05",
      "20": "&#8734;",
      "id": "a709",
      "type": "VIDEO",
      "height": "1080",
      "width": "1920",
      "theight": 135,
      "twidth": 240,
      "fullres": "1920 x 1080",
      "alangs": [
        "eng"
      ],
      "slangs": null,
      "passwd": false,
      "virus": false,
      "expires": "&#8734;",
      "nfo": "",
      "ts": 1762437352,
      "rawSize": 1837583398,
      "volume": false,
      "sc": false,
      "primaryURL": "//",
      "fallbackURL": "//",
      "sb": 1,
      "size": 1837583398,
      "hash": "f82497706e157e50cc96fb861520f8790b445e2a5",
      "runtime": 1830,
      "timestamp": 1762437352,
      "sig": "eNoBYACf|zUTMgquCqMMNokBN6DlN-uBrZzq1WIgntJ8eqzyxNcxWEyxQYF-8t3xtlXzB|IpbkIeTTDnRSR7qtsWwjWDZP8T1DqzADRAn-INPPgwkHl7N8BzLk49HL73UqROg7ucs5OeLes",
      "extension": ".mp4",
      "password": false,
      "old_setid": "c096127b",
      "bps": 8030908,
      "setid": "5ffb650b8ece9c358f43c20f051f3d05",
      "fn": "sitename.25.11.06.jade.kimiko",
      "acodec": "AAC",
      "master": "15",
      "mid": "<autorar-QlMtXlEuGhFsPoAyGlJwNlJc-1762437112868@nyuu-f1940cff>",
      "origin_nsp": "usenet.farm",
      "colid": "da0fb9c422f8f20f3377646bc08644c0",
      "hz": 44100,
      "reposts": 1,
      "fps": 29.97,
      "yres": 1080,
      "poster": "FRIENDS <friends@group.local>",
      "subject": "R3dOkTpXxyOL9Ux2EwZvdLZM3 (sitename.25.11.06.jade.kimiko.mp4 AutoUnRAR)",
      "vcodec": "H264",
      "xres": 1920,
      "uniq": "1a11c9d6a85106072b0dd5a93a0386834cb22f88",
      "groups": "alt.binaries.friends",
      "parset": "",
      "audio_tracks": [
        "eng"
      ],
      "disposition": "1",
      "meta": ""
    },
```

```php
// $searchResponse is retreived by the search() method
// the $urlPrefix is the same for each $dataItem
private function getUrlPrefix(array $searchResponse$): string
{
    $downUrl = $searchResponse['downURL'] ?? '';
    $dlFarm = $searchResponse['dlFarm'] ?? '';
    $dlPort = $searchResponse['dlPort'] ?? '';

    return "{$downUrl}/{$dlFarm}/{$dlPort}";
}
```

```php
// $dataItem is retreived from the $searchResponse['data'] array
function getUrl(array $dataItem): string
{
    $postHash = $dataItem['0'] ?? '';
    $postTitle = $dataItem['10'] ?? '';
    $ext = $dataItem['11'] ?? '';

    return "{$urlPrefix}/{$postHash}{$ext}/{$postTitle}{$ext}""
}
```

```php
// webReady by attaching basic auth in the url itself. This must be done _per configuration_ and not saved in memory cache, unlike the metadata and $url which are safe to keep cached. Execute this on response, not on scrape.
// $url is retreived by the 
function getStreamUrl(string username, string $password, string $url)
{
    $urlPrefix = str_replace('https://', '', $url);

    return  "https://{$username}:{$password}@{$url}"";
}
```

```php
function search(string $username, string $password, string $query): array
{
    return Http::withBasicAuth($username, $password)
        ->throw()
        ->get(
            "https://members.easynews.com/2.0/search/solr-search/advanced?gps=$query&u=1&fty[]=VIDEO&fex=m4v,3gp,mov,divx,xvid,wmv,avi,mpg,mpeg,mp4,mkv,avc,flv,webm"
        )
        ->json();
}
```
