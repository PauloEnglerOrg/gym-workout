/* Pose data for each pictogram: a = start, b = end. See picto.js for the angle conventions.
   PICTO.map links an exercise (by its picture id in library.js) to one of these. */
(() => {
  const S = PICTO.specs, M = PICTO.map, FL = 90; // FL = ankle height when standing on the floor
  const stand = x => ({ hip: [x, 51], torso: 0, leg: { to: [x, FL] } });
  const withProps = (spec, props) => ({ ...spec, props });
  const rev = spec => ({ ...spec, a: spec.b, b: spec.a });

  /* ---------- chest ---------- */
  const bench = [{ k: 'line', pts: [[30, 70], [100, 70]], w: 5 }, { k: 'line', pts: [[36, 70], [36, 92]] }, { k: 'line', pts: [[94, 70], [94, 92]] }];
  S.bench_bb = {
    a: { hip: [80, 65], torso: -90, leg: { to: [106, FL] }, arm: { to: [54, 38] } },
    b: { hip: [80, 65], torso: -90, leg: { to: [106, FL] }, arm: { to: [55, 56] } },
    props: [...bench, { k: 'bb', at: 'hand', front: true }]
  };
  S.bench_db = withProps(S.bench_bb, [...bench, { k: 'db', at: 'hand', front: true, r: 5.5 }]);

  const incl = [{ k: 'line', pts: [[78, 71], [42, 40]], w: 4 }, { k: 'line', pts: [[78, 71], [98, 71]], w: 4 }, { k: 'line', pts: [[88, 71], [88, 92]] }];
  S.incline_bb = {
    a: { hip: [76, 66], torso: -55, leg: { to: [100, FL] }, arm: { to: [58, 24] } },
    b: { hip: [76, 66], torso: -55, leg: { to: [100, FL] }, arm: { to: [62, 43] } },
    props: [...incl, { k: 'bb', at: 'hand', front: true }]
  };
  S.incline_db = withProps(S.incline_bb, [...incl, { k: 'db', at: 'hand', front: true, r: 5.5 }]);
  S.incline_smith = withProps(S.incline_bb, [...incl, { k: 'line', pts: [[61, 8], [61, 66]], w: 2 }, { k: 'bb', at: 'hand', front: true }]);
  S.incline_machine = {
    a: { hip: [76, 66], torso: -55, leg: { to: [100, FL] }, arm: { to: [64, 47] } },
    b: { hip: [76, 66], torso: -55, leg: { to: [100, FL] }, arm: { to: [76, 28] } },
    props: [...incl, { k: 'dot', at: 'hand', r: 3, front: true }]
  };

  S.press_machine = {
    a: { hip: [58, 71], torso: -4, leg: { a: 88, b: 0 }, arm: { to: [66, 46] } },
    b: { hip: [58, 71], torso: -4, leg: { a: 88, b: 0 }, arm: { to: [84, 45] } },
    props: [{ k: 'line', pts: [[44, 74], [70, 74]], w: 4 }, { k: 'line', pts: [[44, 74], [41, 38]], w: 4 }, { k: 'dot', at: 'hand', r: 3, front: true }]
  };

  S.pushup = {
    a: { hip: [71.7, 73.8], torso: -65, leg: { to: [107, 90], foot: 20 }, arm: { to: [48, 90] } },
    b: { hip: [68.6, 84], torso: -81, leg: { to: [107, 90], foot: 20 }, arm: { to: [48, 90] } },
    props: []
  };

  S.crossover = {
    view: 'front',
    a: { hip: [75, 51], arm: { a: 122, b: 130 }, leg: { a: 3, b: 0 } },
    b: { hip: [75, 51], arm: { a: -8, b: -42 }, leg: { a: 3, b: 0 } },
    props: [{ k: 'cable', from: [18, 6], at: 'hand2' }, { k: 'cable', from: [132, 6], at: 'hand' }]
  };

  /* ---------- shoulders ---------- */
  S.ohp_bb = {
    a: { ...stand(66), torso: -2, arm: { to: [71, 27] } },
    b: { ...stand(66), torso: -2, arm: { to: [68, -2] } },
    props: [{ k: 'bb', at: 'hand', front: true }]
  };
  S.ohp_db = withProps(S.ohp_bb, [{ k: 'db', at: 'hand', front: true, r: 5 }]);
  S.ohp_smith = withProps(S.ohp_bb, [{ k: 'line', pts: [[73, -10], [73, 92]], w: 2 }, { k: 'bb', at: 'hand', front: true }]);
  S.ohp_machine = {
    a: { hip: [58, 71], torso: -4, leg: { a: 88, b: 0 }, arm: { to: [68, 44] } },
    b: { hip: [58, 71], torso: -4, leg: { a: 88, b: 0 }, arm: { to: [64, 19] } },
    props: [{ k: 'line', pts: [[44, 74], [70, 74]], w: 4 }, { k: 'line', pts: [[44, 74], [41, 30]], w: 4 }, { k: 'dot', at: 'hand', r: 3, front: true }]
  };

  S.lateral = {
    view: 'front',
    a: { hip: [75, 51], arm: { a: 7, b: 7 }, leg: { a: 2, b: 0 } },
    b: { hip: [75, 51], arm: { a: 86, b: 86 }, leg: { a: 2, b: 0 } },
    props: [{ k: 'db', at: 'hand', front: true }, { k: 'db', at: 'hand2', front: true }]
  };
  S.lateral_cable = withProps(S.lateral, [{ k: 'cable', from: [28, 90], at: 'hand2' }, { k: 'cable', from: [122, 90], at: 'hand' }]);
  S.lateral_seated = withProps(S.lateral, [{ k: 'db', at: 'hand', front: true }, { k: 'db', at: 'hand2', front: true }, { k: 'line', pts: [[56, 56], [94, 56]], w: 4 }]);

  S.facepull = {
    a: { ...stand(52), arm: { to: [80, 29], bend: -1 } },
    b: { ...stand(52), arm: { to: [60, 16], bend: -1 } },
    props: [{ k: 'cable', from: [122, 30], at: 'hand' }, { k: 'line', pts: [[126, 6], [126, 92]], w: 3 }]
  };
  S.rearfly = {
    view: 'front',
    a: { hip: [75, 51], arm: { a: -10, b: -50 }, leg: { a: 3, b: 0 } },
    b: { hip: [75, 51], arm: { a: 88, b: 88 }, leg: { a: 3, b: 0 } },
    props: [{ k: 'line', pts: [[58, 56], [92, 56]], w: 4 }, { k: 'dot', at: 'hand', r: 3, front: true }, { k: 'dot', at: 'hand2', r: 3, front: true }]
  };

  /* ---------- triceps ---------- */
  S.pushdown = {
    a: { ...stand(60), arm: { a: 2, b: 130 } },
    b: { ...stand(60), arm: { a: 2, b: 14 } },
    props: [{ k: 'cable', from: [82, 5], at: 'hand' }, { k: 'line', pts: [[88, 3], [88, 92]], w: 3 }]
  };
  S.skull = {
    a: { hip: [80, 65], torso: -90, leg: { to: [106, FL] }, arm: { a: 180, b: 182 } },
    b: { hip: [80, 65], torso: -90, leg: { to: [106, FL] }, arm: { a: 180, b: 262 } },
    props: [...bench, { k: 'bb', at: 'hand', front: true, r: 5.5 }]
  };
  S.dips = {
    a: { hip: [62, 64], torso: -22, leg: { to: [96, 88] }, arm: { to: [52, 66] } },
    b: { hip: [62, 78], torso: -16, leg: { to: [100, FL] }, arm: { to: [52, 66] } },
    props: [{ k: 'line', pts: [[24, 66], [54, 66]], w: 4 }, { k: 'line', pts: [[28, 66], [28, 92]] }, { k: 'line', pts: [[50, 66], [50, 92]] }]
  };

  /* ---------- back ---------- */
  S.pulldown = {
    a: { hip: [68, 71], torso: -6, leg: { a: 88, b: 0 }, arm: { a: 168, b: 170 } },
    b: { hip: [68, 71], torso: -12, leg: { a: 88, b: 0 }, arm: { a: 20, b: 160 } },
    props: [{ k: 'cable', from: [92, 4], at: 'hand' }, { k: 'line', pts: [[54, 74], [82, 74]], w: 4 }, { k: 'line', pts: [[80, 65], [98, 65]], w: 3 }]
  };
  S.pullup = {
    floor: false,
    a: { hip: [70, 57], torso: 0, leg: { a: 5, b: -20 }, arm: { to: [72, 5] } },
    b: { hip: [70, 40], torso: 0, leg: { a: 5, b: -20 }, arm: { to: [72, 5], bend: 1 } },
    props: [{ k: 'line', pts: [[46, 5], [98, 5]], w: 3 }]
  };
  S.row_1arm = {
    a: { hip: [40, 50], torso: 72, leg: { to: [36, FL] }, leg2: { a: 50, b: -88 }, arm: { a: 2, b: 2 }, arm2: { to: [62, 64] } },
    b: { hip: [40, 50], torso: 72, leg: { to: [36, FL] }, leg2: { a: 50, b: -88 }, arm: { a: -80, b: 5 }, arm2: { to: [62, 64] } },
    props: [{ k: 'line', pts: [[20, 66], [66, 66]], w: 5 }, { k: 'line', pts: [[26, 66], [26, 92]] }, { k: 'line', pts: [[60, 66], [60, 92]] }, { k: 'db', at: 'hand', front: true }]
  };
  S.row_bb = {
    a: { hip: [48, 52], torso: 68, leg: { to: [62, FL] }, arm: { a: 2, b: 2 } },
    b: { hip: [48, 52], torso: 68, leg: { to: [62, FL] }, arm: { a: -78, b: 8 } },
    props: [{ k: 'bb', at: 'hand', front: true }]
  };
  S.row_cable = {
    a: { hip: [48, 74], torso: 12, leg: { to: [90, 84] }, arm: { to: [78, 52] } },
    b: { hip: [48, 74], torso: -6, leg: { to: [90, 84] }, arm: { to: [56, 62] } },
    props: [{ k: 'cable', from: [140, 56], at: 'hand' }, { k: 'line', pts: [[36, 77], [58, 77]], w: 4 }, { k: 'line', pts: [[96, 76], [96, 92]], w: 3 }]
  };
  S.row_inverted = {
    a: { hip: [74.9, 78], torso: -72, leg: { to: [112, 90], foot: 130 }, arm: { to: [52, 44] } },
    b: { hip: [79.5, 68.4], torso: -56, leg: { to: [112, 90], foot: 130 }, arm: { to: [52, 44] } },
    props: [{ k: 'line', pts: [[36, 44], [68, 44]], w: 3 }, { k: 'line', pts: [[40, 44], [40, 92]], w: 2 }, { k: 'line', pts: [[64, 44], [64, 92]], w: 2 }]
  };
  S.row_machine = {
    a: { hip: [58, 71], torso: 6, leg: { a: 88, b: 0 }, arm: { to: [88, 52] } },
    b: { hip: [58, 71], torso: -4, leg: { a: 88, b: 0 }, arm: { to: [62, 56] } },
    props: [{ k: 'line', pts: [[44, 74], [70, 74]], w: 4 }, { k: 'line', pts: [[76, 40], [76, 60]], w: 5 }, { k: 'dot', at: 'hand', r: 3, front: true }]
  };

  /* ---------- biceps ---------- */
  S.curl_db = {
    a: { ...stand(66), arm: { a: 18, b: 22 } },
    b: { ...stand(66), arm: { a: 18, b: 168 } },
    props: [{ k: 'db', at: 'hand', front: true }]
  };
  S.curl_bb = withProps(S.curl_db, [{ k: 'bb', at: 'hand', front: true, r: 5.5 }]);
  S.curl_cable = withProps(S.curl_db, [{ k: 'cable', from: [118, 88], at: 'hand' }]);
  S.curl_machine = {
    a: { hip: [58, 71], torso: -4, leg: { a: 88, b: 0 }, arm: { a: 40, b: 60 } },
    b: { hip: [58, 71], torso: -4, leg: { a: 88, b: 0 }, arm: { a: 40, b: 168 } },
    props: [{ k: 'line', pts: [[44, 74], [70, 74]], w: 4 }, { k: 'line', pts: [[44, 74], [41, 40]], w: 4 }, { k: 'line', pts: [[66, 58], [78, 70]], w: 5 }, { k: 'dot', at: 'hand', r: 3, front: true }]
  };

  /* ---------- quads ---------- */
  S.squat_bb = {
    a: { hip: [66, 51], torso: 6, leg: { to: [66, FL] }, arm: { a: -35, b: 150 } },
    b: { hip: [50, 67], torso: 42, leg: { to: [68, FL] }, arm: { a: -35, b: 150 } },
    props: [{ k: 'bb', at: 'hand', front: true }]
  };
  S.squat_smith = withProps(S.squat_bb, [{ k: 'line', pts: [[70, 4], [70, 92]], w: 2 }, { k: 'bb', at: 'hand', front: true }]);
  S.squat_goblet = {
    a: { hip: [66, 51], torso: 4, leg: { to: [66, FL] }, arm: { to: [76, 36] } },
    b: { hip: [52, 68], torso: 24, leg: { to: [68, FL] }, arm: { to: [76, 52] } },
    props: [{ k: 'db', at: 'hand', front: true, r: 5.5 }]
  };
  S.hack = {
    a: { hip: [56, 51], torso: -12, leg: { to: [62, FL] }, arm: { a: 10, b: 10 } },
    b: { hip: [60, 68], torso: -12, leg: { to: [76, FL] }, arm: { a: 10, b: 10 } },
    props: [{ k: 'line', pts: [[38, 6], [60, 92]], w: 4 }, { k: 'line', pts: [[70, 94], [88, 94]], w: 3 }]
  };
  S.legpress = {
    a: { hip: [46, 70], torso: -52, leg: { to: [80, 41], foot: 40 }, arm: { a: 60, b: 95 } },
    b: { hip: [46, 70], torso: -52, leg: { to: [62, 58], foot: 40 }, arm: { a: 60, b: 95 } },
    props: [{ k: 'line', pts: [[41, 75], [17, 56]], w: 4 }, { k: 'line', pts: [[41, 75], [62, 75]], w: 4 }, { k: 'line', pts: [[52, 75], [52, 92]] },
      { k: 'line', at: 'foot', pts: [[-4, -7], [5, 6]], w: 4 }]
  };
  S.split = {
    a: { hip: [70, 52], torso: 4, leg: { to: [80, FL] }, leg2: { to: [40, 66] }, arm: { a: 2, b: 2 } },
    b: { hip: [68, 66], torso: 4, leg: { to: [80, FL] }, leg2: { to: [40, 66] }, arm: { a: 2, b: 2 } },
    props: [{ k: 'line', pts: [[24, 68], [46, 68]], w: 4 }, { k: 'line', pts: [[28, 68], [28, 92]] }, { k: 'db', at: 'hand', front: true }]
  };
  S.lunge = {
    a: { hip: [66, 51], torso: 0, leg: { to: [66, FL] }, leg2: { to: [64, FL] }, arm: { a: 2, b: 2 } },
    b: { hip: [66, 70], torso: 0, leg: { to: [88, FL] }, leg2: { to: [44, 88], foot: 20 }, arm: { a: 2, b: 2 } },
    props: [{ k: 'db', at: 'hand', front: true }]
  };
  S.stepup = {
    a: { hip: [62, 55], torso: 4, leg: { to: [82, 75] }, leg2: { to: [62, FL] }, arm: { a: 2, b: 2 } },
    b: { hip: [86, 36], torso: 4, leg: { to: [86, 75] }, leg2: { a: 55, b: 10 }, arm: { a: 2, b: 2 } },
    props: [{ k: 'rect', x: 72, y: 77, w: 40, h: 15, rx: 2 }, { k: 'db', at: 'hand', front: true }]
  };
  S.legext = {
    a: { hip: [60, 71], torso: -4, leg: { a: 88, b: 8 }, arm: { a: 40, b: 90 } },
    b: { hip: [60, 71], torso: -4, leg: { a: 88, b: 88 }, arm: { a: 40, b: 90 } },
    props: [{ k: 'line', pts: [[44, 74], [76, 74]], w: 4 }, { k: 'line', pts: [[44, 74], [42, 48]], w: 4 }, { k: 'dot', at: 'foot', c: [-1, -3], r: 3.4 }]
  };

  /* ---------- hamstrings ---------- */
  S.rdl_bb = {
    a: { hip: [66, 51], torso: 0, leg: { to: [66, FL] }, arm: { a: 3, b: 3 } },
    b: { hip: [52, 50], torso: 78, leg: { to: [64, FL] }, arm: { a: 3, b: 3 } },
    props: [{ k: 'bb', at: 'hand', front: true }]
  };
  S.rdl_db = withProps(S.rdl_bb, [{ k: 'db', at: 'hand', front: true, r: 5 }]);
  S.backext = {
    a: { hip: [62, 50], torso: 104, leg: { to: [44, 86] }, arm: { a: 150, b: 120 } },
    b: { hip: [62, 50], torso: 27, leg: { to: [44, 86] }, arm: { a: 150, b: 120 } },
    props: [{ k: 'line', pts: [[50, 44], [76, 58]], w: 5 }, { k: 'line', pts: [[62, 54], [62, 92]], w: 2 }, { k: 'line', at: 'foot', pts: [[-3, -6], [6, 0]], w: 4 }]
  };
  S.legcurl_lying = {
    a: { hip: [78, 63], torso: -90, leg: { a: 90, b: 90 }, arm: { a: -80, b: -85 } },
    b: { hip: [78, 63], torso: -90, leg: { a: 90, b: 172 }, arm: { a: -80, b: -85 } },
    props: [...bench, { k: 'dot', at: 'foot', c: [0, -3], r: 3.4 }]
  };
  S.legcurl_seated = {
    a: { hip: [58, 71], torso: -4, leg: { a: 88, b: 88 }, arm: { a: 40, b: 90 } },
    b: { hip: [58, 71], torso: -4, leg: { a: 88, b: -10 }, arm: { a: 40, b: 90 } },
    props: [{ k: 'line', pts: [[44, 74], [72, 74]], w: 4 }, { k: 'line', pts: [[44, 74], [42, 48]], w: 4 }, { k: 'dot', at: 'foot', c: [0, -3], r: 3.4 }]
  };
  S.legcurl_ball = {
    a: { hip: [58, 66], torso: -148, leg: { to: [95, 76] }, arm: { to: [68, 89] } },
    b: { hip: [58, 66], torso: -148, leg: { to: [70, 80] }, arm: { to: [68, 89] } },
    props: [{ k: 'circle', at: 'foot', c: [1, 3], r: 8.5 }]
  };

  /* ---------- hips ---------- */
  S.abduct = {
    view: 'front',
    a: { hip: [75, 52], leg: { a: 6, b: 3 }, arm: { a: 25, b: 35 } },
    b: { hip: [75, 52], leg: { a: 34, b: 22 }, arm: { a: 25, b: 35 } },
    props: [{ k: 'line', pts: [[58, 56], [92, 56]], w: 4 }]
  };
  S.adduct = rev(S.abduct);
  S.hip_cable = {
    view: 'front',
    a: { hip: [75, 51], arm: { a: 14, b: 8 }, legL: { a: 2, b: 0 }, legR: { a: 30, b: 22 } },
    b: { hip: [75, 51], arm: { a: 14, b: 8 }, legL: { a: 2, b: 0 }, legR: { a: -14, b: -8 } },
    props: [{ k: 'cable', from: [138, 84], at: 'foot' }]
  };
  S.kickback_leg = {
    a: { hip: [66, 51], torso: 14, leg: { a: 3, b: 3 }, leg2: { a: 3, b: 0 }, arm: { a: 60, b: 80 } },
    b: { hip: [66, 51], torso: 14, leg: { a: -38, b: -38 }, leg2: { a: 3, b: 0 }, arm: { a: 60, b: 80 } },
    props: [{ k: 'cable', from: [112, 88], at: 'foot' }, { k: 'line', pts: [[114, 30], [114, 92]], w: 3 }]
  };

  /* ---------- calves ---------- */
  const block = { k: 'rect', x: 66, y: 84, w: 28, h: 8, rx: 2 };
  S.calf_stand = {
    a: { hip: [70, 45], torso: 0, leg: { to: [70, 84], foot: 90 } },
    b: { hip: [70, 38], torso: 0, leg: { to: [70, 77], foot: 20 } },
    props: [block, { k: 'line', at: 'sh', pts: [[-6, -4], [8, -4]], w: 5 }, { k: 'line', pts: [[84, 4], [84, 80]], w: 2 }]
  };
  S.calf_db = {
    a: { hip: [70, 45], torso: 0, leg: { to: [70, 84], foot: 90 }, arm: { a: 4, b: 4 } },
    b: { hip: [70, 38], torso: 0, leg: { to: [70, 77], foot: 20 }, arm: { a: 4, b: 4 } },
    props: [block, { k: 'db', at: 'hand', front: true }]
  };
  S.calf_press = {
    a: { hip: [46, 70], torso: -52, leg: { to: [80, 41], foot: 100 }, arm: { a: 60, b: 95 } },
    b: { hip: [46, 70], torso: -52, leg: { to: [84, 38], foot: 28 }, arm: { a: 60, b: 95 } },
    props: [{ k: 'line', pts: [[41, 75], [17, 56]], w: 4 }, { k: 'line', pts: [[41, 75], [62, 75]], w: 4 }, { k: 'line', pts: [[52, 75], [52, 92]] },
      { k: 'line', at: 'foot', pts: [[-4, -7], [5, 6]], w: 4 }]
  };
  S.calf_seated = {
    a: { hip: [50, 66], torso: -2, leg: { a: 88, b: 2, foot: 90 }, arm: { a: 40, b: 80 } },
    b: { hip: [50, 59], torso: -2, leg: { a: 88, b: 2, foot: 20 }, arm: { a: 40, b: 80 } },
    props: [{ k: 'rect', x: 66, y: 87, w: 30, h: 5, rx: 2 }, { k: 'line', pts: [[34, 70], [58, 70]], w: 4 },
      { k: 'line', at: 'knee', pts: [[-7, -7], [7, -7]], w: 5 }, { k: 'db', at: 'knee', o: [0, -13], r: 5.5, front: true }]
  };

  /* ---------- core ---------- */
  S.hangleg = {
    floor: false,
    a: { hip: [70, 57], torso: 0, leg: { a: 2, b: 0 }, arm: { to: [72, 5] } },
    b: { hip: [70, 57], torso: 8, leg: { a: 88, b: 90 }, arm: { to: [72, 5] } },
    props: [{ k: 'line', pts: [[48, 5], [96, 5]], w: 3 }]
  };
  S.legraise_lying = {
    a: { hip: [48, 86], torso: -90, leg: { a: 90, b: 90 }, arm: { a: 90, b: 90 } },
    b: { hip: [48, 86], torso: -90, leg: { a: 170, b: 176 }, arm: { a: 90, b: 90 } },
    props: []
  };
  S.cable_crunch = {
    a: { hip: [66, 70], torso: 4, leg: { a: 0, b: -90 }, arm: { to: [74, 36] } },
    b: { hip: [66, 70], torso: 76, leg: { a: 0, b: -90 }, arm: { to: [86, 58] } },
    props: [{ k: 'cable', from: [104, 4], at: 'hand' }]
  };
  S.crunch = {
    a: { hip: [76, 86], torso: -90, leg: { to: [98, 90] }, arm: { to: [36, 82] } },
    b: { hip: [76, 86], torso: -58, leg: { to: [98, 90] }, arm: { to: [48, 58] } },
    props: []
  };
  S.crunch_machine = {
    a: { hip: [58, 71], torso: -4, leg: { a: 88, b: 0 }, arm: { to: [66, 46] } },
    b: { hip: [58, 71], torso: 34, leg: { a: 88, b: 0 }, arm: { to: [78, 54] } },
    props: [{ k: 'line', pts: [[44, 74], [70, 74]], w: 4 }, { k: 'line', pts: [[44, 74], [41, 44]], w: 4 }, { k: 'dot', at: 'hand', r: 3, front: true }]
  };
  S.plank = {
    a: { hip: [71, 81], torso: -78, leg: { to: [112, 90], foot: 15 }, arm: { a: 0, b: 90 } },
    props: []
  };

  /* ---------- which pictogram belongs to which exercise picture ---------- */
  Object.assign(M, {
    Dumbbell_Bench_Press: 'bench_db', 'Barbell_Bench_Press_-_Medium_Grip': 'bench_bb', Machine_Bench_Press: 'press_machine', Pushups: 'pushup',
    'Barbell_Incline_Bench_Press_-_Medium_Grip': 'incline_bb', Incline_Dumbbell_Press: 'incline_db', Smith_Machine_Incline_Bench_Press: 'incline_smith',
    Leverage_Incline_Chest_Press: 'incline_machine', Cable_Crossover: 'crossover',
    Standing_Military_Press: 'ohp_bb', Dumbbell_Shoulder_Press: 'ohp_db', Machine_Shoulder_Military_Press: 'ohp_machine', Smith_Machine_Overhead_Shoulder_Press: 'ohp_smith',
    Side_Lateral_Raise: 'lateral', Cable_Seated_Lateral_Raise: 'lateral_cable', Seated_Side_Lateral_Raise: 'lateral_seated',
    Face_Pull: 'facepull', Reverse_Machine_Flyes: 'rearfly',
    Triceps_Pushdown: 'pushdown', 'Triceps_Pushdown_-_Rope_Attachment': 'pushdown', Reverse_Grip_Triceps_Pushdown: 'pushdown',
    'EZ-Bar_Skullcrusher': 'skull', Bench_Dips: 'dips',
    'Wide-Grip_Lat_Pulldown': 'pulldown', 'Close-Grip_Front_Lat_Pulldown': 'pulldown', Pullups: 'pullup',
    'One-Arm_Dumbbell_Row': 'row_1arm', Bent_Over_Barbell_Row: 'row_bb', Seated_Cable_Rows: 'row_cable', Inverted_Row: 'row_inverted', Leverage_Iso_Row: 'row_machine',
    Dumbbell_Bicep_Curl: 'curl_db', Barbell_Curl: 'curl_bb', Machine_Bicep_Curl: 'curl_machine', Hammer_Curls: 'curl_db', 'Cable_Hammer_Curls_-_Rope_Attachment': 'curl_cable', Cross_Body_Hammer_Curl: 'curl_db',
    Barbell_Squat: 'squat_bb', Goblet_Squat: 'squat_goblet', Smith_Machine_Squat: 'squat_smith', Hack_Squat: 'hack', Leg_Press: 'legpress',
    Split_Squat_with_Dumbbells: 'split', Dumbbell_Lunges: 'lunge', Dumbbell_Step_Ups: 'stepup', Leg_Extensions: 'legext',
    Romanian_Deadlift: 'rdl_bb', 'Stiff-Legged_Dumbbell_Deadlift': 'rdl_db', Hyperextensions_Back_Extensions: 'backext',
    Lying_Leg_Curls: 'legcurl_lying', Seated_Leg_Curl: 'legcurl_seated', Ball_Leg_Curl: 'legcurl_ball',
    Thigh_Abductor: 'abduct', Thigh_Adductor: 'adduct', Cable_Hip_Adduction: 'hip_cable', Band_Hip_Adductions: 'hip_cable', 'One-Legged_Cable_Kickback': 'kickback_leg',
    Standing_Calf_Raises: 'calf_stand', Standing_Dumbbell_Calf_Raise: 'calf_db', Calf_Press_On_The_Leg_Press_Machine: 'calf_press',
    Seated_Calf_Raise: 'calf_seated', 'Dumbbell_Seated_One-Leg_Calf_Raise': 'calf_seated',
    Hanging_Leg_Raise: 'hangleg', Flat_Bench_Lying_Leg_Raise: 'legraise_lying', Cable_Crunch: 'cable_crunch', Crunches: 'crunch', Ab_Crunch_Machine: 'crunch_machine',
    Plank: 'plank'
  });
})();
