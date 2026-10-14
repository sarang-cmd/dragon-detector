# Station Hardware: Sainlogic WS3500 (from the official manual)

Source: Sainlogic WS3500 manual (52 pages, German edition on ManualsLib). The console uploads to ecowitt.net through the WS View app, so the Ecowitt Cloud API applies. (Sainlogic is the brand; Ecowitt runs the cloud service.)

## 1. What you physically have
| Part | Details |
|---|---|
| Outdoor array (Y-shaped) | Thermo-hygrometer, rain gauge (tipping bucket), wind speed cups, wind vane, transmitter. Solar-powered with 2 x AA backup |
| Console | Display with indoor temp/humidity, barometer, Wi-Fi. Powered by the 5 V adapter (Wi-Fi only works when plugged in) |
| Console shows | Time, moon phase, pressure, forecast icon, UV index, light, wind speed and direction, max/min daily, rain, outdoor and indoor temp + humidity, RF and Wi-Fi icons |
| Derived values | Feels-like, heat index, dew point (TEMP button) |
| Rain values | Rate, event, day, week, month, total |

## 2. Specs to quote on /station
- Transmission range: 100 m open field, 433/868 MHz depending on model. Sensor sends about every 16 s.
- Temperature: -40 to 60 C, accuracy +/- 1 C, resolution 0.1 C.
- Humidity: 10 to 99 %, accuracy +/- 5 %.
- Rain: 0 to 6000 mm, accuracy +/- 10 %, resolution 0.1 mm below 1000 mm.
- Pressure: absolute and relative (relative is sea-level corrected using the elevation you set).
- Solar: UV index and light.
- Forecast icon uses pressure trend and needs about a month to learn; the manual says it predicts about 6 h ahead.

## 3. What this means for the website
1. **Tiles to build:** temperature (+ feels-like, dew point, heat index), humidity, wind speed/gust/direction, rain (rate, hour, day, week, month), pressure (relative, absolute, trend), UV index, light/solar radiation. Moon phase is a nice extra (compute client side, no sensor needed).
2. **Not available:** lightning, soil moisture, air quality, piezo rain. Do not build tiles for them.
3. **Accuracy honesty:** put the +/- numbers in the Station page and the Learn page. Great teaching moment on measurement uncertainty (IB TOK/Physics).
4. **Rain event logic:** the console treats a rain event as ended when the last hour had under 1 mm and the last 24 h had none. Day = calendar day 00:00-24:00, week = calendar week. Mirror this wording.
5. **Pressure:** the manual's troubleshooting says a mismatch with official stations usually means you are viewing absolute, not relative pressure. Always show relative as the main value and set the station elevation correctly in the app.
6. **Wi-Fi:** 2.4 GHz only. If the console drops off the network, the website goes stale. The stale banner (docs 02 and 04) is essential. Ask school IT to allow the console on the 2.4 GHz network and give it a stable DHCP lease.
7. **Upload interval:** configured in the WS View app (Ecowitt upload page). Pick the shortest available (typically 1-5 min) so the cloud API stays fresh. UI polling every 60 s is plenty.
8. **Firmware:** Wi-Fi firmware V1.4.4+ syncs the clock with the internet. Check the firmware version in the app.

## 4. App setup checklist (already done for you, verify)
1. WS View (or WS View Plus) app > device list shows the console, connected to Wi-Fi (setup network was "EasyWeather-WIFI...").
2. Weather service upload: Ecowitt.net is ON, interval set.
3. Units configured in the app (menu > configure units). The API units are chosen separately in the request.
4. Station location and elevation set on ecowitt.net.
5. Optional backup: the manual describes a "Custom Website" upload (Ecowitt or Wunderground protocol) which pushes data to your own server URL. Not needed for v1; fall back to it only if the cloud API is unreliable.

## 5. Siting and maintenance notes (for the club)
- The manual recommends testing for a week in a temporary spot before permanent mounting. Since you already bolted it, record the exact mounting height and surroundings in /station.
- Keep clear of walls and roofs for wind; keep out of direct reflected heat for temperature; mount the rain gauge level (alignment mark straight).
- Metal and walls reduce radio range; check the signal strength icon on the console.
- Clean the rain gauge every 3 months (turn funnel counter-clockwise, wipe the mechanism), clean the solar panel and radiation sensor every 3 months, replace batteries every 1-2 years (check every 3 months in harsh conditions).
- Safety: any metal pole attracts lightning. Do not work on the mount during storms.
- Sensor not transmitting: hold RESET with a paperclip for 3 s, remove batteries for a minute with the solar panel covered, reinsert.
- Add a maintenance log to the club handbook; reflect relocations or cleaning dates on the website (data meaning changes).

## 6. Facts not in the manual
Exact Ecowitt API field names for your model are not in the manual. The real sample JSON from the API (session 3) is the final authority.
