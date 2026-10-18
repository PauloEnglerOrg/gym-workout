# Gym Workout

A phone-first workout companion: start a day, follow each exercise with a picture, log sets, run a rest timer, and adjust weights on the fly. Works offline once opened, and everything (plan, weights, history) is saved on the phone itself.

## Files
- `index.html` – page and styling
- `app.js` – all the behaviour
- `plan.js` – the starting plan (from the "Workout Plan Tracker" spreadsheet)
- `library.js` – the exercise list used for pictures and "machine busy" swap suggestions
- `picto.js`, `picto-data.js` – the animated stick-figure drawings (drawn from joint angles, no image files)
- `sw.js` – offline helper (keeps a copy of the app and pictures on the phone)
- `img/` – exercise pictures (two poses each)

## Picture credits
Exercise pictures come from [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (public domain, Unlicense), resized for phone use.
