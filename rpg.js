/* Design Quest — a tiny top-down pixel RPG through Shyam's life in design.
   Original art, drawn in code at GBA resolution (240×160, 16px tiles).
   Arrows / WASD to move · Z / Space / Enter to talk · on-screen pad on touch. */
(function () {
  'use strict';
  var root = document.getElementById('rpg');
  if (!root) return;
  var cv = root.querySelector('canvas');
  var ctx = cv.getContext('2d');
  var T = 16, VW = 240, VH = 160;
  cv.width = VW; cv.height = VH;
  ctx.imageSmoothingEnabled = false;

  var ui = {
    place: root.querySelector('.rpg__place'),
    placeName: root.querySelector('.rpg__place-name'),
    placeYears: root.querySelector('.rpg__place-years'),
    stamps: root.querySelector('.rpg__stamps'),
    dialog: root.querySelector('.rpg__dialog'),
    who: root.querySelector('.rpg__who'),
    text: root.querySelector('.rpg__text'),
    title: root.querySelector('.rpg__title'),
    end: root.querySelector('.rpg__end'),
    replay: root.querySelector('.rpg__replay'),
    focus: root.querySelector('.rpg__focus')
  };

  /* ------------------------------------------------------------------ */
  /* palette                                                              */
  /* ------------------------------------------------------------------ */
  var P = {
    ink: '#283040', grass: '#7cc85c', grassDk: '#5aa844', grassLt: '#a0dc78',
    path: '#ecd8a4', pathDk: '#d4bc84', pathEdge: '#c4a468',
    leaf: '#3c8c3c', leafMd: '#52a84a', leafLt: '#7cc860', trunk: '#8a5a34',
    water: '#58a8f0', waterLt: '#9cd0fc', waterDk: '#3c84d0',
    plank: '#c08850', plankDk: '#8a5a2c',
    stone: '#9aa0b4', stoneDk: '#7e8498', stoneLt: '#b4b9ca', rail: '#505466',
    field: '#6cc050', fieldDk: '#5eb046', pitch: '#e0cf94',
    wall: '#f6eeda', wallDk: '#d8ccb0', brick: '#b8603e', brickDk: '#8e4630', mortar: '#e2a584',
    glass: '#6ab4ec', glassLt: '#c4e6fc', door: '#8a5a34', doorDk: '#633e22',
    red: '#e05a3c', white: '#ffffff', lav: '#928cf8', lavDk: '#6e67d8', lilac: '#c9c6fd',
    salmon: '#ff7d75', butter: '#ffe08f', cream: '#fcf4d6'
  };

  /* ------------------------------------------------------------------ */
  /* world map                                                            */
  /* ------------------------------------------------------------------ */
  var MW = 102, MH = 20;
  var G = 0, PATH = 1, TREE = 2, WATER = 3, FLOWER = 4, TALL = 5, FENCE = 6, BRIDGE = 7,
      STONE = 8, TRACK = 9, FIELD = 10, GRAFF = 11, BUILD = 12, PITCH = 13, PLAZA = 14;
  var map = [];
  for (var y = 0; y < MH; y++) { map.push([]); for (var x = 0; x < MW; x++) map[y].push(G); }
  function set(x, y, t) { if (x >= 0 && y >= 0 && x < MW && y < MH) map[y][x] = t; }
  function rect(x, y, w, h, t) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) set(x + i, y + j, t); }
  function hash(x, y) { var h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }

  // border trees
  rect(0, 0, MW, 2, TREE); rect(0, 18, MW, 2, TREE); rect(0, 0, 2, MH, TREE); rect(MW - 2, 0, 2, MH, TREE);
  // the long road of the journey
  rect(2, 11, MW - 4, 2, PATH);

  // buildings: x, y, w, h (tiles), door x, style
  var buildings = [
    { id: 'home',    x: 4,  y: 6, w: 5, h: 4, door: 6,  roof: '#e05a3c', style: 'house' },
    { id: 'manipal', x: 14, y: 3, w: 8, h: 7, door: 17, roof: '#4a78d8', style: 'uni',    sign: ['MANIPAL', '#ffffff', '#2f5cb8'] },
    { id: 'fever',   x: 27, y: 6, w: 5, h: 4, door: 29, roof: '#f08a30', style: 'fever',  sign: ['COLLEGE FEVER', '#ffffff', '#c85a14'] },
    { id: 'supr',    x: 37, y: 6, w: 6, h: 4, door: 39, roof: '#3fa64a', style: 'shop',   sign: ['SUPR DAILY', '#ffffff', '#2a8436'] },
    { id: 'eloelo',  x: 50, y: 5, w: 6, h: 5, door: 52, roof: '#7a54d8', style: 'eloelo', sign: ['ELOELO', '#ffffff', '#6440c4'] },
    { id: 'tapri',   x: 56, y: 8, w: 2, h: 2, door: -1, roof: '#d8402c', style: 'tapri' },
    { id: 'glance',  x: 61, y: 2, w: 7, h: 8, door: 64, roof: '#23a6a0', style: 'tower',  sign: ['glance', '#ffffff', '#e8203c'] },
    { id: 'novo',    part: 'glance', x: 70, y: 8, w: 2, h: 2, door: -1, roof: '#ff4f00', style: 'kiosk',  sign: ['NOVO', '#ff4f00', '#ffffff'] },
    { id: 'nostra',  part: 'glance', x: 72, y: 6, w: 3, h: 4, door: 73, roof: '#5a2cc8', style: 'arcade', sign: ['NOSTRA', '#1c1633', '#ff4fd8'] },
    { id: 'rmit',    x: 84, y: 3, w: 7, h: 7, door: 87, roof: '#3fae2a', style: 'brain',  sign: ['RMIT', '#e60028', '#ffffff'] },
    { id: 'studio',  x: 95, y: 6, w: 5, h: 4, door: 97, roof: '#928cf8', style: 'studio', sign: ['STUDIO', '#ffe08f', '#283040'] }
  ];
  buildings.forEach(function (b) {
    rect(b.x, b.y, b.w, b.h, BUILD);
    if (b.door >= 0) rect(b.door, b.y + b.h, 1, 1, PATH);   // little path to the door
  });
  // the Glance campus: one paved plaza under the tower, the Novo kiosk and the Nostra arcade
  for (var py = 2; py <= 10; py++) for (var pxx = 61; pxx <= 75; pxx++) if (map[py][pxx] !== BUILD) set(pxx, py, PLAZA);
  set(60, 10, PLAZA); for (py = 2; py <= 9; py++) set(60, py, FENCE);

  // Glance cricket field (Feel The Blue)
  rect(61, 14, 9, 3, FIELD); rect(64, 15, 3, 1, PITCH);
  for (var fx = 60; fx <= 70; fx++) { set(fx, 13, fx === 65 ? G : FENCE); set(fx, 17, FENCE); }
  for (var fy = 13; fy <= 17; fy++) { set(60, fy, FENCE); set(70, fy, FENCE); }

  // the big move: a river with a bridge
  rect(76, 0, 6, MH, WATER); rect(76, 11, 6, 2, BRIDGE);

  // Melbourne: bluestone plaza, graffiti laneway, tram line
  rect(82, 2, 18, 9, STONE); rect(82, 13, 18, 5, STONE);
  buildings.forEach(function (b) { if (b.x >= 82) { rect(b.x, b.y, b.w, b.h, BUILD); rect(b.door, b.y + b.h, 1, 1, PATH); } });
  rect(92, 6, 2, 3, GRAFF);
  rect(82, 15, 18, 1, TRACK);

  // decoration: flowers, tall grass, a few tree clumps
  var treeSpots = [[10, 2], [24, 2], [24, 14], [34, 14], [44, 2], [46, 14], [56, 14], [72, 14], [12, 14], [30, 2], [58, 2]];
  treeSpots.forEach(function (p) { rect(p[0], p[1], 2, 2, TREE); });
  rect(18, 14, 4, 2, TALL); rect(40, 14, 3, 2, TALL); rect(52, 2, 3, 2, TALL);
  for (y = 2; y < 18; y++) for (x = 2; x < MW - 2; x++) {
    if (map[y][x] === G && hash(x, y) > 0.9) map[y][x] = FLOWER;
  }

  var BLOCK = {}; [TREE, WATER, FENCE, GRAFF, BUILD].forEach(function (t) { BLOCK[t] = true; });

  /* ------------------------------------------------------------------ */
  /* story: zones, signs, NPCs, stamps                                    */
  /* ------------------------------------------------------------------ */
  var zones = [
    { x0: 0,  x1: 12,  name: 'Hometown', years: 'Where it started' },
    { x0: 13, x1: 25,  name: 'Manipal University', years: '2015 – 2019' },
    { x0: 26, x1: 34,  name: 'The College Fever', years: 'Dec 2019 – Mar 2020' },
    { x0: 35, x1: 47,  name: 'Supr Daily by Swiggy', years: '2020 – 2021' },
    { x0: 48, x1: 59,  name: 'Eloelo', years: '2021 – 2022' },
    { x0: 60, x1: 74,  name: 'Glance', years: '2022 – 2024' },
    { x0: 75, x1: 81,  name: 'The Big Move', years: '2024' },
    { x0: 82, x1: 93,  name: 'Melbourne · RMIT', years: '2024 – 2026' },
    { x0: 94, x1: 101, name: "Shyam's Studio", years: 'Now' }
  ];
  var STAMPS = ['Engineer', 'First gig', 'Daily', 'Rebrand', 'Big leagues', 'New chapter', 'Now'];

  var things = [];   // anything you can talk to that blocks a tile
  function sign(x, y, who, lines) { things.push({ kind: 'sign', x: x, y: y, who: who, lines: lines }); }
  function obj(kind, x, y, who, lines) { things.push({ kind: kind, x: x, y: y, who: who, lines: lines }); }
  function npc(x, y, look, who, lines, stamp) {
    things.push({ kind: 'npc', x: x, y: y, look: look, who: who, lines: lines, stamp: stamp, dir: 'down', turnAt: 2 + Math.random() * 3 });
  }
  function door(bid, who, lines, stamp) {
    var b = buildings.filter(function (q) { return q.id === bid; })[0];
    things.push({ kind: 'door', x: b.door, y: b.y + b.h - 1, who: who, lines: lines, stamp: stamp, invisible: true });
  }

  sign(9, 10, 'Signpost', ["DESIGN QUEST", "Walk right to follow Shyam's journey through design, from 2015 to now.", "Talk to people and read signs with Z, Space or A. Collect a stamp at every stop!"]);
  npc(3, 13, { hair: '#6a4a3a', skin: '#c89070', shirt: '#e07aa0', pants: '#4a5a80' }, 'Mom',
    ["Shyam! Have you eaten? You can't go anywhere on an empty stomach.", "Since you were small you were drawing on every book and every wall. Now they call it design!", "Okay, go, go. Work hard, be nice to people, and call me when you reach!"]);
  door('home', 'Home', ["Home. Sketchbooks stacked to the ceiling.", "Everything started with doodles in the margins."]);

  sign(13, 10, 'Signpost', ["MANIPAL UNIVERSITY", "Bachelor's in Instrumentation & Control Engineering, 2015 – 2019."]);
  npc(20, 10, { hair: '#d8d8d8', skin: '#b87c58', shirt: '#f4f4f4', pants: '#505866', coat: true }, 'Professor',
    ["Sensors, circuits, control systems. Solid engineering work!", "But I keep finding sketches in the margins of your lab notes...", "Systems thinking will serve you well, wherever you go. Take this!"], 0);
  door('manipal', 'Manipal University', ["Lecture halls, labs and a lot of late-night doodling."]);

  sign(26, 10, 'Signpost', ["THE COLLEGE FEVER", "Graphic Design Intern, Dec 2019 – Mar 2020."]);
  npc(32, 10, { hair: '#1e1e28', skin: '#a8704c', shirt: '#f08a30', pants: '#3a3a4a' }, 'Kushal',
    ["Welcome to The College Fever! I'm Kushal, the CEO.", "We need posts for all our social channels, and posters for our clients' events. By Friday!", "Your first real design job. Nice work! Here's your stamp."], 1);
  door('fever', 'The College Fever', ["A poster-covered office. Your first design desk is in here."]);

  sign(35, 10, 'Signpost', ["SUPR DAILY by SWIGGY", "Visual Designer, Mar 2020 – Oct 2021."]);
  npc(37, 13, { hair: '#2a2020', skin: '#9c6a48', shirt: '#fc8019', pants: '#34384a', cap: '#fc8019' }, 'Delivery exec',
    ["Morning! Milk run done by 7am.", "That user manual you designed for us delivery execs? Made my first week so much easier.", "And I keep seeing your banners and brand collabs everywhere: Cadbury, Nestlé, Monster Energy!"]);
  npc(41, 10, { hair: '#2a1c18', skin: '#b88660', shirt: '#3fa64a', pants: '#34384a' }, 'Michelle',
    ["Shyam! I'm Michelle, your manager here at Supr Daily.", "I could see a designer in you before you called yourself one.", "You just needed someone to hand you the brief and trust you with it. Look how far you've come! This one's yours."], 2);
  npc(43, 10, { hair: '#1e1a1a', skin: '#a8704c', shirt: '#8a94a8', pants: '#34384a' }, 'Tharun',
    ["Shyam! It's Tharun. Fine, Bob. Everyone here calls me Bob.", "I showed you a design trick or two back then. Okay, maybe a few hundred.", "Good to see you still use them. Michelle, Rahul, you and me: best corner of the marketing team."], 2);
  npc(45, 10, { hair: '#1c1616', skin: '#b07850', shirt: '#f4b6c2', pants: '#3a4462' }, 'Rahul',
    ["Rahul here. Words guy.", "A good design gets a look. A good one-liner gets remembered.", "Keep it quirky, keep it short. See? That was six words."], 2);
  obj('crates', 36, 13, 'Milk crates', ["Crates of fresh milk.", "Somebody designed the push notification that sold all of these."]);
  door('supr', 'Supr Daily', ["The shop smells like fresh bread and push notifications."]);

  sign(48, 10, 'Signpost', ["ELOELO", "Visual & Product Designer, Sep 2021 – Nov 2022."]);
  obj('streamrig', 51, 10, 'Streaming setup', ["A ring light and a phone on a tripod.", "The red dot means it's live. Wave to chat!"]);
  npc(50, 10, { hair: '#7a54d8', skin: '#c8906a', shirt: '#2a2a38', pants: '#2a2a38' }, 'Streamer',
    ["I'm live right now! Say hi to chat!", "You rebranded the whole app: new logo, brand font and colours. Eloelo became Elo Live!", "And that custom game for the Lay's collab? Chat loved it. Take a stamp!", "Come inside the studio! Your work is up on the big screens."], 3);
  door('eloelo', 'Eloelo', ["Ring lights and cameras everywhere. Everyone is live."]);
  things[things.length - 1].enter = 'eloelo';

  npc(54, 10, { hair: '#1c1616', skin: '#c89878', shirt: '#f6f4ee', pants: '#3a4050' }, 'Nayanika',
    ["Hey Shyam! Nayanika, from the Eloelo design team.", "Still playing it safe with your colours? Go bolder. It always works out.", "And keep illustrating. A sketchbook should never be empty."], 3);
  npc(56, 13, { hair: '#1c1616', skin: '#b88660', shirt: '#e6d2a4', pants: '#3a3a4a' }, 'Vinay',
    ["Hold that pose... and cut! Vinay, on camera.", "Shubham and I handled the shoots, the edits and the motion graphics at Eloelo.", "And we never once said no to chai."], 3);
  things[things.length - 1].dir = 'up';
  npc(58, 13, { hair: '#2a2020', skin: '#b07850', shirt: '#3f5f9a', pants: '#2e2e3e' }, 'Shubham',
    ["Rolling! This one goes straight into the edit.", "A good frame is like a good layout: know where the eye goes first.", "Chai after this take? Call Debasish and Arnab."], 3);
  things[things.length - 1].dir = 'up';
  var tapriLines = ["A chai tapri. One cutting chai, extra adrak.", "Shyam's unofficial meeting room at Eloelo."];
  obj('kiosk', 56, 9, 'Chai tapri', tapriLines); obj('kiosk', 57, 9, 'Chai tapri', tapriLines);
  npc(58, 9, { hair: '#1e1a1a', skin: '#b07850', shirt: '#ffc83a', pants: '#3a4050' }, 'Debasish',
    ["Shyam! Wait, let me guess... 'Chai?'", "Every single day, like an alarm: 'Debasish, Arnab, chai?'", "And every single day we said yes. Don't tell him, but it was the best part of work."], 3);
  npc(57, 10, { hair: '#1c1616', skin: '#a8704c', shirt: '#7a54d8', pants: '#2e2e3e' }, 'Arnab',
    ["No no no. I know that face. That is the chai face.", "We have a deadline today, Shyam... okay fine. One cutting. Just one.", "It is never just one."], 3);

  sign(60, 10, 'Signpost', ["GLANCE CAMPUS", "Senior Graphic Designer, Nov 2022 – Mar 2024.", "Everything on this plaza is Glance: the tower, the Novo newsstand and the Nostra arcade."]);
  npc(68, 10, { hair: '#3a2a20', skin: '#b07850', shirt: '#23a6a0', pants: '#3a4050' }, 'Colleague',
    ["Welcome to Glance! We live on the lock screens of millions of phones.", "Novo is our news app and Nostra is our gaming side. Same company, same campus.", "You designed our annual Insight Report layouts for 2023 and 2024.", "And the 1Weather launch, 'Own the Day': 50,000 downloads in a month! You've earned this.", "Pop inside! The design team framed your work on the wall."], 4);
  obj('kiosk', 70, 9, 'Novo newsstand', ["NOVO — What's New. The news app by Glance.", "You branded it: the logo, the brand book, that bright orange.", "Article views went from 2,000 to 20,000. Click-through from 4% to 18%!"]);
  obj('kiosk', 71, 9, 'Novo newsstand', ["NOVO — What's New. The news app by Glance.", "You branded it: the logo, the brand book, that bright orange.", "Article views went from 2,000 to 20,000. Click-through from 4% to 18%!"]);
  npc(66, 14, { hair: '#1e1e28', skin: '#a06a46', shirt: '#2a5fd8', pants: '#f4f4f4', cap: '#2a5fd8' }, 'Cricket fan',
    ["FEEL THE BLUE! World Cup 2023!", "Your wallpapers honoured India's greatest World Cup batting moments.", "Live-score viewers on Glance jumped from 10 million to 50 million!"]);
  door('glance', 'Glance', ["Glass doors, big screens and a lot of cricket talk."]);
  things[things.length - 1].enter = 'glance';
  door('nostra', 'Nostra Arcade', ["Nostra, the gaming side of Glance.", "Neon lights and the sound of 500 games at once."]);
  things[things.length - 1].enter = 'nostra';

  sign(75, 10, 'Signpost', ["2024: THE BIG MOVE", "From India to Melbourne, Australia. New city, new chapter."]);

  sign(82, 10, 'Signpost', ["RMIT UNIVERSITY, MELBOURNE", "Master of Communication Design, 2024 – 2026."]);
  npc(89, 10, { hair: '#e0b050', skin: '#f0c8a0', shirt: '#e0403a', pants: '#3a4658' }, 'Classmate',
    ["G'day! Welcome to Melbourne.", "Master of Communication Design, hey? Studio crits are no joke.", "Best coffee's in the laneways. Here, you've earned this!"], 5);
  obj('graffiti', 92, 8, 'Laneway', ["A graffiti laneway.", "Perfect backdrop for a portfolio photo..."]);
  obj('graffiti', 93, 8, 'Laneway', ["A graffiti laneway.", "Perfect backdrop for a portfolio photo..."]);
  obj('tramstop', 86, 14, 'Tram stop', ["Tram stop. Don't forget to tap on!"]);
  door('rmit', 'RMIT', ["Studios, crits and a lot of coffee."]);
  things[things.length - 1].enter = 'rmit';

  sign(94, 10, 'Signpost', ["SHYAM'S STUDIO", "Now: open to visual design roles across Australia."]);
  obj('mailbox', 100 - 1, 10, 'Mailbox', ["Mail for Shyam?", "shyamhk96@gmail.com"]);
  door('studio', "Shyam's Studio", ["This is where the journey continues...", "Shyam is looking for visual design roles in Australia: brand, campaigns and digital.", "Want to be the next stop on the journey? Say hi at shyamhk96@gmail.com"], 6);


  /* ------------------------------------------------------------------ */
  /* rooms: walk-in interiors (stage 2: the Glance design floor)          */
  /* ------------------------------------------------------------------ */
  var RFLOOR = 20, RWALL = 21, RMAT = 22;
  BLOCK[RWALL] = true;
  var RC = { floor: '#e8c898', floorDk: '#d2ac78', wall: '#f4efe4', trim: '#3a4050', trimLt: '#4e566a',
             teal: '#23a6a0', tealLt: '#6cccc6', tealDk: '#15827d', wood: '#b98a5a', woodDk: '#8a5f36' };
  function makeRoom(o) {
    var t = [];
    for (var y = 0; y < o.h; y++) { t.push([]); for (var x = 0; x < o.w; x++) t[y].push((y <= 2 || y === o.h - 1 || x === 0 || x === o.w - 1) ? RWALL : RFLOOR); }
    t[o.exit.y][o.exit.x] = RMAT;
    o.tiles = t; o.things = []; o.room = true;
    return o;
  }
  var glanceRoom = makeRoom({ id: 'glance', w: 15, h: 10, exit: { x: 7, y: 9 }, back: { x: 64, y: 10 },
    name: 'Glance HQ', years: 'Design floor · 2022 – 2024',
    pieces: [ { id: 'novo', x: 2, w: 2 }, { id: 'ftb', x: 6, w: 3 }, { id: 'oneweather', x: 11, w: 2 } ] });
  (function (R) {
    function add(o) { R.things.push(o); }
    R.pieces.forEach(function (pc) {
      for (var i = 0; i < pc.w; i++) add({ kind: 'frame', x: pc.x + i, y: 2, piece: pc.id, who: 'Frame' });
    });
    function furn(xs, y, who, lines) { xs.forEach(function (x) { add({ kind: 'furn', x: x, y: y, who: who, lines: lines }); }); }
    furn([1, 2, 3], 6, 'Your old desk', ["Your old desk at Glance.", "Two monitors: one for Figma, one for the brand guidelines."]);
    furn([13], 5, 'Bookshelf', ["A shelf of Glance Annual Insight Reports.", "You designed the templates, layouts and media assets for the 2023 and 2024 editions."]);
    furn([13], 6, 'Bookshelf', ["A shelf of Glance Annual Insight Reports.", "You designed the templates, layouts and media assets for the 2023 and 2024 editions."]);
    furn([10, 11, 12], 8, 'Team sofa', ["The team sofa. Prime spot during cricket season."]);
    furn([1], 3, 'Office plant', ["A very well-watered office plant."]);
    furn([13], 3, 'Office plant', ["A very well-watered office plant."]);
    add({ kind: 'npc', id: 'lead', x: 11, y: 5, dir: 'down', turnAt: 3,
      look: { hair: '#5a3a28', skin: '#c08a64', shirt: '#23a6a0', pants: '#2e3444', glasses: true }, who: 'Design lead',
      lines: ["Welcome to the design floor!", "Everything framed on that wall shipped to millions of lock screens.", "Walk up to a frame and press A to take a closer look."] });
  })(glanceRoom);
  var arcadeRoom = makeRoom({ id: 'nostra', w: 15, h: 10, exit: { x: 7, y: 9 }, back: { x: 73, y: 10 },
    name: 'Nostra Arcade', years: 'Glance gaming · 2022 – 2024',
    pieces: [ { id: 'nostra-brand', x: 1, w: 3, label: 'BRAND', neon: '#ff4fd8' },
              { id: 'nostra-report', x: 4, w: 3, label: 'REPORT', neon: '#ff5a7a' },
              { id: 'nostra-web', x: 8, w: 3, label: 'WEB', neon: '#ffb000' },
              { id: 'nostra-social', x: 11, w: 3, label: 'SOCIAL', neon: '#38d0ff' } ] });
  (function (R) {
    function add(o) { R.things.push(o); }
    R.pieces.forEach(function (pc) {
      for (var i = 0; i < pc.w; i++) add({ kind: 'frame', x: pc.x + i, y: 2, piece: pc.id, who: 'Arcade cabinet' });
    });
    function furn(xs, y, who, lines) { xs.forEach(function (x) { add({ kind: 'furn', x: x, y: y, who: who, lines: lines }); }); }
    furn([2], 7, 'Bean bag', ["A very squishy bean bag, in Nostra pink."]);
    furn([12], 7, 'Bean bag', ["A very squishy bean bag, in Nostra blue."]);
    furn([13], 5, 'Trophy stand', ["A shelf of tournament trophies.", "Nostra ran leaderboards and tournaments right on the lock screen."]);
    add({ kind: 'npc', id: 'gamer', x: 3, y: 6, dir: 'down', turnAt: 3,
      look: { hair: '#ff4fd8', skin: '#b07850', shirt: '#5a2cc8', pants: '#1c1633', cap: '#38d0ff' }, who: 'Gamer',
      lines: ["Welcome to Nostra, the gaming side of the Glance lock screen!", "Hundreds of games, live streams and tournaments, with nothing to download.", "You worked on the brand, the trends report, the website and the socials? Try those four cabinets!"] });
  })(arcadeRoom);
  var studioRoom = makeRoom({ id: 'eloelo', w: 15, h: 10, exit: { x: 7, y: 9 }, back: { x: 52, y: 10 },
    name: 'Elo Live Studio', years: 'Eloelo · 2021 – 2022',
    pieces: [ { id: 'elo-rebrand', x: 2, w: 3, label: 'REBRAND' },
              { id: 'elo-stickers', x: 6, w: 3, label: 'STICKERS' },
              { id: 'elo-cards', x: 10, w: 3, label: 'CARDS' } ] });
  (function (R) {
    function add(o) { R.things.push(o); }
    R.pieces.forEach(function (pc) {
      for (var i = 0; i < pc.w; i++) add({ kind: 'frame', x: pc.x + i, y: 2, piece: pc.id, who: 'Stream screen' });
    });
    function furn(xs, y, who, lines) { xs.forEach(function (x) { add({ kind: 'furn', x: x, y: y, who: who, lines: lines }); }); }
    furn([1], 5, 'Ring light', ["A ring light, glowing like a halo.", "Every streamer's best friend."]);
    furn([13], 5, 'Ring light', ["Another ring light. Flattering from every angle."]);
    furn([3, 4], 7, 'Streaming desk', ["A streaming desk: mic, webcam, and a phone full of chat notifications."]);
    furn([11], 7, 'Camera', ["A camera on a tripod. The red light means you're live!"]);
    add({ kind: 'npc', id: 'mod', x: 9, y: 5, dir: 'down', turnAt: 3, look: { hair: '#2a1c16', skin: '#c8906a', shirt: '#ffc83a', pants: '#2e2e3e' }, who: 'Moderator',
      lines: ["Welcome to the Elo Live studio! I keep the chat friendly.", "Those Bollywood stickers you drew? Chat spams them all day. 'BAS!!' is a classic.", "And your share cards brought in so many new viewers. Take a look at the screens!"] });
  })(studioRoom);
  var critRoom = makeRoom({ id: 'rmit', w: 15, h: 10, exit: { x: 7, y: 9 }, back: { x: 87, y: 10 },
    name: 'RMIT Studio', years: 'Crit room · 2024 – 2026',
    pieces: [ { id: 'abyx', x: 3, w: 2 }, { id: 'buzzar', x: 6, w: 2 }, { id: 'unhappy', x: 9, w: 2 } ] });
  (function (R) {
    function add(o) { R.things.push(o); }
    R.pieces.forEach(function (pc) { for (var i = 0; i < pc.w; i++) add({ kind: 'frame', x: pc.x + i, y: 2, piece: pc.id, who: 'Pin-up' }); });
    function furn(xs, y, who, lines) { xs.forEach(function (x) { add({ kind: 'furn', x: x, y: y, who: who, lines: lines }); }); }
    furn([5, 6, 7, 8, 9], 6, 'Crit table', ["The big crit table: test prints, cutting mats and cold coffee.", "Every project on the wall was argued over right here."]);
    furn([1], 5, 'Riso printer', ["The riso printer. Three colours, one layer at a time.", "It jams when you need it most."]);
    furn([13], 5, 'Game controller', ["A game controller on a plinth.", "Four buttons, three presses, one letter. That's ABYX."]);
    furn([13], 7, 'Rice bags', ["A stack of empty rice bags.", "Too good-looking to throw away. That's how Buzzar started."]);
    add({ kind: 'npc', id: 'tutor', x: 3, y: 7, dir: 'right', turnAt: 3, look: { hair: '#5a3a28', skin: '#c08a64', shirt: '#e60028', pants: '#2e3444', glasses: true }, who: 'Tutor',
      lines: ["Welcome to the crit room. Pin it up, then tell us why.", "Three projects made it to the wall: a type system, a brand and a poster campaign.", "Walk up to one and press A to take a closer look."] });
  })(critRoom);
  var rooms = { glance: glanceRoom, nostra: arcadeRoom, eloelo: studioRoom, rmit: critRoom };

  // thumbnails of the real work, painted small into the frames
  var THUMBS = { novo: ['assets/novo-final-filled.svg'], ftb: ['assets/ftb-wall-1.webp', 'assets/ftb-wall-2.webp', 'assets/ftb-wall-3.webp'], oneweather: ['assets/1w-wall-04.jpg'],
    'nostra-brand': ['assets/nostra-bb-18.webp'], 'nostra-report': ['assets/nostra-report-1.webp'],
    'elo-rebrand': ['assets/elo-mascot.svg'], 'elo-stickers': ['assets/elo-sticker-bas.webp'], 'elo-cards': ['assets/elo-card-singing.webp'], 'nostra-web': ['assets/nostra-web-single.webp'], 'nostra-social': ['assets/nostra-soc-top5-1.webp'],
    abyx: ['assets/abyx-cover.webp'], buzzar: ['assets/buzzar-tote.webp'], unhappy: ['assets/uhm-5.webp'] };
  var thumbImg = {};
  Object.keys(THUMBS).forEach(function (k) {
    thumbImg[k] = THUMBS[k].map(function (src) {
      var im = new Image();
      im.onload = function () { im.ok = true; Object.keys(rooms).forEach(function (r) { if (rooms[r].layer) drawRoom(rooms[r]); }); };
      im.onerror = function () { im.ok = false; };
      im.src = src; return im;
    });
  });
  function cover(g, im, x, y, w, h) {
    if (!im || !im.ok) return false;
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, s = Math.max(w / iw, h / ih);
    var sw = w / s, sh = h / s;
    g.imageSmoothingEnabled = true;
    g.drawImage(im, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
    g.imageSmoothingEnabled = false;
    return true;
  }
  function contain(g, im, x, y, w, h) {
    if (!im || !im.ok) return false;
    var iw = im.naturalWidth || im.width, ih = im.naturalHeight || im.height, s = Math.min(w / iw, h / ih);
    g.imageSmoothingEnabled = true;
    g.drawImage(im, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s);
    g.imageSmoothingEnabled = false;
    return true;
  }

  function drawRoom(R) {
    if (!R.layer) { R.layer = document.createElement('canvas'); R.layer.width = R.w * T; R.layer.height = R.h * T; }
    var g = R.layer.getContext('2d'); g.imageSmoothingEnabled = false;
    if (R.id === 'nostra') return drawArcade(R, g);
    if (R.id === 'eloelo') return drawStudio(R, g);
    if (R.id === 'rmit') return drawCrit(R, g);
    var W = R.w * T, H = R.h * T, x, y;
    // wooden floor
    px(g, 0, 0, W, H, RC.floor);
    for (y = 0; y < H; y += 4) {
      px(g, 0, y + 3, W, 1, RC.floorDk);
      for (x = (y / 4) % 2 ? 11 : 23; x < W; x += 24) px(g, x, y, 1, 3, RC.floorDk);
    }
    // teal rug
    px(g, 71, 67, 98, 54, P.ink); px(g, 72, 68, 96, 52, RC.teal);
    px(g, 75, 71, 90, 46, RC.tealLt); px(g, 77, 73, 86, 42, RC.teal);
    for (x = 84; x < 160; x += 12) { px(g, x, 90, 5, 5, RC.tealLt); }
    // back wall
    px(g, 0, 0, W, 48, RC.wall);
    for (x = 8; x < W; x += 16) px(g, x, 7, 1, 30, '#ebe4d6');
    px(g, 0, 0, W, 6, RC.trim); px(g, 0, 6, W, 1, P.ink);
    px(g, 0, 37, W, 1, RC.tealDk); px(g, 0, 38, W, 9, RC.teal); px(g, 0, 40, W, 1, RC.tealLt);
    px(g, 0, 47, W, 1, P.ink); px(g, 0, 48, W, 3, 'rgba(40,48,64,0.16)');
    // side and front walls
    px(g, 0, 0, T, H, RC.trim); px(g, T - 2, 7, 2, H - 7, RC.trimLt); px(g, T, 7, 1, H - T - 7, P.ink);
    px(g, W - T, 0, T, H, RC.trim); px(g, W - T, 7, 2, H - 7, RC.trimLt); px(g, W - T - 1, 7, 1, H - T - 7, P.ink);
    px(g, 0, H - T, W, T, RC.trim); px(g, T, H - T - 1, W - 2 * T, 1, P.ink); px(g, 0, H - T, W, 2, RC.trimLt);
    // door mat
    var mx = R.exit.x * T, my = R.exit.y * T;
    px(g, mx, my - 1, T, T + 1, RC.floor);
    px(g, mx + 1, my + 1, 14, 13, P.ink); px(g, mx + 2, my + 2, 12, 11, '#c0503c');
    for (x = 0; x < 3; x++) px(g, mx + 4 + x * 3, my + 4, 1, 7, '#e2785e');
    // wall sign, clock
    signBoard(g, 'GLANCE', 5 * T, 16, '#ffffff', RC.tealDk);
    g.fillStyle = P.ink; blob(g, 160, 20, 7, 7); g.fillStyle = P.white; blob(g, 160, 20, 6, 6);
    px(g, 159, 15, 1, 6, P.ink); px(g, 159, 20, 4, 1, P.ink);
    // framed work
    R.pieces.forEach(function (pc) {
      var fx = pc.x * T + 2, fy = 10, fw = pc.w * T - 4, fh = 32;
      px(g, fx + 2, fy + 2, fw, fh, 'rgba(40,48,64,0.25)');
      px(g, fx - 1, fy - 1, fw + 2, fh + 2, P.ink);
      px(g, fx, fy, fw, fh, '#2e2a26'); px(g, fx + 1, fy + 1, fw - 2, fh - 2, P.white);
      var ix = fx + 3, iy = fy + 3, iw = fw - 6, ih = fh - 6, ims = thumbImg[pc.id];
      if (pc.id === 'novo') { px(g, ix, iy, iw, ih, '#ff4f00'); contain(g, ims[0], ix + 2, iy + 4, iw - 4, ih - 8); }
      else if (pc.id === 'ftb') {
        px(g, ix, iy, iw, ih, '#3c3cc8');
        var pw = Math.floor((iw - 4) / 3);
        for (var k = 0; k < 3; k++) { var qx = ix + 1 + k * (pw + 1); px(g, qx, iy + 1, pw, ih - 2, P.ink); contain(g, ims[k], qx, iy + 1, pw, ih - 2); }
      } else { px(g, ix, iy, iw, ih, '#86c4ec'); cover(g, ims[0], ix, iy, iw, ih); }
      px(g, fx + fw / 2 - 4, fy + fh + 2, 8, 3, P.ink); px(g, fx + fw / 2 - 3, fy + fh + 2, 6, 2, P.butter);   // name plate
    });
    // plants
    [[1, 3], [13, 3]].forEach(function (q) {
      var X = q[0] * T, Y = q[1] * T;
      px(g, X + 4, Y + 9, 8, 6, P.ink); px(g, X + 5, Y + 10, 6, 4, '#c8704a');
      g.fillStyle = P.ink; blob(g, X + 8, Y + 5, 7, 6); g.fillStyle = P.leaf; blob(g, X + 8, Y + 5, 6, 5);
      g.fillStyle = P.leafLt; blob(g, X + 6, Y + 3, 2, 2);
    });
    // desk with two monitors
    var dx = 1 * T + 1, dy = 6 * T;
    px(g, dx - 1, dy - 1, 3 * T, 16, P.ink); px(g, dx, dy, 3 * T - 2, 10, RC.wood); px(g, dx, dy + 10, 3 * T - 2, 4, RC.woodDk);
    [[dx + 5, '#ff4f00'], [dx + 24, '#3c3cc8']].forEach(function (m) {
      px(g, m[0] - 1, dy - 7, 16, 11, P.ink); px(g, m[0], dy - 6, 14, 8, m[1]); px(g, m[0] + 1, dy - 5, 4, 1, 'rgba(255,255,255,0.6)');
      px(g, m[0] + 6, dy + 3, 2, 2, P.ink);
    });
    px(g, dx + 10, dy + 6, 14, 3, P.ink); px(g, dx + 11, dy + 6, 12, 2, '#dfe3ea');
    // bookshelf of Insight Reports
    var sx = 13 * T + 1, sy = 5 * T - 4;
    px(g, sx - 1, sy - 1, 15, 36, P.ink); px(g, sx, sy, 13, 34, RC.woodDk);
    ['#23a6a0', '#ffe08f', '#ff7d75', '#928cf8', '#23a6a0', '#ffffff'].forEach(function (c, i) {
      var row = i < 3 ? 0 : 1, col = i % 3;
      px(g, sx + 1 + col * 4, sy + 3 + row * 16, 3, 12, c);
    });
    px(g, sx, sy + 16, 13, 1, P.ink);
    // team sofa
    var fx2 = 10 * T, fy2 = 8 * T;
    px(g, fx2 - 1, fy2 + 1, 3 * T + 2, 15, P.ink); px(g, fx2, fy2 + 2, 3 * T, 13, RC.tealDk);
    px(g, fx2 + 4, fy2 + 2, 3 * T - 8, 7, RC.tealLt); px(g, fx2 + 3 + T, fy2 + 2, 1, 7, RC.tealDk); px(g, fx2 + 3 + 2 * T - 4, fy2 + 2, 1, 7, RC.tealDk);
  }

  // the Nostra Arcade: dark floor, neon trim and three cabinets showing the work
  function drawCrit(R, g) {
    var W = R.w * T, H = R.h * T, x, y, RED = '#e60028', FL = '#d9d6d0', FLD = '#c6c2ba';
    px(g, 0, 0, W, H, FL);                                   // polished concrete
    for (y = 48; y < H; y += 32) px(g, 0, y, W, 1, FLD);
    for (x = 40; x < W; x += 48) px(g, x, 48, 1, H, FLD);
    px(g, 0, 0, W, 48, '#fbfaf6');                           // white pin-up wall with a red band
    px(g, 0, 0, W, 6, '#283040'); px(g, 0, 6, W, 1, P.ink);
    px(g, 0, 42, W, 5, RED); px(g, 0, 47, W, 1, P.ink); px(g, 0, 48, W, 3, 'rgba(40,48,64,0.16)');
    px(g, 0, 0, T, H, '#283040'); px(g, T - 2, 7, 2, H - 7, '#3a4458'); px(g, T, 7, 1, H - T - 7, P.ink);
    px(g, W - T, 0, T, H, '#283040'); px(g, W - T, 7, 2, H - 7, '#3a4458'); px(g, W - T - 1, 7, 1, H - T - 7, P.ink);
    px(g, 0, H - T, W, T, '#283040'); px(g, T, H - T - 1, W - 2 * T, 1, P.ink); px(g, 0, H - T, W, 2, '#3a4458');
    var mx = R.exit.x * T, my = R.exit.y * T;
    px(g, mx, my - 1, T, T + 1, FL); px(g, mx + 1, my + 1, 14, 13, P.ink); px(g, mx + 2, my + 2, 12, 11, RED);
    for (x = 0; x < 3; x++) px(g, mx + 4 + x * 3, my + 4, 1, 7, '#ff8a96');
    // pinned-up work: paper sheets held by tape
    var BG = { abyx: '#ffffff', buzzar: '#d9a520', unhappy: '#d01f27' };
    R.pieces.forEach(function (pc) {
      var fx = pc.x * T + 3, fy = 9, fw = pc.w * T - 6, fh = 31;
      px(g, fx + 2, fy + 2, fw, fh, 'rgba(40,48,64,0.2)');
      px(g, fx - 1, fy - 1, fw + 2, fh + 2, P.ink); px(g, fx, fy, fw, fh, BG[pc.id]);
      if (pc.id === 'abyx') contain(g, thumbImg[pc.id][0], fx + 1, fy + 1, fw - 2, fh - 2); else cover(g, thumbImg[pc.id][0], fx, fy, fw, fh);
      px(g, fx + 3, fy - 3, 6, 4, 'rgba(255,224,143,0.9)'); px(g, fx + fw - 9, fy - 3, 6, 4, 'rgba(255,224,143,0.9)');
    });
    // crit table with prints, a cutting mat and coffee
    var tx = 5 * T, ty = 6 * T;
    px(g, tx - 1, ty - 3, 5 * T + 2, 19, P.ink); px(g, tx, ty - 2, 5 * T, 13, '#f1ece2'); px(g, tx, ty + 11, 5 * T, 4, '#b9b2a4');
    px(g, tx + 4, ty, 14, 9, '#2f8f6a'); px(g, tx + 5, ty + 1, 12, 7, '#3fae84');
    px(g, tx + 24, ty - 1, 10, 9, '#ffffff'); px(g, tx + 25, ty + 1, 8, 1, P.ink); px(g, tx + 25, ty + 3, 6, 1, RED);
    px(g, tx + 38, ty + 1, 11, 8, '#ffe08f'); px(g, tx + 40, ty + 3, 7, 1, P.ink);
    px(g, tx + 54, ty, 9, 9, '#d01f27'); px(g, tx + 56, ty + 2, 5, 3, '#ffd21f');
    px(g, tx + 68, ty + 2, 6, 6, P.ink); px(g, tx + 69, ty + 3, 4, 4, '#6b4a2e');
    // riso printer
    var rx = T, ry = 5 * T;
    px(g, rx, ry - 4, 15, 19, P.ink); px(g, rx + 1, ry - 3, 13, 17, '#e4e6ea'); px(g, rx + 1, ry + 6, 13, 8, '#b9bdc6');
    px(g, rx + 3, ry - 1, 9, 4, '#283040'); px(g, rx + 4, ry, 2, 2, RED); px(g, rx + 3, ry + 8, 9, 2, '#ffffff');
    // controller on a plinth
    var cx = 13 * T, cy = 5 * T;
    px(g, cx + 2, cy + 2, 12, 13, P.ink); px(g, cx + 3, cy + 3, 10, 11, '#ffffff');
    px(g, cx + 1, cy - 4, 14, 8, P.ink); px(g, cx + 2, cy - 3, 12, 6, '#eef0f4');
    px(g, cx + 10, cy - 2, 1, 1, '#ffd21f'); px(g, cx + 9, cy - 1, 1, 1, '#3d9bff'); px(g, cx + 11, cy - 1, 1, 1, '#ff4b3e'); px(g, cx + 10, cy, 1, 1, '#6ad24a');
    px(g, cx + 4, cy - 1, 2, 2, P.ink);
    // rice bags
    var bx = 13 * T, by = 7 * T;
    [['#d01f27', 0], ['#7a2c8a', 5], ['#e0a820', 10]].forEach(function (b) {
      px(g, bx + 1 + (b[1] ? 1 : 0), by + 10 - b[1], 13, 6, P.ink); px(g, bx + 2 + (b[1] ? 1 : 0), by + 11 - b[1], 11, 4, b[0]); px(g, bx + 5, by + 12 - b[1], 5, 1, '#ffffff');
    });
    // stools
    [[4, 6], [10, 6], [6, 7], [8, 7]].forEach(function (s) { var X = s[0] * T + 4, Y = s[1] * T + 5 + (s[1] === 7 ? 0 : -1); px(g, X, Y, 8, 6, P.ink); px(g, X + 1, Y + 1, 6, 3, RED); });
  }
  function drawArcade(R, g) {
    var W = R.w * T, H = R.h * T, x, y, AC = { floor: '#1c1633', grid: '#2a2150', wall: '#2a1f4d', trim: '#141026', trimLt: '#2e2552' };
    px(g, 0, 0, W, H, AC.floor);
    for (x = 0; x < W; x += 8) px(g, x, 48, 1, H - 48, AC.grid);
    for (y = 48; y < H; y += 8) px(g, 0, y, W, 1, AC.grid);
    // glowing ring on the floor
    g.fillStyle = '#5a2cc8'; blob(g, 120, 100, 34, 14); g.fillStyle = AC.floor; blob(g, 120, 100, 31, 12);
    // back wall with neon strips
    px(g, 0, 0, W, 48, AC.wall);
    px(g, 0, 0, W, 6, AC.trim); px(g, 0, 6, W, 1, P.ink);
    px(g, 0, 38, W, 2, '#ff4fd8'); px(g, 0, 42, W, 2, '#38d0ff');
    px(g, 0, 47, W, 1, P.ink); px(g, 0, 48, W, 3, 'rgba(0,0,0,0.3)');
    // side and front walls
    px(g, 0, 0, T, H, AC.trim); px(g, T - 2, 7, 2, H - 7, AC.trimLt); px(g, T, 7, 1, H - T - 7, P.ink);
    px(g, W - T, 0, T, H, AC.trim); px(g, W - T, 7, 2, H - 7, AC.trimLt); px(g, W - T - 1, 7, 1, H - T - 7, P.ink);
    px(g, 0, H - T, W, T, AC.trim); px(g, T, H - T - 1, W - 2 * T, 1, P.ink); px(g, 0, H - T, W, 2, AC.trimLt);
    var mx = R.exit.x * T, my = R.exit.y * T;
    px(g, mx, my - 1, T, T + 1, AC.floor);
    px(g, mx + 1, my + 1, 14, 13, P.ink); px(g, mx + 2, my + 2, 12, 11, '#ff4fd8');
    for (x = 0; x < 3; x++) px(g, mx + 4 + x * 3, my + 4, 1, 7, '#ffb0ee');
    // the four-dot mark between cabinets, in neon
    [[7 * T + 8, 20]].forEach(function (c) {
      [[0, -5, '#ff1a66'], [-5, 0, '#ff00ff'], [5, 0, '#ffb000'], [0, 5, '#00c3ff']].forEach(function (d) {
        g.fillStyle = P.ink; blob(g, c[0] + d[0], c[1] + d[1], 3, 3); g.fillStyle = d[2]; blob(g, c[0] + d[0], c[1] + d[1], 2, 2);
      });
    });
    // arcade cabinets
    R.pieces.forEach(function (pc) {
      var cx = pc.x * T + 4, cw = pc.w * T - 8;
      px(g, cx + 2, 8, cw, 42, 'rgba(0,0,0,0.35)');
      px(g, cx - 1, 3, cw + 2, 46, P.ink);
      px(g, cx, 4, cw, 44, '#3a2d6b'); px(g, cx, 4, 2, 44, '#4e3f8a'); px(g, cx + cw - 2, 4, 2, 44, '#2a2150');
      px(g, cx + 2, 5, cw - 4, 9, pc.neon); px(g, cx + 2, 13, cw - 4, 1, P.ink);                  // marquee
      drawText(g, pc.label, Math.round(cx + cw / 2 - textW(pc.label) / 2), 7, '#1c1633');
      var sx = cx + 4, sy = 16, sw = cw - 8, sh = 20;                                            // screen
      px(g, sx - 1, sy - 1, sw + 2, sh + 2, P.ink); px(g, sx, sy, sw, sh, '#120e24');
      cover(g, thumbImg[pc.id] && thumbImg[pc.id][0], sx, sy, sw, sh);
      px(g, sx, sy, sw, 1, 'rgba(255,255,255,0.25)');
      px(g, cx + 1, 38, cw - 2, 7, '#2a2150'); px(g, cx + 1, 38, cw - 2, 1, P.ink);                // control panel
      px(g, cx + 8, 39, 2, 4, P.ink); px(g, cx + 7, 38, 4, 2, '#ff1a66');                          // joystick
      px(g, cx + cw - 14, 40, 3, 3, '#ffb000'); px(g, cx + cw - 9, 40, 3, 3, '#00c3ff');           // buttons
    });
    // bean bags and the trophy stand
    [[2, 7, '#ff4fd8'], [12, 7, '#38d0ff']].forEach(function (b2) {
      var X = b2[0] * T, Y = b2[1] * T;
      g.fillStyle = P.ink; blob(g, X + 8, Y + 9, 8, 6); g.fillStyle = b2[2]; blob(g, X + 8, Y + 9, 7, 5);
      g.fillStyle = 'rgba(255,255,255,0.35)'; blob(g, X + 6, Y + 7, 2, 1);
    });
    var tx = 13 * T + 1, ty = 5 * T - 2;
    px(g, tx - 1, ty - 1, 15, 20, P.ink); px(g, tx, ty, 13, 18, '#3a2d6b');
    [[tx + 2, ty + 3], [tx + 7, ty + 3], [tx + 4, ty + 11]].forEach(function (c) { px(g, c[0], c[1], 4, 3, P.butter); px(g, c[0] + 1, c[1] + 3, 2, 2, '#c8a040'); });
  }

  // the Elo Live studio: purple walls, ring lights, ON AIR sign, work on stream screens
  function drawStudio(R, g) {
    var W = R.w * T, H = R.h * T, x, y, SC = { floor: '#c4b6f0', floorDk: '#b3a3e8', wall: '#4b2f9e', wallDk: '#3a2380', trim: '#1e1640', trimLt: '#2c2256', yellow: '#ffc83a', red: '#ff3b3b' };
    px(g, 0, 0, W, H, SC.floor);
    for (y = 48; y < H; y += 16) for (x = ((y / 16) % 2) * 16; x < W; x += 32) px(g, x, y, 16, 16, SC.floorDk);
    // yellow rug under the desk area
    px(g, 39, 99, 50, 34, P.ink); px(g, 40, 100, 48, 32, SC.yellow); px(g, 43, 103, 42, 26, '#ffd76a');
    // back wall with acoustic foam panels
    px(g, 0, 0, W, 48, SC.wall);
    for (x = 20; x < W - 20; x += 8) for (y = 10; y < 34; y += 8) { px(g, x, y, 7, 7, SC.wallDk); px(g, x, y, 7, 1, '#5c3db8'); }
    px(g, 0, 0, W, 6, SC.trim); px(g, 0, 6, W, 1, P.ink);
    px(g, 0, 40, W, 7, SC.yellow); px(g, 0, 40, W, 1, '#ffe08f'); px(g, 0, 47, W, 1, P.ink); px(g, 0, 48, W, 3, 'rgba(0,0,0,0.3)');
    // side and front walls
    px(g, 0, 0, T, H, SC.trim); px(g, T - 2, 7, 2, H - 7, SC.trimLt); px(g, T, 7, 1, H - T - 7, P.ink);
    px(g, W - T, 0, T, H, SC.trim); px(g, W - T, 7, 2, H - 7, SC.trimLt); px(g, W - T - 1, 7, 1, H - T - 7, P.ink);
    px(g, 0, H - T, W, T, SC.trim); px(g, T, H - T - 1, W - 2 * T, 1, P.ink); px(g, 0, H - T, W, 2, SC.trimLt);
    var mx = R.exit.x * T, my = R.exit.y * T;
    px(g, mx, my - 1, T, T + 1, SC.floor);
    px(g, mx + 1, my + 1, 14, 13, P.ink); px(g, mx + 2, my + 2, 12, 11, SC.yellow);
    for (x = 0; x < 3; x++) px(g, mx + 4 + x * 3, my + 4, 1, 7, '#e0a820');
    // ON AIR sign between the first two screens
    px(g, 5 * T + 1, 13, 14, 8, P.ink); px(g, 5 * T + 2, 14, 12, 6, SC.red);
    drawText(g, 'ON', 5 * T + 4, 14.5 | 0, '#ffffff');
    // stream screens
    R.pieces.forEach(function (pc) {
      var fx = pc.x * T + 2, fy = 8, fw = pc.w * T - 4, fh = 30, ims = thumbImg[pc.id];
      px(g, fx + 2, fy + 2, fw, fh, 'rgba(0,0,0,0.35)');
      px(g, fx - 1, fy - 1, fw + 2, fh + 2, P.ink); px(g, fx, fy, fw, fh, '#15102a');
      var ix = fx + 2, iy = fy + 2, iw = fw - 4, ih = fh - 9;
      if (pc.id === 'elo-rebrand') { px(g, ix, iy, iw, ih, '#ff9d2e'); contain(g, ims && ims[0], ix + 2, iy + 1, iw - 4, ih - 2); }
      else if (pc.id === 'elo-stickers') { px(g, ix, iy, iw, ih, '#fff8ec'); contain(g, ims && ims[0], ix + 1, iy + 1, iw - 2, ih - 2); }
      else { px(g, ix, iy, iw, ih, '#0f9a9a'); cover(g, ims && ims[0], ix, iy, iw, ih); }
      px(g, ix, iy + ih, iw, 7, '#221a40');
      drawText(g, pc.label, Math.round(fx + fw / 2 - textW(pc.label) / 2), iy + ih + 1, '#ffffff');
      px(g, ix + 1, iy + 1, 5, 3, SC.red); px(g, ix + 2, iy + 2, 1, 1, '#ffffff');   // LIVE badge
    });
    // ring lights on stands
    [[1, 5], [13, 5]].forEach(function (q) {
      var X = q[0] * T + 8, Y = q[1] * T;
      px(g, X - 1, Y + 6, 2, 10, P.ink); px(g, X - 4, Y + 15, 8, 1, P.ink);
      g.fillStyle = P.ink; blob(g, X, Y + 1, 7, 7); g.fillStyle = '#fff6d0'; blob(g, X, Y + 1, 6, 6);
      g.fillStyle = P.ink; blob(g, X, Y + 1, 3, 3); g.fillStyle = SC.wallDk; blob(g, X, Y + 1, 2, 2);
    });
    // streaming desk with mic and monitor
    var dx = 3 * T, dy = 7 * T;
    px(g, dx - 1, dy - 1, 2 * T + 2, 14, P.ink); px(g, dx, dy, 2 * T, 9, '#8a5f36'); px(g, dx, dy + 9, 2 * T, 3, '#6a4526');
    px(g, dx + 4, dy - 8, 14, 10, P.ink); px(g, dx + 5, dy - 7, 12, 7, '#7a54d8'); px(g, dx + 6, dy - 6, 3, 1, 'rgba(255,255,255,0.6)'); px(g, dx + 10, dy + 2, 2, 1, P.ink);
    px(g, dx + 22, dy - 6, 4, 6, P.ink); px(g, dx + 23, dy - 5, 2, 4, '#9aa0b4'); px(g, dx + 23, dy, 2, 3, P.ink);
    // camera on a tripod
    var cx2 = 11 * T + 8, cy2 = 7 * T;
    px(g, cx2 - 6, cy2 + 1, 11, 7, P.ink); px(g, cx2 - 5, cy2 + 2, 9, 5, '#3a3a4a'); px(g, cx2 + 4, cy2 + 3, 3, 3, P.ink);
    px(g, cx2 - 3, cy2 + 2, 1, 1, SC.red);
    px(g, cx2 - 1, cy2 + 8, 2, 6, P.ink); px(g, cx2 - 5, cy2 + 13, 1, 3, P.ink); px(g, cx2 + 4, cy2 + 13, 1, 3, P.ink);
  }
  var world = { id: 'world', w: MW, h: MH, tiles: map, things: things, layer: null };
  var cur = world;
  function thingAt(x, y) {
    var list = cur.things;
    for (var i = 0; i < list.length; i++) if (list[i].x === x && list[i].y === y) return list[i];
    return null;
  }
  function blocked(x, y) {
    if (x < 0 || y < 0 || x >= cur.w || y >= cur.h) return true;
    if (BLOCK[cur.tiles[y][x]]) return true;
    var t = thingAt(x, y);
    return !!(t && !t.invisible);
  }

  /* ------------------------------------------------------------------ */
  /* tile art (pre-rendered once into a big static layer)                 */
  /* ------------------------------------------------------------------ */
  var layer = document.createElement('canvas');
  world.layer = layer;
  layer.width = MW * T; layer.height = MH * T;
  var L = layer.getContext('2d');
  L.imageSmoothingEnabled = false;
  function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }

  function grassTile(g, X, Y, tx, ty) {
    px(g, X, Y, T, T, P.grass);
    for (var k = 0; k < 5; k++) {
      var r = hash(tx * 7 + k, ty * 13 + k);
      var bx = X + Math.floor(r * 14), by = Y + Math.floor(hash(tx + k * 3, ty - k) * 14);
      px(g, bx, by, 1, 2, P.grassDk); px(g, bx + 1, by + 1, 1, 1, P.grassDk);
    }
    if (hash(tx, ty * 3) > 0.7) px(g, X + 3 + Math.floor(hash(ty, tx) * 9), Y + 4, 2, 1, P.grassLt);
  }
  function pathTile(g, X, Y, tx, ty) {
    px(g, X, Y, T, T, P.path);
    for (var k = 0; k < 4; k++) px(g, X + Math.floor(hash(tx + k, ty * 5) * 15), Y + Math.floor(hash(ty + k, tx * 3) * 15), 1, 1, P.pathDk);
    var t;
    t = tileAt(tx, ty - 1); if (!isPathy(t)) px(g, X, Y, T, 1, P.pathEdge);
    t = tileAt(tx, ty + 1); if (!isPathy(t)) px(g, X, Y + T - 1, T, 1, P.pathEdge);
    t = tileAt(tx - 1, ty); if (!isPathy(t)) px(g, X, Y, 1, T, P.pathEdge);
    t = tileAt(tx + 1, ty); if (!isPathy(t)) px(g, X + T - 1, Y, 1, T, P.pathEdge);
  }
  function tileAt(x, y) { return (x < 0 || y < 0 || x >= MW || y >= MH) ? TREE : map[y][x]; }
  function isPathy(t) { return t === PATH || t === BUILD || t === BRIDGE || t === STONE || t === TRACK; }
  function treeBlock(g, X, Y) {        // a 32×32 tree drawn on even tiles
    px(g, X + 13, Y + 22, 6, 8, P.trunk); px(g, X + 13, Y + 22, 1, 8, '#6a4226');
    g.fillStyle = P.ink;
    blob(g, X + 16, Y + 13, 14, 12);
    g.fillStyle = P.leaf; blob(g, X + 16, Y + 13, 13, 11);
    g.fillStyle = P.leafMd; blob(g, X + 14, Y + 11, 10, 8);
    g.fillStyle = P.leafLt; blob(g, X + 11, Y + 8, 4, 3); blob(g, X + 19, Y + 10, 3, 2);
    px(g, X + 7, Y + 26, 18, 2, 'rgba(40,48,64,0.18)');
  }
  function blob(g, cx, cy, rx, ry) {   // chunky pixel ellipse
    for (var j = -ry; j <= ry; j++) {
      var w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry)));
      g.fillRect(cx - w, cy + j, w * 2, 1);
    }
  }
  function waterTile(g, X, Y, tx, ty) {
    px(g, X, Y, T, T, P.water);
    for (var k = 0; k < 3; k++) {
      var wx = X + Math.floor(hash(tx + k, ty * 7) * 11), wy = Y + 3 + k * 5;
      px(g, wx, wy, 4, 1, P.waterLt);
    }
    if (tileAt(tx - 1, ty) !== WATER && tileAt(tx - 1, ty) !== BRIDGE) px(g, X, Y, 2, T, P.waterDk);
    if (tileAt(tx + 1, ty) !== WATER && tileAt(tx + 1, ty) !== BRIDGE) px(g, X + T - 2, Y, 2, T, P.waterDk);
  }
  function drawTile(g, t, tx, ty) {
    var X = tx * T, Y = ty * T;
    switch (t) {
      case PATH: pathTile(g, X, Y, tx, ty); break;
      case WATER: waterTile(g, X, Y, tx, ty); break;
      case FLOWER:
        grassTile(g, X, Y, tx, ty);
        var fc = hash(tx, ty) > 0.95 ? P.white : P.red;
        [[3, 4], [10, 9], [5, 11]].forEach(function (f) {
          px(g, X + f[0], Y + f[1] - 1, 1, 1, fc); px(g, X + f[0] - 1, Y + f[1], 3, 1, fc); px(g, X + f[0], Y + f[1] + 1, 1, 1, fc);
          px(g, X + f[0], Y + f[1], 1, 1, '#ffd84a');
        });
        break;
      case TALL:
        px(g, X, Y, T, T, P.leafMd);
        for (var k = 0; k < 4; k++) {
          var bx = X + 1 + k * 4;
          px(g, bx, Y + 6, 1, 8, P.leaf); px(g, bx + 1, Y + 4, 1, 10, P.leaf); px(g, bx + 2, Y + 7, 1, 7, P.leaf);
          px(g, bx + 1, Y + 4, 1, 2, P.leafLt);
        }
        break;
      case FENCE:
        grassTile(g, X, Y, tx, ty);
        px(g, X, Y + 6, T, 2, P.plank); px(g, X, Y + 10, T, 2, P.plank);
        px(g, X, Y + 8, T, 1, P.plankDk); px(g, X, Y + 12, T, 1, P.plankDk);
        px(g, X + 2, Y + 3, 3, 12, P.plank); px(g, X + 11, Y + 3, 3, 12, P.plank);
        px(g, X + 2, Y + 14, 3, 1, P.plankDk); px(g, X + 11, Y + 14, 3, 1, P.plankDk);
        break;
      case BRIDGE:
        waterTile(g, X, Y, tx, ty);
        px(g, X, Y, T, T, P.plank);
        for (var pl = 0; pl < 4; pl++) px(g, X + pl * 4 + 3, Y, 1, T, P.plankDk);
        if (tileAt(tx, ty - 1) !== BRIDGE) { px(g, X, Y, T, 2, P.plankDk); px(g, X, Y + 2, T, 1, P.ink); }
        if (tileAt(tx, ty + 1) !== BRIDGE) { px(g, X, Y + T - 2, T, 2, P.plankDk); px(g, X, Y + T - 3, T, 1, P.ink); }
        break;
      case PLAZA:
        px(g, X, Y, T, T, '#f1e4e0');
        px(g, X, Y + 15, T, 1, '#dcc8c6'); px(g, X + 15, Y, 1, T, '#dcc8c6');
        if ((tx + ty) % 2 === 0) px(g, X, Y, 15, 15, '#f6ece8');
        if (tileAt(tx, ty + 1) === PATH) px(g, X, Y + 14, T, 2, '#e8203c');   // red kerb along the road
        break;
      case STONE:
        px(g, X, Y, T, T, P.stone);
        px(g, X, Y + 7, T, 1, P.stoneDk); px(g, X, Y + 15, T, 1, P.stoneDk);
        px(g, X + ((ty % 2) ? 4 : 11), Y, 1, 7, P.stoneDk); px(g, X + ((ty % 2) ? 11 : 4), Y + 8, 1, 7, P.stoneDk);
        px(g, X + 1, Y + 1, 2, 1, P.stoneLt);
        break;
      case TRACK:
        drawTile(g, STONE, tx, ty);
        for (var tie = 0; tie < 4; tie++) px(g, X + tie * 4 + 1, Y + 3, 2, 10, P.plankDk);
        px(g, X, Y + 4, T, 2, P.rail); px(g, X, Y + 10, T, 2, P.rail);
        px(g, X, Y + 4, T, 1, P.stoneLt); px(g, X, Y + 10, T, 1, P.stoneLt);
        break;
      case FIELD:
        px(g, X, Y, T, T, (tx % 2) ? P.field : P.fieldDk);
        break;
      case PITCH:
        px(g, X, Y, T, T, P.pitch); px(g, X, Y + 2, T, 1, P.white); px(g, X, Y + 13, T, 1, P.white);
        if (tileAt(tx - 1, ty) !== PITCH) { px(g, X + 2, Y + 5, 1, 6, '#b08850'); px(g, X + 4, Y + 5, 1, 6, '#b08850'); }
        if (tileAt(tx + 1, ty) !== PITCH) { px(g, X + 11, Y + 5, 1, 6, '#b08850'); px(g, X + 13, Y + 5, 1, 6, '#b08850'); }
        break;
      case GRAFF:
        px(g, X, Y, T, T, P.brick);
        for (var r = 0; r < 4; r++) px(g, X, Y + r * 4 + 3, T, 1, P.mortar);
        var cols = ['#ff4fa0', '#38d0ff', '#ffe04a', '#8a5cff', '#44e07a'];
        for (var s = 0; s < 3; s++) {
          g.fillStyle = cols[Math.floor(hash(tx + s, ty * 2 + s) * cols.length)];
          blob(g, X + 3 + Math.floor(hash(tx * 3 + s, ty) * 10), Y + 3 + Math.floor(hash(ty * 5 + s, tx) * 10), 3, 2);
        }
        break;
      case TREE:
      case BUILD:
      case G:
      default:
        grassTile(g, X, Y, tx, ty);
    }
  }

  /* tiny pixel font for signs (5px tall, variable width) */
  var FONT = {
    g: ['....', '.###', '#..#', '#..#', '.###', '...#', '.##.'], l: ['#', '#', '#', '#', '#'], a: ['....', '.###', '#..#', '#..#', '.###'],
    n: ['...', '##.', '#.#', '#.#', '#.#'], c: ['...', '.##', '#..', '#..', '.##'], e: ['....', '.##.', '####', '#...', '.###'],
    A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['###', '#..', '#..', '#..', '###'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
    G: ['###', '#..', '#.#', '#.#', '###'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
    K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'], M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'],
    N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['###', '#.#', '#.#', '#.#', '###'], P: ['###', '#.#', '###', '#..', '#..'],
    R: ['##.', '#.#', '##.', '#.#', '#.#'], S: ['###', '#..', '###', '..#', '###'], T: ['###', '.#.', '.#.', '.#.', '.#.'],
    U: ['#.#', '#.#', '#.#', '#.#', '###'], V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], "'": ['#', '#', '.', '.', '.'], ' ': ['..', '..', '..', '..', '..'], '.': ['.', '.', '.', '.', '#']
  };
  function textW(s) { var w = 0; for (var i = 0; i < s.length; i++) w += (FONT[s[i]] || FONT[' '])[0].length + (i ? 1 : 0); return w; }
  function drawText(g, s, x, y, c) {
    g.fillStyle = c;
    for (var i = 0; i < s.length; i++) {
      var gl = FONT[s[i]] || FONT[' '];
      for (var r = 0; r < gl.length; r++) for (var k = 0; k < gl[r].length; k++) if (gl[r][k] === '#') g.fillRect(x + k, y + r, 1, 1);
      x += gl[0].length + 1;
    }
  }
  function signBoard(g, text, cx, y, bg, fg) {   // an outlined name board, centred on cx
    var w = textW(text) + 6, x = Math.round(cx - w / 2);
    px(g, x - 1, y - 1, w + 2, 11, P.ink); px(g, x, y, w, 9, bg);
    px(g, x, y + 8, w, 1, shade(bg, -0.18));
    drawText(g, text, x + 3, y + 2, fg);
  }

  function roofShape(g, b) {
    var X = b.x * T, Y = b.y * T, W = b.w * T;
    var roofRows = b.style === 'tower' ? 2 : b.style === 'uni' || b.style === 'brick' ? 3 : 2;
    if (b.style === 'kiosk') roofRows = 1;
    var RH = roofRows * T;
    var dark = shade(b.roof, -0.28), light = shade(b.roof, 0.22);
    px(g, X - 1, Y + 1, W + 2, RH + 2, P.ink);
    px(g, X, Y + 2, W, RH - 2, b.roof);
    for (var ry = Y + 6; ry < Y + RH - 2; ry += 5) px(g, X, ry, W, 1, dark);
    px(g, X, Y + 2, W, 2, light);
    px(g, X - 2, Y + RH - 2, W + 4, 3, dark); px(g, X - 2, Y + RH + 1, W + 4, 1, P.ink);
    return Y + RH + 1;
  }
  function windowPx(g, x, y, w, h) {
    px(g, x - 1, y - 1, w + 2, h + 2, P.ink); px(g, x, y, w, h, P.glass);
    px(g, x + 1, y + 1, 2, 2, P.glassLt); px(g, x + Math.floor(w / 2), y, 1, h, P.ink);
  }
  function canEnter(b) {
    return things.some(function (t) { return t.kind === 'door' && t.enter && t.x === b.door && t.y === b.y + b.h - 1; });
  }
  function drawBuilding(g, b) {
    if (b.style === 'brain') return drawRmit(g, b);
    if (b.style === 'tapri') return drawTapri(g, b);
    var X = b.x * T, Y = b.y * T, W = b.w * T, H = b.h * T;
    if (b.part === 'glance') px(g, X, Y, W, 3, '#f1e4e0');
    // shadow
    px(g, X + 3, Y + H - 2, W, 4, 'rgba(40,48,64,0.22)');
    var brain = b.style === 'brain';
    var wallTop = brain ? Y + 1 : roofShape(g, b);
    var brick = b.style === 'brick';
    // walls
    px(g, X - 1, wallTop, W + 2, Y + H - wallTop, P.ink);
    px(g, X, wallTop, W, Y + H - wallTop - 1, brick ? P.brick : brain ? '#d9d2c0' : b.style === 'arcade' ? '#2a2150' : P.wall);
    if (brain) {                                // old stone corner building: piers and a cornice
      for (var pxx = X; pxx < X + W; pxx += T) px(g, pxx, wallTop, 2, Y + H - wallTop - 1, '#c2b9a3');
      px(g, X, Y + H - 20, W, 2, '#b3a98f'); px(g, X, Y + H - 4, W, 3, '#a89f88');
    } else if (brick) {
      for (var by = wallTop + 3; by < Y + H - 1; by += 4) px(g, X, by, W, 1, P.mortar);
    } else if (b.style === 'arcade') {          // neon trim
      px(g, X, wallTop, W, 2, '#ff4fd8'); px(g, X, Y + H - 4, W, 2, '#38d0ff'); px(g, X, Y + H - 2, W, 1, '#1c1633');
    } else {
      px(g, X, Y + H - 4, W, 3, P.wallDk);
    }
    var tall = Y + H - wallTop;
    // where the name sign goes: above the door, facing the road (kiosk: on its little roof)
    var sr = null;
    if (b.sign) {
      var sw = textW(b.sign[0]) + 6, scx = b.door >= 0 ? b.door * T + 8 : X + W / 2;
      sr = { x: Math.round(Math.max(X + 2, Math.min(X + W - 2 - sw, scx - sw / 2))), y: b.style === 'kiosk' ? Y + 3 : Y + H - 28, w: sw, h: 9 };
    }
    function win(x, y, w, h) {
      if (sr && x - 1 < sr.x + sr.w + 2 && x + w + 1 > sr.x - 2 && y - 1 < sr.y + sr.h + 1 && y + h + 1 > sr.y - 1) return;
      windowPx(g, x, y, w, h);
    }
    // windows
    if (b.style === 'tower') {
      for (var wy = wallTop + 4; wy < Y + H - 20; wy += 12)
        for (var wx = X + 5; wx < X + W - 10; wx += 13) win(wx, wy, 8, 7);
    } else if (brain) {
      for (var br = 0; br < 2; br++)
        for (var bi = 0; bi < b.w; bi++) {
          var bx = (b.x + bi) * T + 4, byy = Y + 60 + br * 15;
          if (br === 1 && b.x + bi === b.door) continue;
          if (sr && bx - 1 < sr.x + sr.w + 2 && bx + 9 > sr.x - 2 && byy - 1 < sr.y + sr.h + 1 && byy + 10 > sr.y - 1) continue;
          px(g, bx - 1, byy - 1, 10, 11, P.ink); px(g, bx, byy, 8, 9, '#4a5a78'); px(g, bx + 1, byy + 1, 2, 3, P.glassLt); px(g, bx, byy + 4, 8, 1, P.ink);
        }
    } else if (b.style !== 'kiosk' && b.style !== 'arcade') {
      var wyy = wallTop + Math.max(4, Math.floor((tall - 20) / 2));
      for (var i = 0; i < b.w; i++) {
        var cx = b.x + i;
        if (cx === b.door || cx === b.door + 0) continue;
        if (i % 2 === 1 || b.w <= 5) { if (cx !== b.door) win(cx * T + 3, wyy, 10, 7); }
      }
    }
    // door
    if (b.door >= 0) {
      var dx = b.door * T + 2, dy = Y + H - 15;
      px(g, dx - 1, dy - 1, 14, 16, P.ink); px(g, dx, dy, 12, 14, P.door);
      px(g, dx + 1, dy + 1, 10, 1, shade(P.door, 0.2)); px(g, dx + 9, dy + 7, 1, 2, P.butter);
      px(g, dx, dy, 12, 14, 'rgba(0,0,0,0)');
      if (canEnter(b)) {                      // open doorway: lit inside, door swung back, welcome mat
        px(g, dx, dy, 12, 14, '#2a2238'); px(g, dx + 2, dy + 4, 8, 10, '#ffe08f');
      }
    }
    // signature details
    if (b.style === 'uni') {                 // gear emblem on the roof
      var gx = X + W / 2, gy = Y + 18;
      g.fillStyle = P.ink; blob(g, gx, gy, 7, 7); g.fillStyle = P.butter; blob(g, gx, gy, 6, 6);
      g.fillStyle = P.ink; blob(g, gx, gy, 2, 2);
      [[0, -8], [0, 7], [-8, 0], [7, 0]].forEach(function (o) { px(g, gx + o[0] - 1, gy + o[1] - 1, 3, 3, P.butter); });
    }
    if (b.style === 'fever') {               // a poster on the wall
      px(g, X + 3, wallTop + 3, 9, 12, P.ink); px(g, X + 4, wallTop + 4, 7, 10, '#ffd84a');
      px(g, X + 5, wallTop + 6, 5, 2, P.red); px(g, X + 5, wallTop + 10, 5, 1, P.ink);
    }
    if (b.style === 'shop') {                // striped awning
      for (var a = 0; a < W; a += 6) px(g, X + a, wallTop, 3, 5, P.white);
      px(g, X, wallTop + 5, W, 1, P.ink);
    }
    if (b.style === 'eloelo') {              // antenna + live dot
      px(g, X + W / 2 - 1, Y - 8, 2, 11, P.ink); px(g, X + W / 2 - 6, Y - 12, 1, 6, P.ink); px(g, X + W / 2 + 5, Y - 12, 1, 6, P.ink);
      px(g, X + W - 10, wallTop + 3, 5, 5, P.ink); px(g, X + W - 9, wallTop + 4, 3, 3, '#ff3b3b');
    }
    if (b.style === 'tower') {               // G flag on top
      px(g, X + W / 2, Y - 10, 1, 12, P.ink); px(g, X + W / 2 + 1, Y - 10, 8, 5, P.butter); px(g, X + W / 2 + 1, Y - 6, 8, 1, P.ink);
    }
    if (b.style === 'kiosk') {               // Novo newsstand
      px(g, X - 1, wallTop, W + 2, H - (wallTop - Y), P.ink);
      px(g, X, wallTop, W, H - (wallTop - Y) - 1, '#fff4ec');
      for (var n = 0; n < 4; n++) { px(g, X + 3 + n * 7, wallTop + 3, 5, 7, n % 2 ? '#ff4f00' : P.white); px(g, X + 3 + n * 7, wallTop + 3, 5, 1, P.ink); }
    }
    if (b.style === 'studio') {              // squircle window + cat flag
      var sx = X + 8, sy = wallTop + 4;
      px(g, sx, sy, 12, 10, P.ink); px(g, sx + 1, sy + 1, 10, 8, P.lilac); px(g, sx, sy, 1, 1, P.wall); px(g, sx + 11, sy, 1, 1, P.wall);
      px(g, sx, sy + 9, 1, 1, P.wall); px(g, sx + 11, sy + 9, 1, 1, P.wall);
    }
    if (b.part === 'glance') {                // rooftop sign: this one belongs to Glance
      px(g, X + W / 2 - 9, Y - 1, 2, 4, P.ink); px(g, X + W / 2 + 7, Y - 1, 2, 4, P.ink);
      signBoard(g, 'glance', X + W / 2, Y - 10, '#ffffff', '#e8203c');
    }
    // brand-coloured name sign (pixel type, no logos)
    if (sr) signBoard(g, b.sign[0], sr.x + sr.w / 2, sr.y, b.sign[1], b.sign[2]);
  }
  // a roadside chai stall: striped awning, wooden counter, kettle on the stove, glasses of chai
  function drawTapri(g, b) {
    var X = b.x * T, Y = b.y * T, W = b.w * T, B = Y + b.h * T, i;
    px(g, X + 3, B - 2, W, 4, 'rgba(40,48,64,0.22)');
    px(g, X + 1, Y + 8, 2, 22, P.ink); px(g, X + W - 3, Y + 8, 2, 22, P.ink);          // poles
    px(g, X + 2, Y + 12, W - 4, 8, '#5a4030');                                        // shaded back
    px(g, X - 1, B - 13, W + 2, 13, P.ink); px(g, X, B - 12, W, 11, P.plank);          // counter
    px(g, X, B - 12, W, 2, shade(P.plank, 0.2)); for (i = 5; i < W; i += 7) px(g, X + i, B - 9, 1, 8, P.plankDk);
    px(g, X + 4, B - 19, 9, 7, P.ink); px(g, X + 5, B - 18, 7, 5, '#c9ccd4'); px(g, X + 5, B - 18, 7, 1, '#eef0f4'); // kettle
    px(g, X + 12, B - 17, 3, 1, P.ink); px(g, X + 14, B - 18, 1, 1, P.ink); px(g, X + 7, B - 21, 3, 2, P.ink);
    px(g, X + 15, B - 22, 1, 2, '#f4f4f4'); px(g, X + 16, B - 25, 1, 2, '#f4f4f4');   // steam
    for (i = 0; i < 3; i++) { var gx = X + 19 + i * 4; px(g, gx, B - 17, 3, 5, '#e8eef4'); px(g, gx, B - 15, 3, 3, '#c8763a'); } // glasses
    px(g, X - 3, Y + 1, W + 6, 11, P.ink);                                             // awning
    for (i = 0; i < W + 4; i += 4) px(g, X - 2 + i, Y + 2, Math.min(4, W + 4 - i), 9, (i / 4) % 2 ? '#fff4d8' : '#d8402c');
    for (i = 0; i < W + 4; i += 4) px(g, X - 2 + i, Y + 11, Math.min(4, W + 4 - i), 2, (i / 4) % 2 ? '#e8dcb8' : '#b02e20');
    px(g, X - 3, Y + 13, W + 6, 1, P.ink);
    signBoard(g, 'CHAI', X + W / 2, Y + 3, '#283040', '#ffe08f');
  }
  // RMIT, Swanston Street: the red brick Building 22 with the Green Brain on its roof and the
  // bumpy green awning, next to Storey Hall's tessellated green facade
  function drawRmit(g, b) {
    var X = b.x * T, Y = b.y * T, W = b.w * T, H = b.h * T, B = Y + H;
    var SW = 0, BX = X + SW, BW = W - SW, top = Y + 30, i, j;
    for (j = 0; j < 2; j++) for (i = 0; i < b.w; i++) drawTile(g, STONE, b.x + i, b.y + j);
    px(g, X + 3, B - 2, W, 4, 'rgba(40,48,64,0.22)');
    // ---- Building 22 (red brick)
    px(g, BX - 1, top - 1, BW + 2, B - top + 1, P.ink); px(g, BX, top, BW, B - top - 1, '#a8432f');
    for (j = top + 3; j < B - 1; j += 4) px(g, BX, j, BW, 1, '#8c3526');
    var cream = '#efe6cf', creamD = '#cfc4a6';
    px(g, BX - 2, top - 3, BW + 4, 6, P.ink); px(g, BX - 1, top - 2, BW + 2, 4, cream); px(g, BX - 1, top + 1, BW + 2, 1, creamD); // cornice
    px(g, BX, top + 30, BW, 4, cream); px(g, BX, top + 33, BW, 1, creamD);                                                   // string course
    for (i = 0; i < 7; i++) {                                 // bays: brick piers, cream-framed windows
      var wx = BX + 6 + i * 15;
      if (i === 3) {                                           // centre bay with the arch
        px(g, wx - 2, top + 3, 13, 27, cream); px(g, wx - 1, top + 2, 11, 1, cream);
        px(g, wx, top + 8, 4, 20, '#a8432f'); px(g, wx + 5, top + 8, 4, 20, '#a8432f'); px(g, wx + 1, top + 7, 2, 1, '#a8432f'); px(g, wx + 6, top + 7, 2, 1, '#a8432f');
      } else {
        px(g, wx - 1, top + 7, 11, 16, cream);
        px(g, wx, top + 8, 9, 14, P.ink); px(g, wx + 1, top + 9, 3, 12, '#51627f'); px(g, wx + 5, top + 9, 3, 12, '#51627f');
        px(g, wx + 1, top + 14, 7, 1, cream); px(g, wx + 1, top + 9, 1, 2, P.glassLt);
      }
      if (i !== 3) {                                           // lower row (the sign covers the centre bay)
        px(g, wx - 1, top + 37, 11, 13, cream);
        px(g, wx, top + 38, 9, 11, P.ink); px(g, wx + 1, top + 39, 3, 9, '#51627f'); px(g, wx + 5, top + 39, 3, 9, '#51627f'); px(g, wx + 1, top + 43, 7, 1, cream);
      }
    }
    // ground floor: dark shopfronts under the awning
    px(g, BX, B - 16, BW, 15, '#2b2a33');
    for (i = 0; i < BW - 14; i += 13) { if (BX + 3 + i + 10 > b.door * T && BX + 3 + i < b.door * T + 16) continue; px(g, BX + 3 + i, B - 13, 10, 9, '#5b6c8a'); px(g, BX + 4 + i, B - 12, 3, 2, P.glassLt); }
    var dx = b.door * T + 2, dy = B - 15;
    px(g, dx - 1, dy - 1, 14, 16, P.ink); px(g, dx, dy, 12, 14, '#2a2238'); px(g, dx + 2, dy + 4, 8, 10, '#ffe08f');
    // the green awning: a long bumpy tube
    for (i = -4; i < BW + 3; i++) {
      var bump = Math.round(Math.abs(Math.sin(i / 3.2)) * 2), ay = B - 22 - bump, ah = 6 + bump;
      px(g, BX + i, ay - 1, 1, ah + 2, P.ink); px(g, BX + i, ay, 1, ah, '#2fc447'); px(g, BX + i, ay, 1, 2, '#86f08a'); px(g, BX + i, ay + ah - 2, 1, 2, '#1e9440');
    }
    px(g, BX - 5, B - 23, 1, 7, P.ink); px(g, BX + BW + 3, B - 23, 1, 7, P.ink);
    // ---- the Green Brain on the roof: lumpy, dimpled, with horns
    var G = '#2fc447', GL = '#86f08a', GD = '#1e9440', GK = '#14703a';
    var bx0 = BX + 2, base = top - 3, kx = (BW - 4) / 74;
    var lobes = [[8, 14, 9, 10], [22, 11, 11, 13], [38, 13, 10, 11], [52, 10, 11, 14], [66, 14, 9, 10], [15, 20, 12, 6], [45, 20, 14, 6], [62, 21, 10, 5]];
    var horns = [[13, -3, 5], [27, -7, 6], [33, -2, 4], [48, -9, 7], [58, -5, 5], [70, 1, 4]];
    function lb(n, grow) { var l = lobes[n]; blob(g, Math.round(bx0 + l[0] * kx), base - 26 + l[1], Math.round(l[2] * kx) + grow, l[3] + grow); }
    function horn(hn, grow, col) { for (var t = 0; t < hn[2] + 4; t++) { var hw = Math.max(1, Math.round(t * 0.7)) + grow; px(g, Math.round(bx0 + hn[0] * kx) - Math.floor(hw / 2) + Math.round(t * 0.3), base - 26 + hn[1] + t - grow, hw, 1, col); } }
    horns.forEach(function (hn) { horn(hn, 2, P.ink); });
    g.fillStyle = P.ink; for (i = 0; i < lobes.length; i++) lb(i, 1);
    px(g, bx0 - 1, base - 8, BW - 2, 8, P.ink);
    g.fillStyle = GD; for (i = 0; i < lobes.length; i++) lb(i, 0);
    px(g, bx0, base - 8, BW - 4, 7, GD);
    horns.forEach(function (hn) { horn(hn, 0, G); });
    g.fillStyle = G; for (i = 0; i < lobes.length; i++) { var l = lobes[i]; blob(g, Math.round(bx0 + l[0] * kx) - 1, base - 26 + l[1] - 1, Math.round(l[2] * kx) - 1, l[3] - 2); }
    for (j = 0; j < 4; j++) for (i = 0; i < 17; i++) {       // dimples
      var qx = bx0 + 4 + i * 6 + (j % 2) * 3, qy = base - 22 + j * 5;
      px(g, qx, qy, 2, 2, GK); px(g, qx - 1, qy - 1, 2, 1, GL);
    }
    px(g, bx0 + 30, base - 3, BW - 64, 2, '#bfe9ff');             // glazed level under the brain
    // sign
    if (b.sign) signBoard(g, b.sign[0], b.door * T + 8, B - 34, b.sign[1], b.sign[2]);
  }
  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, bb = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt))); }
    return 'rgb(' + f(r) + ',' + f(gg) + ',' + f(bb) + ')';
  }

  function drawObject(g, t) {
    var X = t.x * T, Y = t.y * T;
    if (t.kind === 'sign') {
      px(g, X + 7, Y + 9, 2, 6, P.ink); px(g, X + 7, Y + 9, 1, 6, P.plankDk);
      px(g, X + 1, Y + 2, 14, 9, P.ink); px(g, X + 2, Y + 3, 12, 7, P.plank);
      px(g, X + 4, Y + 5, 8, 1, P.plankDk); px(g, X + 4, Y + 7, 6, 1, P.plankDk);
    } else if (t.kind === 'streamrig') {      // ring light with a phone in the middle, on a tripod
      px(g, X + 7, Y + 8, 2, 6, P.ink); px(g, X + 3, Y + 14, 10, 1, P.ink); px(g, X + 4, Y + 13, 1, 1, P.ink); px(g, X + 11, Y + 13, 1, 1, P.ink);
      g.fillStyle = P.ink; blob(g, X + 8, Y + 2, 7, 7); g.fillStyle = '#fff8dc'; blob(g, X + 8, Y + 2, 6, 6);
      g.fillStyle = P.ink; blob(g, X + 8, Y + 2, 4, 4);
      px(g, X + 6, Y - 2, 4, 8, '#2e2e3e'); px(g, X + 7, Y - 1, 2, 6, '#8ec4ee'); px(g, X + 7, Y - 1, 1, 1, '#ff3b3b');
    } else if (t.kind === 'crates') {
      for (var c = 0; c < 2; c++) {
        var cx = X + 1 + c * 7;
        px(g, cx, Y + 5, 7, 10, P.ink); px(g, cx + 1, Y + 6, 5, 8, '#3a7ad8');
        px(g, cx + 2, Y + 3, 1, 4, P.white); px(g, cx + 4, Y + 3, 1, 4, P.white);
        px(g, cx + 2, Y + 2, 1, 1, P.ink); px(g, cx + 4, Y + 2, 1, 1, P.ink);
      }
    } else if (t.kind === 'mailbox') {
      px(g, X + 7, Y + 9, 2, 6, P.ink);
      px(g, X + 3, Y + 3, 10, 7, P.ink); px(g, X + 4, Y + 4, 8, 5, P.lav);
      px(g, X + 11, Y + 1, 1, 4, P.ink); px(g, X + 12, Y + 1, 3, 2, P.red);
    } else if (t.kind === 'tramstop') {
      px(g, X + 7, Y + 3, 2, 12, P.ink);
      px(g, X + 3, Y + 1, 10, 6, P.ink); px(g, X + 4, Y + 2, 8, 4, '#3ab86a'); px(g, X + 5, Y + 3, 6, 1, P.white);
    }
  }

  function buildLayer() {
    for (var ty = 0; ty < MH; ty++) for (var tx = 0; tx < MW; tx++) drawTile(L, map[ty][tx], tx, ty);
    // trees on a 2×2 grid
    for (ty = 0; ty < MH; ty += 2) for (tx = 0; tx < MW; tx += 2) {
      if (map[ty][tx] === TREE || map[ty][tx + 1] === TREE || (map[ty + 1] && map[ty + 1][tx] === TREE)) treeBlock(L, tx * T, ty * T);
    }
    buildings.forEach(function (b) { drawBuilding(L, b); });
    things.forEach(function (t) { if (t.kind !== 'npc' && !t.invisible) drawObject(L, t); });
  }

  /* ------------------------------------------------------------------ */
  /* sprites: people and the cat, drawn in pixels with a dark outline     */
  /* ------------------------------------------------------------------ */
  var cache = {};
  function outlined(key, draw) {
    if (cache[key]) return cache[key];
    var a = document.createElement('canvas'); a.width = a.height = 18;
    var ga = a.getContext('2d'); ga.imageSmoothingEnabled = false; ga.translate(1, 1); draw(ga);
    var sil = document.createElement('canvas'); sil.width = sil.height = 18;
    var gs = sil.getContext('2d'); gs.drawImage(a, 0, 0); gs.globalCompositeOperation = 'source-in'; gs.fillStyle = P.ink; gs.fillRect(0, 0, 18, 18);
    var out = document.createElement('canvas'); out.width = out.height = 18;
    var go = out.getContext('2d');
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (o) { go.drawImage(sil, o[0], o[1]); });
    go.drawImage(a, 0, 0);
    cache[key] = out;
    return out;
  }
  function mirror(src) {
    var c = document.createElement('canvas'); c.width = c.height = 18;
    var g = c.getContext('2d'); g.translate(18, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c;
  }

  // look: {hair, skin, shirt, pants, jacket?, tee?, glasses?, beard?, cap?, coat?}
  // sprites from sprites.js: palette-indexed grids, outlined here in ink
  var SPR = window.DQ_SPRITES || null;
  var NPC_SPRITE = { 'Mom': 'mom', 'Professor': 'professor', 'Kushal': 'kushal', 'Michelle': 'michelle', 'Debasish': 'debasish', 'Arnab': 'arnab', 'Tharun': 'tarun', 'Rahul': 'rahul', 'Nayanika': 'nayanika', 'Vinay': 'vinay', 'Shubham': 'shubham', 'Delivery exec': 'delivery-exec',
    'Streamer': 'streamer', 'Colleague': 'colleague', 'Cricket fan': 'cricket-fan', 'Classmate': 'classmate', 'Design lead': 'lead', 'Tutor': 'lead', 'Gamer': 'gamer', 'Moderator': 'moderator' };
  function gridSprite(key, rows, pal, flip) {
    if (cache[key]) return cache[key];
    var w = rows[0].length, h = rows.length;
    var a = document.createElement('canvas'); a.width = w + 2; a.height = h + 2;
    var g = a.getContext('2d');
    rows.forEach(function (r, y) { for (var x = 0; x < w; x++) { var c = r[flip ? w - 1 - x : x]; if (c !== '.' && pal[c]) { g.fillStyle = pal[c]; g.fillRect(x + 1, y + 1, 1, 1); } } });
    var sil = document.createElement('canvas'); sil.width = w + 2; sil.height = h + 2;
    var gs = sil.getContext('2d'); gs.drawImage(a, 0, 0); gs.globalCompositeOperation = 'source-in'; gs.fillStyle = P.ink; gs.fillRect(0, 0, w + 2, h + 2);
    var out = document.createElement('canvas'); out.width = w + 2; out.height = h + 2;
    var go = out.getContext('2d');
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (o) { go.drawImage(sil, o[0], o[1]); });
    go.drawImage(a, 0, 0);
    cache[key] = out; return out;
  }
  var FRAME = { 0: 0, 1: 1, 3: 2 };
  function charSprite(name, dir, frame) {
    var c = SPR && SPR.chars[name]; if (!c) return null;
    var f = FRAME[frame] || 0, d = dir === 'left' ? 'right' : dir;
    var rows = c.frames[d + '/' + f] || c.frames[d + '/0'];
    return gridSprite('c:' + name + dir + f, rows, c.pal, dir === 'left');
  }
  function catGrid(dir, frame) {
    var c = SPR && SPR.cat; if (!c) return catSprite(dir, frame);
    var d = dir === 'left' ? 'right' : dir;
    return gridSprite('cat:' + dir + frame, c.frames[d + '/' + (frame % 2)], c.pal, dir === 'left');
  }
  function personSprite(id, look, dir, frame) {
    var key = id + dir + frame;
    if (cache[key]) return cache[key];
    if (dir === 'left') { cache[key] = mirror(personSprite(id, look, 'right', frame)); return cache[key]; }
    return outlined(key, function (g) {
      var step = frame % 2;                 // 0 = stand, 1 = mid-stride
      var legL = frame === 1 ? -1 : 0, legR = frame === 3 ? -1 : 0;
      var top = look.jacket || look.shirt;
      // legs + shoes
      if (dir === 'right') {
        px(g, 5, 12, 3, 3 + (frame === 1 ? 0 : 0), look.pants); px(g, 8, 12, 3, 3, shade(look.pants, -0.2));
        px(g, 5 + (frame === 1 ? -1 : 0), 15, 3, 1, P.ink); px(g, 8 + (frame === 3 ? 1 : 0), 15, 3, 1, P.ink);
      } else {
        px(g, 4, 12 + legL, 3, 3, look.pants); px(g, 9, 12 + legR, 3, 3, look.pants);
        px(g, 4, 15 + legL, 3, 1, P.ink); px(g, 9, 15 + legR, 3, 1, P.ink);
      }
      // body
      if (dir === 'right') {
        px(g, 5, 8, 6, 5, top);
        if (look.tee && look.jacket) px(g, 9, 8, 2, 4, look.tee);
        px(g, 7 + (step ? 1 : 0), 9, 2, 3, shade(top, -0.18)); px(g, 7 + (step ? 1 : 0), 12, 2, 1, look.skin);
      } else {
        px(g, 3, 8, 10, 5, top);
        if (dir === 'down' && look.tee && look.jacket) px(g, 7, 8, 2, 5, look.tee);
        if (dir === 'down' && look.coat) { px(g, 7, 8, 2, 5, '#9fb6d8'); }
        px(g, 2, 9 + (step && frame === 1 ? 1 : 0), 1, 3, top); px(g, 13, 9 + (step && frame === 3 ? 1 : 0), 1, 3, top);
        px(g, 2, 12 + (frame === 1 ? 1 : 0), 1, 1, look.skin); px(g, 13, 12 + (frame === 3 ? 1 : 0), 1, 1, look.skin);
      }
      // head
      if (dir === 'down') {
        px(g, 4, 2, 8, 6, look.skin);
        px(g, 3, 0, 10, 3, look.hair); px(g, 3, 3, 1, 3, look.hair); px(g, 12, 3, 1, 3, look.hair); px(g, 5, 0, 7, 1, look.hair);
        if (look.cap) { px(g, 3, 0, 10, 2, look.cap); px(g, 3, 2, 10, 1, shade(look.cap, -0.3)); }
        if (look.glasses) {
          px(g, 4, 4, 3, 2, P.ink); px(g, 9, 4, 3, 2, P.ink); px(g, 7, 4, 2, 1, P.ink);
          px(g, 5, 4, 1, 1, P.glassLt); px(g, 10, 4, 1, 1, P.glassLt);
        } else { px(g, 5, 4, 1, 2, P.ink); px(g, 10, 4, 1, 2, P.ink); }
        if (look.beard) { px(g, 4, 6, 8, 2, look.beard); px(g, 6, 6, 4, 1, shade(look.skin, -0.25)); }
        else px(g, 7, 6, 2, 1, shade(look.skin, -0.3));
      } else if (dir === 'up') {
        px(g, 4, 2, 8, 6, look.skin);
        px(g, 3, 0, 10, 7, look.hair);
        if (look.cap) { px(g, 3, 0, 10, 3, look.cap); }
      } else {                               // right
        px(g, 5, 2, 7, 6, look.skin);
        px(g, 4, 0, 9, 3, look.hair); px(g, 4, 3, 3, 4, look.hair);
        if (look.cap) { px(g, 4, 0, 9, 2, look.cap); px(g, 10, 2, 4, 1, shade(look.cap, -0.3)); }
        if (look.glasses) { px(g, 8, 4, 4, 2, P.ink); px(g, 9, 4, 2, 1, P.glassLt); } else px(g, 10, 4, 1, 2, P.ink);
        px(g, 12, 4, 1, 2, look.skin);
        if (look.beard) { px(g, 7, 6, 5, 2, look.beard); } else px(g, 10, 6, 2, 1, shade(look.skin, -0.3));
      }
    });
  }

  var SHYAM = { hair: '#1c1616', skin: '#a8704c', jacket: '#26262e', tee: '#86b4e0', pants: '#3a4462', glasses: true, beard: '#2a1c16' };

  function catSprite(dir, frame) {
    var key = 'cat' + dir + frame;
    if (cache[key]) return cache[key];
    if (dir === 'left') { cache[key] = mirror(catSprite('right', frame)); return cache[key]; }
    return outlined(key, function (g) {
      var bob = frame % 2 ? 1 : 0;
      if (dir === 'right') {
        px(g, 2, 8 + bob, 9, 5, P.lav);                         // body
        px(g, 3, 13, 2, 2, P.lav); px(g, 8, 13, 2, 2, P.lav);   // legs
        if (frame % 2) { px(g, 4, 13, 2, 2, P.lav); px(g, 9, 13, 2, 2, P.lav); }
        px(g, 0, 4 + bob, 2, 6, P.lav); px(g, 1, 3 + bob, 1, 1, P.lav); // tail
        px(g, 8, 3 + bob, 7, 7, P.lav);                         // head
        px(g, 8, 1 + bob, 2, 2, P.lav); px(g, 13, 1 + bob, 2, 2, P.lav); // ears
        px(g, 9, 2 + bob, 1, 1, P.lilac); px(g, 13, 2 + bob, 1, 1, P.lilac);
        px(g, 12, 5 + bob, 1, 2, P.ink); px(g, 14, 7 + bob, 1, 1, P.salmon);
      } else {
        px(g, 4, 9, 8, 5, P.lav);
        px(g, 4, 14, 2, 1, P.lav); px(g, 10, 14, 2, 1, P.lav);
        px(g, 3, 3 + bob, 10, 7, P.lav);
        px(g, 3, 1 + bob, 2, 2, P.lav); px(g, 11, 1 + bob, 2, 2, P.lav);
        px(g, 12, 9, 3, 2, P.lav); px(g, 14, 6, 1, 3, P.lav);   // tail curling up
        if (dir === 'down') {
          px(g, 5, 5 + bob, 1, 2, P.ink); px(g, 10, 5 + bob, 1, 2, P.ink); px(g, 7, 7 + bob, 2, 1, P.salmon);
          px(g, 4, 2 + bob, 1, 1, P.lilac); px(g, 11, 2 + bob, 1, 1, P.lilac);
        }
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* game state                                                           */
  /* ------------------------------------------------------------------ */
  var STEP = 0.18;
  var S;
  function newGame() {
    S = {
      mode: 'title',
      p: { x: 5, y: 12, fx: 5, fy: 12, dir: 'down', moving: 0, frame: 0, steps: 0 },
      cat: { x: 4, y: 12, fx: 4, fy: 12, dir: 'right', moving: 0, frame: 0 },
      stamps: [], zone: -1, t: 0,
      dlg: null, camX: 0, camY: 0, titlePan: 0, fade: null, seen: {}
    };
    cur = world; root.classList.remove('is-room');
    renderStamps();
    ui.end.hidden = true;
    ui.dialog.hidden = true;
    ui.title.hidden = false;
    root.classList.add('is-title');
    if (typeof refreshTitle === 'function') refreshTitle();
  }

  /* input -------------------------------------------------------------- */
  var held = [];
  var KEY = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  var ACT = { z: 1, Z: 1, ' ': 1, Enter: 1, Spacebar: 1 };
  function press(dir) {
    if (held.indexOf(dir) < 0) held.push(dir);
    if (S.mode === 'play' && !S.p.moving && !S.dlg) S.p.dir = dir;   // a quick tap turns you on the spot
  }
  function release(dir) { held = held.filter(function (d) { return d !== dir; }); }
  root.addEventListener('keydown', function (e) {
    if (e.target.closest && e.target.closest('a,button') && ACT[e.key]) return;   // let buttons work
    if (KEY[e.key]) { e.preventDefault(); press(KEY[e.key]); }
    else if (ACT[e.key]) { e.preventDefault(); if (!e.repeat) action(); }
    else if (e.key === 'x' || e.key === 'X' || e.key === 'Escape') {
      if (S.dlg) { e.preventDefault(); back(); }
      else if (e.key !== 'Escape' && S.mode === 'play') { e.preventDefault(); back(); }
    }
    else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); openMap(); }
  });
  root.addEventListener('keyup', function (e) { if (KEY[e.key]) release(KEY[e.key]); });
  root.addEventListener('blur', function () { held = []; }, true);

  /* B button: back out of a conversation, or open and close the map */
  function back() {
    if (!S || S.mode === 'title') return;
    if (S.dlg) { if (typeof S.dlg.thing.tour === 'number') { S.dlg = null; ui.dialog.hidden = true; S.tour = null; } else closeDialog(); return; }
    if (S.mode === 'map') { closeMap(); return; }
    if (S.mode === 'play' && !S.fade) openMap();
  }
  (function () {
    var a = root.querySelector('.rpg__a');
    if (!a || root.querySelector('.rpg__b')) return;
    var wrap = document.createElement('div'); wrap.className = 'rpg__ab';
    a.parentNode.insertBefore(wrap, a);
    var b = document.createElement('button'); b.type = 'button'; b.tabIndex = -1; b.className = 'rpg__a rpg__b'; b.textContent = 'B';
    b.setAttribute('data-pad', 'b');
    wrap.appendChild(b); wrap.appendChild(a);
  })();
  root.querySelectorAll('[data-pad]').forEach(function (btn) {
    var d = btn.getAttribute('data-pad');
    function down(e) { e.preventDefault(); root.focus({ preventScroll: true }); if (d === 'a') action(); else if (d === 'b') back(); else press(d); }
    function up() { if (d !== 'a' && d !== 'b') release(d); }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up); btn.addEventListener('pointerleave', up); btn.addEventListener('pointercancel', up);
  });
  cv.addEventListener('pointerdown', function () { root.focus({ preventScroll: true }); if (S.mode === 'title') start(); else if (S.dlg) action(); });
  ui.title.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) return;   // let 'Skip to portfolio' be a normal link
    root.focus({ preventScroll: true }); start();
  });
  ui.replay.addEventListener('click', function () { clearSave(); newGame(); root.focus({ preventScroll: true }); start(); });

  function start() {
    if (S.mode !== 'title') return;
    S.mode = 'play'; ui.title.hidden = true; root.classList.remove('is-title');
    S.zone = -1;
    var sv = loadSave();
    if (sv) {                                  // pick up where you left off
      S.stamps = sv.stamps.slice(); S.seen = sv.seen || {}; renderStamps();
      placeActors(sv.x, sv.y, 'down', sv.x - 1, sv.y, 'right');
    }
  }

  /* saved progress (this browser only) ---------------------------------- */
  var SAVE_KEY = 'design-quest-save-v1';
  function loadSave() {
    try {
      var sv = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (sv && Array.isArray(sv.stamps) && typeof sv.x === 'number' && !blocked(sv.x, sv.y)) return sv;
    } catch (e) {}
    return null;
  }
  function save() {
    if (!S || S.mode === 'title' || S.tour != null) return;
    var x = cur === world ? S.p.x : cur.back.x, y = cur === world ? S.p.y : cur.back.y;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ stamps: S.stamps, seen: S.seen, x: x, y: y })); } catch (e) {}
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} refreshTitle(); }

  /* map and fast travel -------------------------------------------------- */
  var STOPS = [[5, 12], [17, 11], [29, 11], [39, 11], [52, 11], [64, 11], [78, 11], [87, 11], [97, 11]];
  var mapEl = document.createElement('div'); mapEl.className = 'rpg__map'; mapEl.hidden = true;
  mapEl.setAttribute('role', 'dialog'); mapEl.setAttribute('aria-label', 'Map: jump to a stop');
  var mapBtn = document.createElement('button'); mapBtn.type = 'button'; mapBtn.className = 'rpg__mapbtn'; mapBtn.textContent = 'Map';
  var screenEl = root.querySelector('.rpg__screen') || root;
  screenEl.appendChild(mapBtn); screenEl.appendChild(mapEl);
  function openMap() {
    if (S.mode !== 'play' || S.dlg || S.fade) return;
    var here = cur === world ? S.zone : -1, html = '<p class="rpg__map-title">Map</p><ol class="rpg__map-list">';
    zones.forEach(function (z, i) {
      html += '<li><button type="button" data-stop="' + i + '"' + (i === here ? ' class="is-here"' : '') + '><span>' + z.name + '</span><em>' + z.years + '</em></button></li>';
    });
    mapEl.innerHTML = html + '</ol><button type="button" class="rpg__map-close">Close</button>';
    mapEl.hidden = false; S.mode = 'map'; held = [];
    var f = mapEl.querySelector('.is-here') || mapEl.querySelector('button'); if (f) f.focus({ preventScroll: true });
  }
  function closeMap() { if (S.mode === 'map') S.mode = 'play'; mapEl.hidden = true; root.focus({ preventScroll: true }); }
  function travel(i, then) {
    transition(function () {
      cur = world; root.classList.remove('is-room');
      placeActors(STOPS[i][0], STOPS[i][1], 'up', STOPS[i][0] - 1, STOPS[i][1], 'right');
      S.zone = i; showPlace(i);
      if (then) then();
    });
  }
  mapBtn.addEventListener('click', function (e) { e.stopPropagation(); if (S.mode === 'map') closeMap(); else openMap(); });
  mapEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var i = b.getAttribute('data-stop'); closeMap();
    if (i !== null) travel(+i);
  });
  mapEl.addEventListener('keydown', function (e) {
    e.stopPropagation();
    if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') { e.preventDefault(); closeMap(); return; }
    var bs = [].slice.call(mapEl.querySelectorAll('button')), k = bs.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); bs[(k + 1) % bs.length].focus(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); bs[(k - 1 + bs.length) % bs.length].focus(); }
  });

  /* quick tour: nine stops, one or two lines each ------------------------ */
  var TOUR = [
    ["Quick tour: nine stops, about two minutes. Tap or press Enter to move on.", "It started at home, with doodles in the margins of every book."],
    ["Manipal University, 2015 – 2019. A degree in Instrumentation & Control Engineering.", "The lab notes were full of sketches."],
    ["The College Fever, 2019 – 2020. The first design job: social posts and event posters as an intern."],
    ["Supr Daily by Swiggy, 2020 – 2021. Banners, brand collabs with Cadbury, Nestlé and Monster Energy.", "Plus a user manual that made the delivery execs' first week easier."],
    ["Eloelo, 2021 – 2022. Rebranded the app to Elo Live and drew Bollywood stickers for live chat.", "Share cards for streams lifted average viewers per stream by 150%."],
    ["Glance, 2022 – 2024. Senior Graphic Designer. Designed the Novo logo, and Nostra's brand guidelines, trends report and social posts.", "The 1Weather launch campaign brought 50,000 downloads in a month."],
    ["2024: the big move, from India to Melbourne."],
    ["RMIT University, 2024 – 2026. Master of Communication Design.", "The crit room is open: ABYX, Buzzar and UnHappy Meal are on the wall."],
    ["Now: looking for visual design roles in Australia.", "That's the tour! Walk around, open the Map to jump anywhere, or switch to the classic portfolio."]
  ];
  function tourStop(i) {
    S.tour = i;
    travel(i, function () { openDialog({ who: 'Quick tour · ' + (i + 1) + '/' + TOUR.length, lines: TOUR[i], tour: i }); });
  }
  function startTour() { if (S.mode !== 'title') return; clearSaveQuiet = true; start(); tourStop(0); }
  var clearSaveQuiet = false;

  /* title screen extras: Continue / Quick tour / Start over --------------- */
  var doors = root.querySelector('.rpg__doors'), startBtn = root.querySelector('.rpg__door--start');
  var tourBtn = document.createElement('button'); tourBtn.type = 'button'; tourBtn.className = 'rpg__door rpg__door--tour'; tourBtn.textContent = 'Quick tour · 2 min';
  var overBtn = document.createElement('button'); overBtn.type = 'button'; overBtn.className = 'rpg__over'; overBtn.textContent = 'Start over';
  if (doors) { doors.insertBefore(tourBtn, startBtn ? startBtn.nextSibling : null); doors.parentNode.insertBefore(overBtn, doors.nextSibling); }
  var startLabel = startBtn ? startBtn.innerHTML : '';
  function refreshTitle() {
    var has = !!loadSave();
    if (startBtn) startBtn.innerHTML = has ? startLabel.replace('Press Start', 'Continue') : startLabel;
    overBtn.hidden = !has;
  }
  tourBtn.addEventListener('click', function (e) { e.stopPropagation(); root.focus({ preventScroll: true }); startTour(); });
  overBtn.addEventListener('click', function (e) { e.stopPropagation(); clearSave(); });

  /* dialogue ------------------------------------------------------------ */
  function openDialog(thing) {
    S.dlg = { thing: thing, i: 0, shown: 0 };
    ui.who.textContent = thing.who;
    ui.dialog.hidden = false;
    ui.text.textContent = '';
  }
  function closeDialog() {
    var th = S.dlg && S.dlg.thing;
    S.dlg = null; ui.dialog.hidden = true;
    if (th && typeof th.tour === 'number') {
      if (th.tour + 1 < TOUR.length) tourStop(th.tour + 1); else S.tour = null;
      return;
    }
    if (th && typeof th.stamp === 'number' && S.stamps.indexOf(th.stamp) < 0) {
      S.stamps.push(th.stamp); renderStamps(th.stamp); save();
    }
    if (th && th.stamp === 6) { setTimeout(showEnd, 300); }
  }
  function action() {
    if (S.mode === 'title') { start(); return; }
    if (S.mode !== 'play') return;
    if (S.fade) return;
    if (S.dlg) {
      var line = S.dlg.thing.lines[S.dlg.i];
      if (S.dlg.shown < line.length) { S.dlg.shown = line.length; return; }
      S.dlg.i++; S.dlg.shown = 0;
      if (S.dlg.i >= S.dlg.thing.lines.length) closeDialog();
      return;
    }
    if (S.p.moving) return;
    var d = DIRS[S.p.dir], tx = S.p.x + d[0], ty = S.p.y + d[1];
    var th = thingAt(tx, ty);
    if (!th && S.cat.x === tx && S.cat.y === ty) th = { who: 'Cat', lines: ['Meow.', "(It's still learning English.)"] };
    if (th) {
      if (th.kind === 'frame') { openViewer(th.piece); return; }
      if (th.enter && rooms[th.enter]) { enterRoom(th.enter); return; }
      if (th.kind === 'npc') th.dir = OPP[S.p.dir];
      openDialog(th);
    }
  }

  /* rooms: fade out, swap maps, fade in --------------------------------- */
  var FADE = 0.22;
  function transition(cb) { if (!S.fade) { held = []; S.fade = { t: 0, cb: cb, done: false }; } }
  function placeActors(x, y, dir, cx, cy, cdir) {
    var p = S.p, c = S.cat;
    p.x = p.fx = p.ox = x; p.y = p.fy = p.oy = y; p.dir = dir; p.moving = 0; p.frame = 0;
    c.x = c.fx = c.ox = cx; c.y = c.fy = c.oy = cy; c.dir = cdir; c.moving = 0; c.frame = 0;
  }
  function enterRoom(id) {
    var R = rooms[id];
    transition(function () {
      cur = R; root.classList.add('is-room');
      placeActors(R.exit.x, R.exit.y - 1, 'up', R.exit.x, R.exit.y, 'up');
      showPlaceText(R.name, R.years);
    });
  }
  function exitRoom() {
    var R = cur;
    transition(function () {
      cur = world; root.classList.remove('is-room');
      placeActors(R.back.x, R.back.y, 'down', R.back.x, R.back.y - 1, 'down');
    });
  }
  var DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

  function renderStamps(fresh) {
    var html = '';
    for (var i = 0; i < STAMPS.length; i++) {
      var got = S && S.stamps.indexOf(i) >= 0;
      html += '<span class="rpg__stamp' + (got ? ' is-got' : '') + (fresh === i ? ' is-new' : '') + '" title="' + STAMPS[i] + '"></span>';
    }
    ui.stamps.innerHTML = html;
    ui.stamps.setAttribute('aria-label', (S ? S.stamps.length : 0) + ' of ' + STAMPS.length + ' stamps collected');
  }
  function showEnd() {
    S.mode = 'end'; clearSave();
    var n = S.stamps.length, all = n === STAMPS.length;
    root.querySelector('.rpg__end-count').textContent = all ? 'All ' + n + ' stamps' : n + ' of ' + STAMPS.length + ' stamps (play again to find the rest)';
    ui.end.hidden = false;
  }
  var placeTimer = 0;
  function showPlace(z) { showPlaceText(zones[z].name, zones[z].years); }
  function showPlaceText(name, years) {
    ui.placeName.textContent = name;
    ui.placeYears.textContent = years; save();
    ui.place.classList.remove('is-on'); void ui.place.offsetWidth; ui.place.classList.add('is-on');
    clearTimeout(placeTimer);
    placeTimer = setTimeout(function () { ui.place.classList.remove('is-on'); }, 2600);
  }

  /* update ------------------------------------------------------------- */
  function update(dt) {
    S.t += dt;
    if (S.fade) {
      S.fade.t += dt;
      if (!S.fade.done && S.fade.t >= FADE) { S.fade.done = true; S.fade.cb(); }
      if (S.fade.t >= FADE * 2) S.fade = null;
    }
    cur.things.forEach(function (th) {           // NPCs glance around now and then
      if (th.kind !== 'npc') return;
      th.turnAt -= dt;
      if (th.turnAt <= 0) { th.turnAt = 2.5 + Math.random() * 3.5; if (!(S.dlg && S.dlg.thing === th)) th.dir = ['down', 'left', 'right', 'down'][Math.floor(Math.random() * 4)]; }
    });
    if (S.mode === 'title') { S.titlePan += dt * 14; return; }
    if (S.dlg) {
      var line = S.dlg.thing.lines[S.dlg.i];
      if (S.dlg.shown < line.length) {
        S.dlg.shown = Math.min(line.length, S.dlg.shown + dt * 48);
        ui.text.textContent = line.slice(0, Math.floor(S.dlg.shown));
      } else ui.text.textContent = line;
      ui.dialog.classList.toggle('is-done', S.dlg.shown >= line.length);
    }
    var p = S.p, c = S.cat;
    if (p.moving) {
      p.moving = Math.max(0, p.moving - dt / STEP);
      var k = 1 - p.moving;
      p.fx = p.ox + (p.x - p.ox) * k; p.fy = p.oy + (p.y - p.oy) * k;
      c.fx = c.ox + (c.x - c.ox) * k; c.fy = c.oy + (c.y - c.oy) * k;
      p.frame = k < 0.5 ? (p.steps % 2 ? 1 : 3) : 0;
      c.frame = k < 0.5 ? 1 : 0;
      if (!p.moving) {
        p.fx = p.x; p.fy = p.y; c.fx = c.x; c.fy = c.y;
        if (cur.room && p.x === cur.exit.x && p.y === cur.exit.y) exitRoom();
      }
    }
    if (!p.moving && !S.dlg && !S.fade && S.mode === 'play' && held.length) {
      var dir = held[held.length - 1], d = DIRS[dir];
      p.dir = dir;
      var nx = p.x + d[0], ny = p.y + d[1];
      if (!blocked(nx, ny)) {
        c.ox = c.x; c.oy = c.y;
        if (!(nx === c.x && ny === c.y)) {
          c.dir = c.x === p.x ? (p.y > c.y ? 'down' : 'up') : (p.x > c.x ? 'right' : 'left');
          c.x = p.x; c.y = p.y;
        } else { c.x = p.x; c.y = p.y; c.dir = OPP[dir]; }
        p.ox = p.x; p.oy = p.y; p.x = nx; p.y = ny; p.moving = 1; p.steps++;
      } else if (dir === 'up') {                  // walking into a door you can enter
        var dt2 = thingAt(nx, ny);
        if (dt2 && dt2.enter && rooms[dt2.enter]) enterRoom(dt2.enter);
      }
    }
    // zone banner (outdoors only)
    if (cur !== world) return;
    var zx = Math.round(p.fx), z = 0;
    for (var i = 0; i < zones.length; i++) if (zx >= zones[i].x0 && zx <= zones[i].x1) z = i;
    if (z !== S.zone) { S.zone = z; showPlace(z); }
  }

  /* draw --------------------------------------------------------------- */
  function draw() {
    var p = S.p, M = cur, mw = M.w * T, mh = M.h * T;
    var cx, cy;
    if (S.mode === 'title') { cx = (S.titlePan % (MW * T - VW - 64)) + 32; cy = 4 * T; }
    else { cx = p.fx * T + 8 - VW / 2; cy = p.fy * T + 8 - VH / 2; }
    cx = mw <= VW ? Math.round((mw - VW) / 2) : Math.round(Math.max(0, Math.min(mw - VW, cx)));   // small rooms sit centred
    cy = mh <= VH ? Math.round((mh - VH) / 2) : Math.round(Math.max(0, Math.min(mh - VH, cy)));
    ctx.fillStyle = M.room ? RC.trim : '#1c2230'; ctx.fillRect(0, 0, VW, VH);
    ctx.drawImage(M.layer, -cx, -cy);

    var t = S.t;
    // "you can go in here": a bouncing arrow in front of every door that leads to a room
    if (M === world && S.mode !== 'title') things.forEach(function (th) {
      if (th.kind !== 'door' || !th.enter) return;
      var ax = th.x * T - cx + 5, ay = (th.y + 1) * T - cy + 4 - (Math.floor(t * 2.5) % 2);
      if (ax < -16 || ax > VW) return;
      ctx.fillStyle = P.ink;                                     // one small chevron
      ctx.fillRect(ax + 2, ay, 2, 1); ctx.fillRect(ax + 1, ay + 1, 4, 1); ctx.fillRect(ax, ay + 2, 2, 1); ctx.fillRect(ax + 4, ay + 2, 2, 1);
    });
    // water shimmer
    for (var ty = Math.floor(cy / T); ty <= Math.floor((cy + VH) / T); ty++)
      for (var tx = Math.floor(cx / T); tx <= Math.floor((cx + VW) / T); tx++) {
        if (M !== world || tileAt(tx, ty) !== WATER) continue;
        var ph = Math.floor(t * 3 + hash(tx, ty) * 6) % 6;
        ctx.fillStyle = P.white;
        ctx.fillRect(tx * T - cx + 2 + ph * 2, ty * T - cy + 6 + (ph % 3) * 3, 3, 1);
      }

    // sprites, sorted by y
    var list = [];
    M.things.forEach(function (th) {
      if (th.kind === 'npc') list.push({ y: th.y, img: charSprite(NPC_SPRITE[th.who], th.dir, 0) || personSprite('npc' + (th.id || th.x), th.look, th.dir, 0), x: th.x * T, yy: th.y * T });
    });
    list.push({ y: S.cat.fy - 0.01, img: catGrid(S.cat.dir, S.cat.frame), x: S.cat.fx * T, yy: S.cat.fy * T + 1 });
    list.push({ y: p.fy, img: charSprite('shyam', p.dir, p.frame) || personSprite('shyam', SHYAM, p.dir, p.frame), x: p.fx * T, yy: p.fy * T - 1 });
    list.sort(function (a, b) { return a.y - b.y; });
    list.forEach(function (s) {
      // sprites stand on the bottom of their tile; taller ones reach up into the tile above
      var sx = Math.round(s.x - cx) - 1, sy = Math.round(s.yy - cy) + 16 - s.img.height + 1;
      ctx.fillStyle = 'rgba(40,48,64,0.2)'; ctx.fillRect(sx + 3, sy + s.img.height - 3, 12, 2);
      ctx.drawImage(s.img, sx, sy);
    });

    // "!" over NPCs with a stamp you haven't collected yet
    // a sparkle over framed work you haven't looked at yet
    if (S.mode === 'play' && M.pieces) M.pieces.forEach(function (pc) {
      if (S.seen[pc.id]) return;
      var bx = pc.x * T + pc.w * 8 - cx - 2, by = 1 - cy + Math.round(Math.sin(t * 5 + pc.x) * 1);
      ctx.fillStyle = P.ink; ctx.fillRect(bx - 1, by - 1, 6, 9);
      ctx.fillStyle = P.lilac; ctx.fillRect(bx, by, 4, 7);
      ctx.fillStyle = P.ink; ctx.fillRect(bx + 1, by + 1, 2, 3); ctx.fillRect(bx + 1, by + 5, 2, 1);
    });
    if (S.mode === 'play') M.things.forEach(function (th) {
      if (typeof th.stamp !== 'number' || th.invisible || S.stamps.indexOf(th.stamp) >= 0) return;
      var bx = th.x * T - cx + 6, by = th.y * T - cy - 13 + Math.round(Math.sin(t * 5) * 1.5);
      ctx.fillStyle = P.ink; ctx.fillRect(bx - 1, by - 1, 6, 9);
      ctx.fillStyle = P.butter; ctx.fillRect(bx, by, 4, 7);
      ctx.fillStyle = P.ink; ctx.fillRect(bx + 1, by + 1, 2, 3); ctx.fillRect(bx + 1, by + 5, 2, 1);
    });
    if (S.fade) {
      var a = S.fade.t < FADE ? S.fade.t / FADE : Math.max(0, 1 - (S.fade.t - FADE) / FADE);
      ctx.fillStyle = 'rgba(28,34,48,' + a.toFixed(3) + ')'; ctx.fillRect(0, 0, VW, VH);
    }
  }

  /* ------------------------------------------------------------------ */
  /* case study viewer: a game-menu style window with the real work       */
  /* ------------------------------------------------------------------ */
  var CASES = {
    'nostra-brand': {
      kicker: 'Glance · Nostra · Brand team', title: 'Nostra Brand Guidelines', role: 'Brand document and guidelines',
      text: ["Nostra is the gaming side of the Glance lock screen: hundreds of games you can play without downloading anything, plus live streams, tournaments and gaming communities.",
             "As part of the brand team, I made Nostra\u2019s brand document and guidelines: logo architecture and usage, the four-colour palette and its combinations, patterns built from the logo unit, typography, iconography, imagery and ad templates. The guide went through several versions before becoming a 49-page brand book."],
      stats: [['49', 'Pages in the brand book'], ['4', 'Core colours, one for each dot in the logo']],
      images: [
        { src: 'assets/nostra-bb-01.webp', alt: 'Nostra brand book page: Brand book cover', cap: 'Brand book cover', bg: '#ffffff' },
        { src: 'assets/nostra-bb-10.webp', alt: 'Nostra brand book page: Logo story: four dots, four directional buttons', cap: 'Logo story: four dots, four directional buttons', bg: '#ffffff' },
        { src: 'assets/nostra-bb-15.webp', alt: 'Nostra brand book page: Primary logo architecture', cap: 'Primary logo architecture', bg: '#ffffff' },
        { src: 'assets/nostra-bb-18.webp', alt: 'Nostra brand book page: Primary logo on the brand gradient', cap: 'Primary logo on the brand gradient', bg: '#ffffff' },
        { src: 'assets/nostra-bb-22.webp', alt: 'Nostra brand book page: App icon usage', cap: 'App icon usage', bg: '#ffffff' },
        { src: 'assets/nostra-bb-27.webp', alt: 'Nostra brand book page: Primary colours', cap: 'Primary colours', bg: '#ffffff' },
        { src: 'assets/nostra-bb-30.webp', alt: 'Nostra brand book page: Secondary colours', cap: 'Secondary colours', bg: '#ffffff' },
        { src: 'assets/nostra-bb-32.webp', alt: 'Nostra brand book page: Colour combinations', cap: 'Colour combinations', bg: '#ffffff' },
        { src: 'assets/nostra-bb-34.webp', alt: 'Nostra brand book page: Creating patterns from the logo unit', cap: 'Creating patterns from the logo unit', bg: '#ffffff' },
        { src: 'assets/nostra-bb-35.webp', alt: 'Nostra brand book page: Pattern usage', cap: 'Pattern usage', bg: '#ffffff' },
        { src: 'assets/nostra-bb-37.webp', alt: 'Nostra brand book page: Typeface: Inter', cap: 'Typeface: Inter', bg: '#ffffff' },
        { src: 'assets/nostra-bb-42.webp', alt: 'Nostra brand book page: Imagery and visual style', cap: 'Imagery and visual style', bg: '#ffffff' },
        { src: 'assets/nostra-bb-47.webp', alt: 'Nostra brand book page: Digital ad templates', cap: 'Digital ad templates', bg: '#ffffff' } ],
      link: 'nostra.html'
    },
    'nostra-report': {
      kicker: 'Glance · Nostra · Report design', title: 'Gaming Trends Report 2023', role: 'Report layout, charts and data pages',
      text: ["I designed the Nostra Gaming Trends Report 2023: a 38-page report on how people play on the lock screen across India and Indonesia, written for game developers and partners.",
             "The job was to turn a long document of figures into something a busy reader could scan: one idea per spread, the key number set large, and charts drawn in the brand colours."],
      stats: [['38', 'Pages in the report'], ['2', 'Markets covered: India and Indonesia']],
      images: [
        { src: 'assets/nostra-report-1.webp', alt: 'Report cover: a player with a phone and the line It hits different', cap: 'Cover', bg: '#ffffff' },
        { src: 'assets/nostra-report-2.webp', alt: 'Report contents page with six numbered sections', cap: 'Contents', bg: '#ffffff' },
        { src: 'assets/nostra-report-8.webp', alt: 'Report spread: two diverse geographies, with large headline figures', cap: 'Headline figures', bg: '#ffffff' },
        { src: 'assets/nostra-report-12.webp', alt: 'Report spread: donut charts and a map of India showing daily active users', cap: 'Charts and map', bg: '#ffffff' },
        { src: 'assets/nostra-report-13.webp', alt: 'Report spread: a line chart of gaming time through the day', cap: 'Time-of-day chart', bg: '#ffffff' },
        { src: 'assets/nostra-report-17.webp', alt: 'Report spread: gaming week for e-sports fans', cap: 'Section spread', bg: '#ffffff' },
        { src: 'assets/nostra-report-22.webp', alt: 'Report spread: one year in Indonesia shown as four growth figures', cap: 'Growth figures', bg: '#ffffff' },
        { src: 'assets/nostra-report-27.webp', alt: 'Report spread: a three-step integration diagram for developers', cap: 'Process diagram', bg: '#ffffff' },
        { src: 'assets/nostra-report-30.webp', alt: 'Report section opener: The Nostra power rankings', cap: 'Section opener', bg: '#ffffff' } ],
      link: 'nostra.html'
    },
    'nostra-web': {
      kicker: 'Glance · Nostra · Website', title: 'Nostra Website', role: 'Initial look of the website',
      text: ["I designed the initial look of the Nostra website: a mobile-first homepage that explains what makes Nostra different, one idea per screen. Playing, watching, competing and discovery come first, then community, live streaming, esports and the phones Nostra ships on.",
             "Each screen pairs one bold headline with a live phone mock-up and the brand\u2019s diagonal colour bars, so the brand guidelines carry straight onto the web."],
      stats: [],
      images: [
        { src: 'assets/nostra-web-1.webp', alt: 'Nostra mobile homepage screens: hero, playing, watching and competing', cap: 'Hero, then the first three pillars', bg: '#f2f0ea' },
        { src: 'assets/nostra-web-2.webp', alt: 'Nostra mobile homepage screens: discovery, community, live and esports', cap: 'Discovery, community, live and esports', bg: '#f2f0ea' },
        { src: 'assets/nostra-web-3.webp', alt: 'Nostra mobile homepage screens: platform stats, partner goals, regions and devices', cap: 'Platform, partners, regions and devices', bg: '#f2f0ea' } ],
      link: 'nostra.html'
    },
    'nostra-social': {
      kicker: 'Glance · Nostra · Social media', title: 'Nostra Social Media', role: 'In charge of Nostra\u2019s social channel',
      text: ["I was in charge of Nostra\u2019s social media channel: designing the posts and keeping the feed consistent with the brand.",
             "That meant event campaigns, like Nostra at Gamescom 2023 and a Nostra and InMobi evening in Tokyo, plus recurring series for game developers: the monthly Top 5 games on Nostra and theme-based promotions like Christmas Carnival.",
             "I also designed the Samsung partnership announcement, a LinkedIn ad series for developers, and a case study carousel on how the studio Bravestars reached 4 million users in two months."],
      stats: [],
      images: [
        { src: 'assets/nostra-soc-gamescom.webp', alt: 'Three Nostra social posts inviting partners to the Gamescom 2023 booth', cap: 'Gamescom 2023 campaign', bg: '#18142a' },
        { src: 'assets/nostra-soc-tokyo.webp', alt: 'Two InMobi and Nostra posts inviting people to an evening in Tokyo', cap: 'Tokyo event invitations', bg: '#18142a' },
        { src: 'assets/nostra-soc-top5.webp', alt: 'Top 5 Games of December series: six square posts', cap: 'Monthly series: Top 5 games on Nostra', bg: '#18142a' },
        { src: 'assets/nostra-soc-theme.webp', alt: 'Four square posts about theme-based game promotions', cap: 'Theme-based promotions for game developers', bg: '#18142a' },
        { src: 'assets/nostra-soc-top5-1.webp', alt: 'Top 5 Games December, number 1: Magic Princess', cap: 'Top 5 post, full size', bg: '#18142a' },
        { src: 'assets/nostra-soc-theme-4.webp', alt: 'Christmas Carnival theme of the month post', cap: 'Christmas Carnival post, full size', bg: '#18142a' },
        { src: 'assets/nostra-samsung-1.webp', alt: 'Announcement post: Celebrating a new partnership, Nostra in partnership with Samsung', cap: 'Samsung partnership post', bg: '#18142a' },
        { src: 'assets/nostra-samsung-3.webp', alt: 'Announcement post: A partnership that hits different, Nostra and Samsung', cap: 'Samsung partnership post, second direction', bg: '#18142a' },
        { src: 'assets/nostra-ad-1.webp', alt: 'LinkedIn ad: Maximise game discovery with Nostra\u2019s lock screen advantage', cap: 'LinkedIn ad for developers, 1 of 3', bg: '#18142a' },
        { src: 'assets/nostra-ad-2.webp', alt: 'LinkedIn ad: Amplify your game\u2019s reach through 90 million plus users', cap: 'LinkedIn ad for developers, 2 of 3', bg: '#18142a' },
        { src: 'assets/nostra-ad-5.webp', alt: 'LinkedIn ad: Increased monetization potential from day one', cap: 'LinkedIn ad for developers, 3 of 3', bg: '#18142a' },
        { src: 'assets/nostra-case-1.webp', alt: 'Carousel slide: 4 million unique users in just 2 months', cap: 'Bravestars case study: hook', bg: '#18142a' },
        { src: 'assets/nostra-case-4.webp', alt: 'Carousel slide: Impact, four results figures around a phone', cap: 'Bravestars case study: impact', bg: '#18142a' } ],
      link: 'nostra.html'
    },
    'elo-rebrand': {
      kicker: 'Eloelo · Rebrand', title: 'Eloelo to Elo Live', role: 'New logo, brand font and brand colours',
      text: ["Eloelo is a live streaming app. The brief was a new logo and brand language that put the “live” front and centre, so people would know straight away that it’s a live streaming platform.",
             "I rebranded the app completely: a new name treatment, a TV-headed mascot with cat ears and an antenna, a new brand font and new brand colours, plus a full set of logo mark variants in 2D and 3D."],
      stats: [],
      images: [
        { src: 'assets/elolive-logo.svg', alt: 'The new Elo Live logo: an orange cat-eared TV mascot beside the elo live wordmark on black', cap: 'The revamped logo', bg: '#0b0b0f', pad: true },
        { src: 'assets/eloelo-old-logo.webp', alt: 'The previous Eloelo logo: a purple TV icon with a gold coin and the eloelo wordmark', cap: 'The previous logo', bg: '#ffffff', pad: true },
        { src: 'assets/elo-variants.svg', alt: 'Logo mark variants: Gradient 3D, Gradient 2D, Solid 2D, White 3D, White 2D, Black 3D and Black 2D', cap: 'Logo mark variants', bg: '#ffffff', pad: true },
        { src: 'assets/elo-mascot.svg', alt: 'The Elo Live mascot', cap: 'The mascot', bg: '#ffc83a', pad: true } ],
      link: 'eloelo.html'
    },
    'elo-stickers': {
      kicker: 'Eloelo · Illustration', title: 'Bollywood Stickers', role: 'Illustrated stickers for live chat',
      text: ["The brief was a set of stickers that would help viewers react to streamers in a livelier way, right in the comments.",
             "I chose Bollywood as the theme, because it was the most relatable subject for the audience, and illustrated iconic movie moments and dialogues as sticker reactions: from “Bas!!” to “Mogambo khush hua!”"],
      stats: [],
      images: [
        { src: 'assets/elo-stickers-all.webp', alt: 'All five Bollywood comment stickers', cap: 'The sticker set', bg: '#fff8ec' },
        { src: 'assets/elo-sticker-sweety.webp', alt: 'Sticker: Sweety tera drama!', cap: '“Sweety tera drama!”', bg: '#fff8ec', pad: true },
        { src: 'assets/elo-sticker-babu-rao.webp', alt: 'Sticker: Mast joke mara re!', cap: '“Mast joke mara re!”', bg: '#fff8ec', pad: true },
        { src: 'assets/elo-sticker-bas.webp', alt: 'Sticker: Bas!!', cap: '“Bas!!”', bg: '#fff8ec', pad: true },
        { src: 'assets/elo-sticker-nahii.webp', alt: 'Sticker: Nahii!!', cap: '“Nahii!!”', bg: '#fff8ec', pad: true },
        { src: 'assets/elo-sticker-mogambo.webp', alt: 'Sticker: Mogambo khush hua!', cap: '“Mogambo khush hua!”', bg: '#fff8ec', pad: true } ],
      link: 'eloelo-stickers.html'
    },
    'elo-cards': {
      kicker: 'Eloelo · Growth design', title: 'Shareable Stream Cards', role: 'Share cards for live streams',
      text: ["Streamers and viewers could share a stream from the app, and this card is what got shared to other social platforms to invite more people in.",
             "I designed a themed card for each kind of stream: quizzes, comedy, cricket, Bollywood, chit chat, singing, news and sports. Each one has the streamer’s photo in a glowing live ring and a clear “Watch this live on eloelo app” call to action."],
      stats: [['+150%', 'Average viewers per stream after the cards went live']],
      images: [
        { src: 'assets/elo-cards-all.webp', alt: 'All eight shareable stream cards', cap: 'Eight stream themes', bg: '#221a3c' },
        { src: 'assets/elo-card-quiz.webp', alt: 'Share card: Play Quiz live', cap: 'Quiz', bg: '#221a3c' },
        { src: 'assets/elo-card-comedy.webp', alt: 'Share card: Live Comedy', cap: 'Live comedy', bg: '#221a3c' },
        { src: 'assets/elo-card-premier-league.webp', alt: 'Share card: Eloelo Premier League', cap: 'Eloelo Premier League', bg: '#221a3c' },
        { src: 'assets/elo-card-bollywood-quiz.webp', alt: 'Share card: Bollywood Quiz', cap: 'Bollywood quiz', bg: '#221a3c' },
        { src: 'assets/elo-card-chit-chat.webp', alt: 'Share card: Chit Chat', cap: 'Chit chat', bg: '#221a3c' },
        { src: 'assets/elo-card-singing.webp', alt: 'Share card: Live Singing', cap: 'Live singing', bg: '#221a3c' },
        { src: 'assets/elo-card-news.webp', alt: 'Share card: Live News 24x7', cap: 'News 24x7', bg: '#221a3c' },
        { src: 'assets/elo-card-sports-quiz.webp', alt: 'Share card: Sports Quiz', cap: 'Sports quiz', bg: '#221a3c' } ],
      link: 'eloelo-cards.html'
    },
    abyx: {
      kicker: 'RMIT · Typography', title: 'ABYX', role: 'A controller-based type system',
      text: ["ABYX is a speculative type system for accessible communication. It maps the 26 letters to three-button combinations using only the A, B, X and Y buttons of a game controller.",
             "Game controllers are already built for comfort and repetition. ABYX borrows that logic so someone with limited hand movement can type with a thumb. The full page has a live demo you can type with."],
      stats: [['26', 'Letters, each typed with three presses'], ['4', 'Buttons used: A, B, X and Y']],
      images: [
        { src: 'assets/abyx-cover.webp', alt: 'A game controller beside the letters A, B, Y and X', cap: 'The specimen cover', bg: '#ffffff' },
        { src: 'assets/abyx-hand-1.webp', alt: 'A thumb on the face buttons of a controller', cap: 'Typed with one thumb', bg: '#e8e2d8' },
        { src: 'assets/abyx-hand-2.webp', alt: 'A thumb pressing a different face button', cap: 'Three presses make a letter', bg: '#e8e2d8' } ],
      link: 'abyx.html'
    },
    buzzar: {
      kicker: 'RMIT · Research project', title: 'Buzzar', role: 'From rice bag to hand bag',
      text: ["Buzzar is a brand that turns discarded Indian rice bags into fashion totes. It was my final research project: can branding give a thrown-away object a new meaning?",
             "I tried a coffee tumbler and a grocery bag first, and both failed. The rice bag worked because its own graphics already tell the story of where it came from. Buzzar is a concept shown in mockups."],
      stats: [['3', 'Objects tested before the idea worked']],
      images: [
        { src: 'assets/buzzar-tote.webp', alt: 'A tote made from a patchwork of rice bag graphics', cap: 'The tote', bg: '#d9a520' },
        { src: 'assets/buzzar-logo-light.webp', alt: 'The Buzzar logo: a double Z above the wordmark', cap: 'The double-Z mark', bg: '#ffffff' },
        { src: 'assets/buzzar-patchwork.webp', alt: 'The final patchwork surface', cap: 'Final patchwork', bg: '#f2f2f6' },
        { src: 'assets/buzzar-ad-1.webp', alt: 'Campaign poster: You carry style. We carry purpose.', cap: '“You carry style. We carry purpose.”', bg: '#c8562c' },
        { src: 'assets/buzzar-ad-2.webp', alt: 'Campaign poster: Not just rice. Twice as nice.', cap: '“Not just rice. Twice as nice.”', bg: '#2c6fc0' },
        { src: 'assets/buzzar-tumbler-2.webp', alt: 'Early phase poster: Spill the Kaapi', cap: 'Phase 1: the tumbler that did not work', bg: '#d01f3a' } ],
      link: 'buzzar.html'
    },
    unhappy: {
      kicker: 'RMIT · Student spec campaign', title: 'UnHappy Meal', role: 'Culture-jamming posters',
      text: ["A student concept, not a real advertisement, and not affiliated with McDonald’s.",
             "Five posters borrow the cute, friendly look of fast-food advertising and swap each promise for its consequence. The posters read as familiar first, and wrong a second later."],
      stats: [],
      images: [1, 2, 3, 4, 5].map(function (i) { return { src: 'assets/uhm-' + i + '.webp', alt: 'UnHappy Meal poster ' + i, cap: ['Obesity: the road to Happy Meal', 'Heart disease: the Happy Meal that everyone wants', 'Heart attack: perfect for a late night meal', 'Delivering your favourite meal, medical bills', 'Upgrade to bigger fries, bigger waist'][i - 1], bg: '#d01f27' }; }),
      link: 'unhappy-meal.html'
    },
    novo: {
      kicker: 'Glance · Brand identity', title: 'Novo Brand Identity', role: 'Logo, logo presentation, launch posters and mailers',
      text: ["Novo is the news app on the Glance lock screen: breaking headlines and personalised updates, without unlocking your phone.",
             "The brief was a logo with the tagline \u201cWhat\u2019s New\u201d. After studying Google News, Inshorts, Flipboard and Apple News, I drew dozens of wordmarks and pitched four directions.",
             "The final mark hides a pair of quotation marks inside the letters. The name comes from the Latin novus, meaning new, and the lower-case type and Novo Orange keep it friendly and easy to spot on a lock screen.",
             "I designed the deck that presented the logo, directed the logo animation, worked on the brand book with the Glance brand team, and designed the posters and mailers for the internal launch."],
      stats: [['10\u00d7', 'Average views per article, from 2,000 to 20,000'], ['18%', 'Average click-through rate, up from 4%']],
      images: [
        { src: 'assets/novo-final-filled.svg', alt: 'Final Novo logo reversed out of Novo Orange', cap: 'Final logo, reversed out of Novo Orange', bg: '#ff4f00', pad: true },
        { src: 'assets/novo-final-outline.svg', alt: 'Final Novo logo in Novo Orange', cap: 'Final logo in Novo Orange', bg: '#ffffff', pad: true },
        { src: 'assets/novo-initial-1.svg', alt: 'Initial Novo logo concept 1', cap: 'Initial concept 1 of 4', bg: '#ffffff', pad: true },
        { src: 'assets/novo-initial-2.svg', alt: 'Initial Novo logo concept 2', cap: 'Initial concept 2 of 4', bg: '#ffffff', pad: true },
        { src: 'assets/novo-initial-3.svg', alt: 'Initial Novo logo concept 3', cap: 'Initial concept 3 of 4', bg: '#ffffff', pad: true },
        { src: 'assets/novo-initial-4.svg', alt: 'Initial Novo logo concept 4', cap: 'Initial concept 4 of 4', bg: '#ffffff', pad: true },
        { src: 'assets/novo-explore-1.webp', alt: 'Working sheet: a grid of black Novo wordmark options', cap: 'Wordmark exploration, sheet 1', bg: '#ffffff' },
        { src: 'assets/novo-explore-3.webp', alt: 'Working sheet: more Novo wordmark options', cap: 'Wordmark exploration, sheet 2', bg: '#ffffff' },
        { src: 'assets/novo-deck-1.webp', alt: 'Presentation cover slide: Novo, logo design presentation, June 2023', cap: 'Logo presentation: cover', bg: '#ffffff' },
        { src: 'assets/novo-deck-3.webp', alt: 'Slide titled Visual Element, explaining the quotation marks', cap: 'Logo presentation: the visual element', bg: '#ffffff' },
        { src: 'assets/novo-deck-8.webp', alt: 'Slide showing the final Novo logo in orange', cap: 'Logo presentation: the final mark', bg: '#ffffff' },
        { src: 'assets/novo-bb-10.webp', alt: 'Brand book page: Novo and Glance logos side by side', cap: 'Brand book: co-branding with Glance', bg: '#f6f3ee' },
        { src: 'assets/novo-bb-35.webp', alt: 'Brand book page: quotation marks used over an image', cap: 'Brand book: quotes on images', bg: '#f6f3ee' },
        { src: 'assets/novo-bb-42.webp', alt: 'Brand book page: tone of voice', cap: 'Brand book: tone of voice', bg: '#f6f3ee' },
        { src: 'assets/novo-poster-1.webp', alt: 'Orange poster: A new way to news is coming your way', cap: 'Teaser poster', bg: '#ff3d00' },
        { src: 'assets/novo-poster-2.webp', alt: 'Orange poster with the Novo logo: Bringing life back to news', cap: 'Launch poster', bg: '#ff3d00' },
        { src: 'assets/novo-mail-3.webp', alt: 'Navy mailer: We are bringing life back to news', cap: 'Reveal mailer', bg: '#12122e' },
        { src: 'assets/novo-mail-4.webp', alt: 'Orange mailer: Novo is here, fresh and new', cap: 'Launch-day mailer', bg: '#ff3d00' } ],
      link: 'novo.html'
    },
    ftb: {
      kicker: 'Glance · Campaign · 2023', title: 'Feel The Blue', role: 'Campaign logomark and lock screen wallpapers',
      text: ["A Glance lock screen campaign cheering on India at the 2023 Cricket World Cup, and letting around 150 million Glance users know that cricket content and live scores were right there on their lock screen.",
             "I designed the campaign logomark first, then a series of wallpapers paying tribute to highlight moments by Indian batsmen across World Cups. The art style was inspired by Nike\u2019s \u201cBleed Blue\u201d campaign from the 2011 World Cup."],
      stats: [['+35%', 'Click-through rate on the campaign wallpapers'], ['50M', 'Live-score viewers, up from 10 million']],
      images: [
        { src: 'assets/ftb-logo.jpg', alt: 'Feel The Blue campaign logomark on blue', cap: 'Campaign logomark', bg: '#018cdb' },
        { src: 'assets/ftb-wall-1.webp', alt: 'Lock screen wallpaper: a 1983 World Cup batting moment in blue', cap: 'Lock screen wallpaper 1 of 3', bg: '#eef0fb' },
        { src: 'assets/ftb-wall-2.webp', alt: 'Lock screen wallpaper: a batsman raising his bat, 2019', cap: 'Lock screen wallpaper 2 of 3', bg: '#eef0fb' },
        { src: 'assets/ftb-wall-3.webp', alt: 'Lock screen wallpaper: a batsman celebrating in the India kit', cap: 'Lock screen wallpaper 3 of 3', bg: '#eef0fb' } ]
    },
    oneweather: {
      kicker: 'Glance · Brand launch', title: '1Weather: Own the Day', role: 'Key visuals and posters',
      text: ["1Weather is a hyperlocal weather forecast app with over 100 million users. For its brand launch I designed the key visuals and marketing collateral, like posters, in line with the brand guidelines.",
             "The campaign line, \u201cOwn the day\u201d, frames the forecast as a way to plan your day better, whether that means fresh snow, a beach day, or leaving the office before the rain."],
      stats: [['50,000', 'Downloads in the first month, about 200% higher than before'], ['+25%', 'Daily active users after the launch']],
      images: [
        { src: 'assets/1w-wall-03.jpg', alt: 'Key visual: a snowboarder hiking through fresh snow, \u201cOwn the day\u201d', cap: 'Key visual 1 of 4' },
        { src: 'assets/1w-wall-04.jpg', alt: 'Key visual: relaxing in a deck chair on a sunny beach, \u201cOwn the day\u201d', cap: 'Key visual 2 of 4' },
        { src: 'assets/1w-wall-05.jpg', alt: 'Key visual: two friends kayaking at sunset, \u201cOwn the day\u201d', cap: 'Key visual 3 of 4' },
        { src: 'assets/1w-wall-07.jpg', alt: 'Key visual: a couple camping in the hills, \u201cOwn the day\u201d', cap: 'Key visual 4 of 4' },
        { src: 'assets/1w-poster-01.jpg', alt: 'Poster: From grocery runs to kayaking', cap: 'Poster 1 of 3', bg: '#eef0fb' },
        { src: 'assets/1w-poster-02.jpg', alt: 'Poster: Pack for the perfect trip', cap: 'Poster 2 of 3', bg: '#eef0fb' },
        { src: 'assets/1w-poster-03.jpg', alt: 'Poster: Leave office at 5. \u2019Coz rain starts at 5:32', cap: 'Poster 3 of 3', bg: '#eef0fb' } ],
      link: 'oneweather.html'
    }
  };

  var V = null, vCase = null, vIdx = 0, vLastFocus = null;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function buildViewer() {
    V = el('div', 'qv');
    V.hidden = true;
    V.setAttribute('role', 'dialog'); V.setAttribute('aria-modal', 'true'); V.setAttribute('aria-labelledby', 'qv-title');
    V.innerHTML =
      '<div class="qv__panel">' +
        '<div class="qv__bar"><div><p class="qv__kicker"></p><h2 class="qv__title" id="qv-title"></h2></div>' +
        '<button class="qv__close" type="button" aria-label="Back to the game"><span class="ico ico--left" aria-hidden="true"></span><span> Back to game</span></button></div>' +
        '<div class="qv__body">' +
          '<div class="qv__media"><div class="qv__frame"><div class="qv__img" title="View full screen"><img alt=""></div>' +
            '<button class="qv__zoom" type="button" aria-label="View this image full screen"><span aria-hidden="true">\u26F6</span> Full screen</button>' +
            '<button class="qv__nav qv__prev" type="button" aria-label="Previous image"><span class="ico ico--left" aria-hidden="true"></span></button>' +
            '<button class="qv__nav qv__next" type="button" aria-label="Next image"><span class="ico ico--right" aria-hidden="true"></span></button></div>' +
            '<p class="qv__cap"><span class="qv__cap-text"></span><span class="qv__count"></span></p>' +
            '<div class="qv__thumbs" role="group" aria-label="All images"></div></div>' +
          '<div class="qv__info"><p class="qv__role"></p><div class="qv__text"></div><div class="qv__stats"></div>' +
            '<a class="qv__link" href="#">Read the full case study <span class="ico-arrow" aria-hidden="true"></span></a></div>' +
        '</div>' +
        '<p class="qv__keys">Arrow keys to browse \u00b7 F for full screen \u00b7 Esc or X to go back to the game</p>' +
      '</div>' +
      '<div class="qv__full" hidden>' +
        '<img alt="">' +
        '<button class="qv__nav qv__fprev" type="button" aria-label="Previous image"><span class="ico ico--left" aria-hidden="true"></span></button>' +
        '<button class="qv__nav qv__fnext" type="button" aria-label="Next image"><span class="ico ico--right" aria-hidden="true"></span></button>' +
        '<button class="qv__close qv__fclose" type="button" aria-label="Close full screen">Close</button>' +
        '<p class="qv__fcap"></p>' +
      '</div>';
    document.body.appendChild(V);
    V.querySelector('.qv__close').addEventListener('click', closeViewer);
    V.querySelector('.qv__prev').addEventListener('click', function () { showImage(vIdx - 1); });
    V.querySelector('.qv__next').addEventListener('click', function () { showImage(vIdx + 1); });
    V.querySelector('.qv__img').addEventListener('click', function () { setFull(true); });
    V.querySelector('.qv__zoom').addEventListener('click', function () { setFull(true); });
    V.querySelector('.qv__fclose').addEventListener('click', function () { setFull(false); });
    V.querySelector('.qv__fprev').addEventListener('click', function (e) { e.stopPropagation(); showImage(vIdx - 1); });
    V.querySelector('.qv__fnext').addEventListener('click', function (e) { e.stopPropagation(); showImage(vIdx + 1); });
    V.querySelector('.qv__full').addEventListener('click', function (e) { if (e.target === e.currentTarget || e.target.tagName === 'IMG') setFull(false); });
    V.addEventListener('click', function (e) { if (e.target === V) closeViewer(); });
    V.addEventListener('keydown', function (e) {
      var full = !V.querySelector('.qv__full').hidden;
      if (full && (e.key === 'Escape' || e.key === 'x' || e.key === 'X' || e.key === 'f' || e.key === 'F')) { e.preventDefault(); setFull(false); }
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); setFull(true); }
      else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') { e.preventDefault(); closeViewer(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); showImage(vIdx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); showImage(vIdx + 1); }
      else if (e.key === 'Tab') {                  // keep focus inside the window
        var f = V.querySelectorAll(full ? '.qv__full button' : '.qv__panel button, .qv__panel a[href]'), first = f[0], lastEl = f[f.length - 1];
        for (var j = 0; j < f.length; j++) if (f[j].offsetParent !== null) { first = f[j]; break; }
        for (var i = f.length - 1; i >= 0; i--) if (f[i].offsetParent !== null) { lastEl = f[i]; break; }
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
  }
  function setFull(on) {
    var F = V.querySelector('.qv__full');
    F.hidden = !on;
    if (on) { syncFull(); F.querySelector('.qv__fclose').focus({ preventScroll: true }); } else V.focus({ preventScroll: true });
  }
  function syncFull() {
    var F = V.querySelector('.qv__full'), it = vCase.images[vIdx], n = vCase.images.length;
    F.querySelector('img').src = it.src; F.querySelector('img').alt = it.alt;
    F.querySelector('.qv__fcap').textContent = (it.cap ? it.cap + '  \u00b7  ' : '') + (vIdx + 1) + ' / ' + n;
    F.querySelector('.qv__fprev').hidden = F.querySelector('.qv__fnext').hidden = n < 2;
  }
  function showImage(i) {
    var imgs = vCase.images, n = imgs.length;
    vIdx = (i + n) % n;
    var it = imgs[vIdx], box = V.querySelector('.qv__img'), im = box.querySelector('img');
    im.src = it.src; im.alt = it.alt;
    box.style.background = it.bg || '#1c2230';
    box.classList.toggle('is-pad', !!it.pad);
    V.querySelector('.qv__cap-text').textContent = it.cap || '';
    V.querySelector('.qv__count').textContent = (vIdx + 1) + ' / ' + n;
    V.querySelectorAll('.qv__thumb').forEach(function (b, k) { b.setAttribute('aria-current', k === vIdx ? 'true' : 'false'); });
    var nb = imgs[(vIdx + 1) % n]; if (nb) { var pre = new Image(); pre.src = nb.src; }
    if (!V.querySelector('.qv__full').hidden) syncFull();
  }
  function openViewer(id) {
    var c = CASES[id]; if (!c) return;
    if (!V) buildViewer();
    vCase = c; S.mode = 'view'; S.seen[id] = true; held = [];
    V.querySelector('.qv__kicker').textContent = c.kicker;
    V.querySelector('.qv__title').textContent = c.title;
    V.querySelector('.qv__role').textContent = c.role;
    V.querySelector('.qv__text').innerHTML = c.text.map(function (t) { return '<p>' + t + '</p>'; }).join('');
    V.querySelector('.qv__stats').hidden = !c.stats.length;
    V.querySelector('.qv__stats').innerHTML = c.stats.map(function (st) {
      return '<div class="qv__stat"><strong>' + st[0] + '</strong><p>' + st[1] + '</p></div>';
    }).join('');
    var link = V.querySelector('.qv__link');
    link.hidden = !c.link; if (c.link) link.href = c.link;
    var th = V.querySelector('.qv__thumbs'); th.innerHTML = '';
    c.images.forEach(function (it, k) {
      var b = el('button', 'qv__thumb' + (it.pad ? ' is-pad' : ''));
      b.type = 'button'; b.setAttribute('aria-label', 'Image ' + (k + 1) + ': ' + (it.cap || it.alt));
      if (it.bg) b.style.background = it.bg;
      var ti = el('img'); ti.src = it.src; ti.alt = ''; ti.loading = 'lazy'; b.appendChild(ti);
      b.addEventListener('click', function () { showImage(k); });
      th.appendChild(b);
    });
    V.querySelector('.qv__nav.qv__prev').hidden = V.querySelector('.qv__nav.qv__next').hidden = c.images.length < 2;
    showImage(0);
    vLastFocus = document.activeElement;
    V.hidden = false;
    document.documentElement.classList.add('qv-open');
    V.querySelector('.qv__panel').scrollTop = 0;
    V.setAttribute('tabindex', '-1'); V.focus({ preventScroll: true });   // focus the window itself, so no button looks pre-selected
  }
  function closeViewer() {
    if (V) V.querySelector('.qv__full').hidden = true;
    if (!V || V.hidden) return;
    V.hidden = true;
    document.documentElement.classList.remove('qv-open');
    if (S.mode === 'view') S.mode = 'play';
    try { (vLastFocus && vLastFocus !== document.body ? vLastFocus : root).focus({ preventScroll: true }); } catch (e) { root.focus(); }
  }

  /* taller game screen on phones held upright --------------------------- */
  var mqTall = window.matchMedia ? window.matchMedia('(max-width: 700px) and (orientation: portrait)') : null;
  function setView() {
    var tall = !!(mqTall && mqTall.matches), nh = tall ? 224 : 160;
    if (nh !== VH) { VH = nh; cv.height = VH; ctx.imageSmoothingEnabled = false; }
    root.classList.toggle('is-tall', tall);
  }
  setView();
  if (mqTall) { if (mqTall.addEventListener) mqTall.addEventListener('change', setView); else if (mqTall.addListener) mqTall.addListener(setView); }

  /* loop --------------------------------------------------------------- */
  var raf = 0, last = 0, visible = true;
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    update(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) run(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && !document.hidden) run(); else stop(); }).observe(root);
  }

  buildLayer();
  drawRoom(glanceRoom);
  drawRoom(arcadeRoom);
  drawRoom(studioRoom);
  drawRoom(critRoom);
  newGame();
  run();

  window.__designQuest = { state: function () { return S; }, map: function () { return cur.id; }, start: start, action: action, press: press, release: release,
    enterRoom: enterRoom, _layer: function () { return L.canvas; },
    _assets: function () {          // every building, tile and prop on its own transparent canvas (for the Figma sprite sheet)
      var out = [];
      function mk(name, w, h, fn) { var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; fn(g); out.push({ name: name, w: w, h: h, url: c.toDataURL() }); }
      buildings.forEach(function (b) {
        var mt = 16, ms = 6;
        mk('building/' + b.id, b.w * T + ms * 2, b.h * T + mt + 6, function (g) { g.translate(ms - b.x * T, mt - b.y * T); drawBuilding(g, b); });
      });
      var TN = { 0: 'grass', 1: 'path', 3: 'water', 4: 'flower', 5: 'tall-grass', 6: 'fence', 7: 'bridge', 8: 'stone', 9: 'tram-track', 10: 'field', 11: 'graffiti', 13: 'pitch', 14: 'plaza' };
      Object.keys(TN).forEach(function (k) {
        var t = +k, pos = null;
        for (var y = 0; y < MH && !pos; y++) for (var x = 0; x < MW; x++) if (map[y][x] === t) { pos = [x, y]; break; }
        if (!pos) return;
        mk('tile/' + TN[k], T, T, function (g) { g.translate(-pos[0] * T, -pos[1] * T); drawTile(g, t, pos[0], pos[1]); });
      });
      mk('prop/tree', 32, 32, function (g) { treeBlock(g, 0, 0); });
      ['sign', 'streamrig', 'crates', 'tramstop'].forEach(function (k) { mk('prop/' + k, T, T + 4, function (g) { g.translate(0, 4); drawObject(g, { kind: k, x: 0, y: 0 }); }); });
      return out;
    }, openViewer: openViewer, closeViewer: closeViewer,
    _sprites: function () { var out = []; function add(g, n, c) { out.push({ g: g, n: n, u: c.toDataURL() }); }
      ['down','up','left','right'].forEach(function (d) { [0,1,3].forEach(function (f) { add('Shyam', d + ' ' + f, charSprite('shyam', d, f)); }); });
      ['down','up','left','right'].forEach(function (d) { [0,1].forEach(function (f) { add('Cat', d + ' ' + f, catGrid(d, f)); }); });
      things.concat(glanceRoom.things, arcadeRoom.things, studioRoom.things).forEach(function (t) { if (t.kind === 'npc') ['down','up','left','right'].forEach(function (d) { add(t.who, d, charSprite(NPC_SPRITE[t.who], d, 0)); }); });
      return out; },
    teleport: function (x, y) { S.p.x = S.p.fx = x; S.p.y = S.p.fy = y; S.cat.x = S.cat.fx = x - 1; S.cat.y = S.cat.fy = y; } };
})();
