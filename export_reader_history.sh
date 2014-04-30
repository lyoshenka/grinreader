#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/your/subscriptions.xml"
  exit 1
fi

grep -o 'xmlUrl="[^"]\+' "$1" | cut -d'"' -f2 | while read FEED; do
  FEED_URL="$(perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$FEED")"
  URL="https://www.google.com/reader/api/0/stream/contents/feed/${FEED_URL}?r=n&n=99999"
  FILENAME=$(echo -n "$FEED" | sed -e 's|https\?://\(www\.\)\?||' -e 's|[/.]|_|g' -e 's|_\+$||g')
  echo -e "$FEED\n=> $FILENAME"
  curl -s -L $URL | tr -d '\n' > $FILENAME
done
