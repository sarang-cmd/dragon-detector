# Education Content and Launch

## 1. Concept cards (draft)
| Measurement | Kids version | Students version | Try this |
|---|---|---|---|
| Temperature | How hot or cold the air is. | Average kinetic energy of air molecules, in degC, measured in a shaded sensor. | Why is the sensor shaded? |
| Feels like | How warm it feels to your body. | Combines temperature with wind (wind chill) or humidity (heat index). | When is feels-like lower than the real temperature? |
| Humidity | How much water is hiding in the air. | Relative humidity = vapour pressure vs maximum at that temperature. | Why does humidity rise at night? |
| Dew point | The temperature where dew forms. | Temperature at which air saturates; better comfort measure than RH. | Predict fog when temp and dew point are within 2 degrees. |
| Wind speed | How fast the air moves. | Anemometer average; Beaufort scale 0-12. | Compare morning and afternoon. |
| Wind gust | A short strong burst. | Peak wind over the interval. | Compute gust factor (gust / average). |
| Wind direction | Where the wind comes from. | Degrees from north, direction wind blows FROM. | Which direction brings warm air? |
| Rain | How much water fell. | Tipping bucket; 1 mm = 1 litre per m2. | 5 mm on the school roof = how many litres? |
| Pressure | The weight of the air above us. | Relative (sea-level corrected) vs absolute, in hPa. | Plot pressure and rain for a week. |
| UV index | How strongly the sun can burn skin. | Weighted UV irradiance, scale 0-11+. | At what UV does sunscreen matter? |
| Light / solar | How bright the sun is. | Irradiance (W/m2), relevant for solar panels. | Output of 1 m2 panel at 15% efficiency? |
| Measurement uncertainty | Our station is not perfect. | WS3500: temp +/-1 C, humidity +/-5 %, rain +/-10 %. | Compare with DWD Dresden; why do they differ? |

## 2. Classroom activities
1. Weather detective (age 7-10): predict tomorrow from pressure trend, check next day.
2. Rain per roof (age 9-12): mm to litres for the roof area.
3. Wind and gusts (MYP): gust factor against time of day.
4. Dew point and fog (MYP/DP Physics): when did temp meet dew point?
5. Urban heat (DP Geography/ESS): compare with official DWD Dresden values.
6. Solar potential (DP Physics): panel energy from W/m2.
7. Data science (Maths/CS): CSV, mean/median/SD, regression of temp vs humidity.
8. Sensor accuracy debate (TOK): how do we know a measurement is right?
Each activity: age, time, materials, steps, expected result, extension.

## 3. Teacher handout (one page)
URL + QR code on intranet and in the lobby; "Show the class" = /display on the projector; "Get data" = /data then CSV; "Lesson ideas" = /learn then Activities; contact = Weather Club email.

## 4. Tone
Short sentences, minimal jargon on the home page, detail one tap deeper. English first; keep strings i18n-ready for German.

## 5. QA checklist
- [ ] Values match the WS View / Ecowitt app within rounding
- [ ] Units and conversions verified; relative (not absolute) pressure shown
- [ ] Wind direction semantics = FROM
- [ ] Rain day resets at Europe/Berlin midnight; daylight saving correct
- [ ] Stale/offline simulated and looks right
- [ ] iPhone Safari, Android Chrome, school laptops
- [ ] No keys in repo, bundle or logs
- [ ] Lighthouse >= 90, keyboard navigation
- [ ] Logo usage approved by school
- [ ] Privacy/Imprint present, no tracking cookies

## 6. Launch plan
1. Preview link to teacher sponsor.
2. Fix feedback; connect subdomain (ask school IT for a CNAME).
3. Announce via assembly slide, QR poster, newsletter.
4. Week 1: watch Vercel logs; compare with DWD.
5. Later: pressure-trend text, records ("hottest day"), monthly report, German version.

## 7. Station care
See docs/07: clean rain gauge and solar panel every 3 months; check batteries; log relocations on /station.
