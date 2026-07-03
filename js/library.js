/*
 * The extended element library: ~270 real-world particles beyond the classic
 * set, all defined as data on top of the same physics engine. Interactions
 * come from real chemistry/physics wherever the cellular automaton can
 * express them: alkali metals explode in water, thermite melts into iron,
 * acids corrode metal but not gold, CO2 smothers fire, baking soda
 * neutralizes vinegar, styrofoam dissolves in acetone, and so on.
 */

export function defineLibraryElements(reg) {
  const d = (spec) => reg.define(spec);

  // ======================================================== GASES (23)
  d({ name: 'Hydrogen', cat: 'gas', colors: ['#cfe8ff', '#dceeff'], density: 0.00009, tags: ['flammgas'],
      flamm: 0.95, burnTime: 2, burnInto: 'steam', explosive: { r: 6, byFire: true }, desc: 'Lightest gas. Violently flammable (Hindenburg).' });
  d({ name: 'Oxygen', cat: 'gas', colors: ['#bcd8ff', '#c8e0ff'], density: 0.0014,
      reactions: [{ with: 'fire', p: 0.35, spawn: 'fire', self: '' }], desc: 'Feeds fire and makes it rage.' });
  d({ name: 'Nitrogen', cat: 'gas', colors: ['#c4ccd4', '#ccd4dc'], density: 0.00116, desc: 'Inert gas, 78% of air.' });
  d({ name: 'Helium', cat: 'gas', colors: ['#ffe8f4', '#fff0f8'], density: 0.00018, desc: 'Inert, rises fast.' });
  d({ name: 'Neon', cat: 'gas', colors: ['#ff5050', '#ff7060', '#ff4040'], density: 0.0009, glow: true, desc: 'Inert noble gas, glows red-orange.' });
  d({ name: 'Argon', cat: 'gas', colors: ['#b8a8e8', '#c4b4f0'], density: 0.0018, desc: 'Inert noble gas, heavier than air.' });
  d({ name: 'Radon', cat: 'gas', colors: ['#98e090', '#a8e8a0'], density: 0.0097, tags: ['radioactive', 'toxic'], tox: 0.3, desc: 'Radioactive gas that pools in low spots.' });
  d({ name: 'Chlorine', cat: 'gas', colors: ['#c8e060', '#d0e870'], density: 0.003, tags: ['toxic'], tox: 0.7,
      dissolve: [{ in: 'water', into: '', otherInto: 'hydrochloric acid', p: 0.02 }], desc: 'Toxic yellow-green gas; forms acid in water.' });
  d({ name: 'Fluorine', cat: 'gas', colors: ['#e8f0a0', '#f0f8b0'], density: 0.0017, tags: ['toxic'], tox: 0.8, corrosive: 0.5,
      desc: 'The most reactive element. Corrodes nearly everything.' });
  d({ name: 'Carbon Dioxide', cat: 'gas', colors: ['#9aa4ae', '#a4aeb8'], density: 0.002,
      reactions: [{ with: 'fire', p: 0.6, other: '' }], coldInto: 'dry ice', coldP: 0.01, cryoInto: 'dry ice', cryoP: 0.6,
      desc: 'Heavier than air; smothers flames.' });
  d({ name: 'Carbon Monoxide', cat: 'gas', colors: ['#b0a8a8', '#b8b0b0'], density: 0.00115, tags: ['toxic'], tox: 0.6,
      flamm: 0.5, burnTime: 3, burnInto: 'carbon dioxide', desc: 'Invisible killer; burns blue into CO2.' });
  d({ name: 'Methane', cat: 'gas', colors: ['#c0d8b8', '#c8e0c0'], density: 0.0007, tags: ['flammgas'],
      flamm: 0.9, burnTime: 2, burnInto: 'carbon dioxide', explosive: { r: 5, byFire: true }, desc: 'Swamp gas. Goes boom.' });
  d({ name: 'Propane', cat: 'gas', colors: ['#c8c8a0', '#d0d0a8'], density: 0.002, tags: ['flammgas'],
      flamm: 0.9, burnTime: 2, burnInto: 'carbon dioxide', explosive: { r: 6, byFire: true }, desc: 'Heavier than air; pools then explodes.' });
  d({ name: 'Butane', cat: 'gas', colors: ['#d0c8a0', '#d8d0a8'], density: 0.0025, tags: ['flammgas'],
      flamm: 0.9, burnTime: 2, burnInto: 'carbon dioxide', explosive: { r: 6, byFire: true }, desc: 'Lighter fuel.' });
  d({ name: 'Natural Gas', cat: 'gas', colors: ['#c4d4c4', '#ccdccc'], density: 0.0008, tags: ['flammgas'],
      flamm: 0.85, burnTime: 2, burnInto: 'carbon dioxide', explosive: { r: 5, byFire: true }, desc: 'Mostly methane.' });
  d({ name: 'Acetylene', cat: 'gas', colors: ['#e0d0c0', '#e8d8c8'], density: 0.0011, tags: ['flammgas'],
      flamm: 1, burnTime: 2, burnInto: 'carbon dioxide', explosive: { r: 8, byFire: true }, desc: 'Welding gas; hottest flame.' });
  d({ name: 'Ammonia', cat: 'gas', colors: ['#d8e8e8', '#e0f0f0'], density: 0.0007, tags: ['toxic', 'base'], tox: 0.4,
      desc: 'Pungent alkaline gas. Never mix with bleach.' });
  d({ name: 'Ozone', cat: 'gas', colors: ['#a0c8f0', '#a8d0f8'], density: 0.0021, tags: ['toxic'], tox: 0.2,
      reactions: [{ with: 'fire', p: 0.3, spawn: 'fire', self: 'oxygen' }], desc: 'Sharp-smelling oxidizer.' });
  d({ name: 'Sulfur Dioxide', cat: 'gas', colors: ['#d0c880', '#d8d088'], density: 0.0029, tags: ['toxic'], tox: 0.4,
      dissolve: [{ in: 'water', into: '', otherInto: 'sulfuric acid', p: 0.01 }], desc: 'Volcanic gas; makes acid rain.' });
  d({ name: 'Hydrogen Sulfide', cat: 'gas', colors: ['#c0c070', '#c8c878'], density: 0.0015, tags: ['toxic'], tox: 0.5,
      flamm: 0.6, burnTime: 3, burnInto: 'sulfur dioxide', desc: 'Rotten-egg gas: toxic and flammable.' });
  d({ name: 'Nitrous Oxide', cat: 'gas', colors: ['#d8d8f0', '#e0e0f8'], density: 0.002,
      reactions: [{ with: 'fire', p: 0.25, spawn: 'fire', self: 'nitrogen' }], desc: 'Laughing gas; oxidizer in engines.' });
  d({ name: 'Toxic Gas', cat: 'gas', colors: ['#90c030', '#98c838', '#88b828'], density: 0.0025, tags: ['toxic'], tox: 0.8,
      decay: { life: [400, 900], into: '' }, desc: 'Choking fumes. Kills anything alive.' });
  d({ name: 'Acid Gas', cat: 'gas', colors: ['#c09040', '#c89848'], density: 0.0026, tags: ['toxic'], tox: 0.5, corrosive: 0.1,
      decay: { life: [300, 700], into: '' }, desc: 'Brown corrosive fumes (NO2).' });
  d({ name: 'Plasma', cat: 'gas', colors: ['#ff80ff', '#c060ff', '#ff60c0'], density: 0.00008, glow: true,
      tags: ['hot', 'magma'], decay: { life: [30, 80], into: 'fire' }, desc: 'Fourth state of matter. Hotter than anything.' });

  // ======================================================== ACIDS & BASES (7)
  d({ name: 'Sulfuric Acid', cat: 'liquid', colors: ['#c8e830', '#d0f038', '#b8d828'], density: 1.8, corrosive: 0.8,
      hotInto: 'acid gas', hotP: 0.02, desc: 'The classic ACID. Eats metal and flesh, not glass.' });
  d({ name: 'Hydrochloric Acid', cat: 'liquid', colors: ['#d8e888', '#e0f090'], density: 1.2, corrosive: 0.6,
      desc: 'Stomach acid. Dissolves metals into fumes.' });
  d({ name: 'Nitric Acid', cat: 'liquid', colors: ['#e8d868', '#f0e070'], density: 1.5, corrosive: 0.7,
      reactions: [{ with: '#metal', p: 0.05, spawn: 'acid gas' }], desc: 'Fuming oxidizer; brown gas over metals.' });
  d({ name: 'Aqua Regia', cat: 'liquid', colors: ['#f0a030', '#f8a838'], density: 1.6, corrosive: 0.9,
      reactions: [{ with: 'gold', p: 0.12, other: '' }, { with: 'platinum', p: 0.08, other: '' }],
      desc: 'The only acid that dissolves gold.' });
  d({ name: 'Hydrofluoric Acid', cat: 'liquid', colors: ['#b8e8d0', '#c0f0d8'], density: 1.15, corrosive: 0.5, tags: ['toxic'], tox: 0.5,
      reactions: [{ with: 'glass', p: 0.15, other: '' }, { with: 'quartz', p: 0.1, other: '' }],
      desc: 'Etches even glass. Horribly toxic.' });
  d({ name: 'Lye', cat: 'liquid', colors: ['#e8e8f8', '#f0f0ff'], density: 1.3, tags: ['base'], corrosive: 0.3,
      desc: 'Caustic soda solution; dissolves grease and flesh.' });
  d({ name: 'Vinegar', cat: 'liquid', colors: ['#e8dcb0', '#f0e4b8'], density: 1.01, corrosive: 0.04, tags: ['wet'],
      desc: 'Weak acid. Fizzes on baking soda.' });

  // ======================================================== FUELS & SOLVENTS (12)
  d({ name: 'Gasoline', cat: 'liquid', colors: ['#e8c8a0', '#f0d0a8'], density: 0.75, tags: ['organic'],
      flamm: 0.9, burnTime: 160, burnInto: '', burnSmoke: 0.5, desc: 'Floats on water, ignites instantly.' });
  d({ name: 'Diesel', cat: 'liquid', colors: ['#d0b070', '#d8b878'], density: 0.85, tags: ['organic'],
      flamm: 0.5, burnTime: 260, burnInto: '', burnSmoke: 0.6, desc: 'Slower to light, burns long.' });
  d({ name: 'Kerosene', cat: 'liquid', colors: ['#e0d0a0', '#e8d8a8'], density: 0.8, tags: ['organic'],
      flamm: 0.6, burnTime: 220, burnInto: '', burnSmoke: 0.4, desc: 'Lamp oil and jet fuel base.' });
  d({ name: 'Jet Fuel', cat: 'liquid', colors: ['#d8c890', '#e0d098'], density: 0.8, tags: ['organic'],
      flamm: 0.7, burnTime: 240, burnInto: '', burnSmoke: 0.5, desc: 'Refined kerosene.' });
  d({ name: 'Crude Oil', cat: 'liquid', colors: ['#241c10', '#2c2414'], density: 0.87, viscosity: 0.4, tags: ['organic', 'sticky'],
      flamm: 0.35, burnTime: 320, burnInto: 'tar', burnSmoke: 0.9, desc: 'Thick black gold; filthy smoke.' });
  d({ name: 'Olive Oil', cat: 'liquid', colors: ['#b0b040', '#b8b848'], density: 0.91, viscosity: 0.2, tags: ['organic', 'food'],
      flamm: 0.25, burnTime: 240, burnInto: '', desc: 'Cooking oil. Floats, burns.' });
  d({ name: 'Ethanol', cat: 'liquid', colors: ['#e0e8f0', '#e8f0f8'], density: 0.79, tags: ['organic'],
      flamm: 0.8, burnTime: 120, burnInto: '', burnSmoke: 0.05, decay: { life: [900, 1800], into: '' },
      desc: 'Drinking alcohol. Burns clean, evaporates.' });
  d({ name: 'Methanol', cat: 'liquid', colors: ['#d8e0f0', '#e0e8f8'], density: 0.79, tags: ['organic', 'toxic'], tox: 0.3,
      flamm: 0.8, burnTime: 110, burnInto: '', burnSmoke: 0.02, decay: { life: [800, 1600], into: '' },
      desc: 'Wood alcohol: burns nearly invisibly, poisonous.' });
  d({ name: 'Acetone', cat: 'liquid', colors: ['#e8e8e0', '#f0f0e8'], density: 0.78, tags: ['organic'],
      flamm: 0.85, burnTime: 100, burnInto: '', decay: { life: [500, 1000], into: '' },
      desc: 'Nail polish remover; melts styrofoam.' });
  d({ name: 'Turpentine', cat: 'liquid', colors: ['#d8d0b0', '#e0d8b8'], density: 0.87, tags: ['organic'],
      flamm: 0.7, burnTime: 180, burnInto: '', burnSmoke: 0.6, desc: 'Pine solvent.' });
  d({ name: 'Glycerin', cat: 'liquid', colors: ['#e8e0d0', '#f0e8d8'], density: 1.26, viscosity: 0.6, tags: ['organic', 'sweet'],
      reactions: [{ with: 'nitric acid', p: 0.2, self: 'nitro', other: '' }],
      desc: 'Syrupy; nitric acid turns it into nitroglycerin.' });
  d({ name: 'Biodiesel', cat: 'liquid', colors: ['#c8b860', '#d0c068'], density: 0.88, tags: ['organic'],
      flamm: 0.4, burnTime: 220, burnInto: '', desc: 'Fuel from cooking oil.' });

  // ======================================================== CRYO & OXIDIZER LIQUIDS (5)
  d({ name: 'Liquid Nitrogen', cat: 'liquid', colors: ['#c8e8f8', '#d8f0ff', '#b8e0f0'], density: 0.8, tags: ['cold', 'cryo'],
      decay: { life: [300, 700], into: 'nitrogen' }, desc: '-196°C. Flash-freezes everything, then boils away.' });
  d({ name: 'Liquid Helium', cat: 'liquid', colors: ['#e8f4ff', '#f0f8ff'], density: 0.125, tags: ['cold', 'cryo'],
      decay: { life: [120, 300], into: 'helium' }, desc: 'Coldest liquid there is.' });
  d({ name: 'Liquid Oxygen', cat: 'liquid', colors: ['#a0c8f8', '#a8d0ff'], density: 1.14, tags: ['cold', 'cryo'],
      decay: { life: [300, 600], into: 'oxygen' },
      reactions: [{ with: '#hot', p: 0.5, explode: 6 }], desc: 'Cryogenic oxidizer. Explodes near flame.' });
  d({ name: 'Bromine', cat: 'liquid', colors: ['#a03010', '#a83818'], density: 3.1, tags: ['toxic'], tox: 0.6,
      hotInto: 'toxic gas', hotP: 0.1, decay: { life: [800, 1600], into: 'toxic gas' },
      desc: 'One of two liquid elements; fuming and toxic.' });
  d({ name: 'Hydrogen Peroxide', cat: 'liquid', colors: ['#d8ecf4', '#e0f4fc'], density: 1.45, tags: ['wet'],
      decay: { life: [900, 2000], into: 'water' },
      reactions: [{ with: '#organic', p: 0.02, spawn: 'oxygen' }], desc: 'Fizzes oxygen on contact with organics.' });

  // ======================================================== EVERYDAY LIQUIDS (18)
  d({ name: 'Honey', cat: 'liquid', colors: ['#e8a820', '#f0b028'], density: 1.42, viscosity: 0.9, tags: ['organic', 'food', 'sweet', 'sticky'],
      flamm: 0.05, burnTime: 200, burnInto: 'ash', desc: 'Slow, golden, delicious.' });
  d({ name: 'Maple Syrup', cat: 'liquid', colors: ['#b06818', '#b87020'], density: 1.37, viscosity: 0.85, tags: ['organic', 'food', 'sweet', 'sticky'],
      desc: 'Thick and sweet.' });
  d({ name: 'Milk', cat: 'liquid', colors: ['#f4f4ec', '#fcfcf4'], density: 1.03, tags: ['organic', 'food', 'wet'],
      hotInto: 'steam', hotP: 0.05, desc: 'Does a body good. Cats love it.' });
  d({ name: 'Blood', cat: 'liquid', colors: ['#a01818', '#a82020', '#901010'], density: 1.06, tags: ['organic', 'wet', 'food'],
      hotInto: 'steam', hotP: 0.05, coldInto: 'ice', coldP: 0.01, cryoInto: 'ice', cryoP: 0.8, desc: 'Slightly denser than water.' });
  d({ name: 'Mercury', cat: 'liquid', colors: ['#b8bcc4', '#ccd0d8', '#a8acb4'], density: 13.5, tags: ['metal', 'toxic', 'heavy', 'conductive'], tox: 0.4,
      hotInto: 'toxic gas', hotP: 0.005, desc: 'Liquid metal. Everything floats on it. Toxic vapors.' });
  d({ name: 'Bleach', cat: 'liquid', colors: ['#e0f0e8', '#e8f8f0'], density: 1.1, tags: ['toxic', 'clean', 'base'], tox: 0.4,
      reactions: [{ with: 'ammonia', p: 0.4, self: 'toxic gas', other: 'toxic gas' }],
      desc: 'Kills germs and plants. NEVER mix with ammonia.' });
  d({ name: 'Soap Water', cat: 'liquid', colors: ['#c8e0f0', '#d0e8f8'], density: 1.0, tags: ['wet', 'clean'],
      reactions: [{ with: '#toxic', p: 0.15, other: '' }], hotInto: 'steam', hotP: 0.06, desc: 'Cleans up toxins.' });
  d({ name: 'Antifreeze', cat: 'liquid', colors: ['#40e090', '#48e898'], density: 1.11, tags: ['toxic', 'sweet'], tox: 0.4,
      desc: 'Sweet but deadly. Never freezes.' });
  d({ name: 'Wine', cat: 'liquid', colors: ['#701830', '#781c38'], density: 0.99, tags: ['organic', 'food'],
      flamm: 0.1, burnTime: 60, burnInto: '', desc: 'Mostly water, some ethanol.' });
  d({ name: 'Beer', cat: 'liquid', colors: ['#d09828', '#d8a030'], density: 1.01, tags: ['organic', 'food'], desc: 'Foamy.' });
  d({ name: 'Coffee', cat: 'liquid', colors: ['#382010', '#402818'], density: 1.0, tags: ['organic', 'wet'],
      hotInto: 'steam', hotP: 0.04, desc: 'Hot bean water.' });
  d({ name: 'Tea', cat: 'liquid', colors: ['#985820', '#a06028'], density: 1.0, tags: ['organic', 'wet'],
      hotInto: 'steam', hotP: 0.04, desc: 'Hot leaf water.' });
  d({ name: 'Soda', cat: 'liquid', colors: ['#583018', '#603820'], density: 1.04, tags: ['organic', 'food', 'sweet', 'wet'],
      reactions: [{ with: 'candy', p: 0.3, spawn: 'carbon dioxide' }],
      desc: 'Fizzy sugar water. Drop candy in it.' });
  d({ name: 'Juice', cat: 'liquid', colors: ['#e08018', '#e88820'], density: 1.05, tags: ['organic', 'food', 'sweet', 'wet'], desc: 'Fresh squeezed.' });
  d({ name: 'Mud', cat: 'liquid', colors: ['#584028', '#604830'], density: 1.6, viscosity: 0.7, tags: ['wet'],
      rest: { after: 500, into: 'dirt' }, hotInto: 'dirt', hotP: 0.05, desc: 'Wet dirt. Dries out eventually.' });
  d({ name: 'Quicksand', cat: 'liquid', colors: ['#c0a878', '#c8b080'], density: 1.9, viscosity: 0.85, tags: ['sticky'],
      desc: 'Sand that behaves like a thick liquid.' });
  d({ name: 'Tar', cat: 'liquid', colors: ['#181410', '#201a14'], density: 1.2, viscosity: 0.9, tags: ['organic', 'sticky'],
      flamm: 0.15, burnTime: 500, burnInto: '', burnSmoke: 0.95, desc: 'Sticky, smoky when burned.' });
  d({ name: 'Radioactive Waste', cat: 'liquid', colors: ['#60e020', '#70f030', '#50d010'], density: 1.7, glow: true,
      tags: ['radioactive', 'toxic'], tox: 0.6, desc: 'Glowing green sludge. Keep away from anything alive.' });

  // ======================================================== CRAFT LIQUIDS (12)
  d({ name: 'Resin', cat: 'liquid', colors: ['#c89830', '#d0a038'], density: 1.1, viscosity: 0.8, tags: ['organic', 'sticky'],
      flamm: 0.2, burnTime: 200, burnInto: '', rest: { after: 700, into: 'amber' }, desc: 'Tree sap; hardens into amber.' });
  d({ name: 'Latex', cat: 'liquid', colors: ['#ece8dc', '#f4f0e4'], density: 0.95, viscosity: 0.5, tags: ['organic', 'sticky'],
      rest: { after: 400, into: 'rubber' }, desc: 'Milky sap that cures into rubber.' });
  d({ name: 'Paint', cat: 'liquid', colors: ['#d02020', '#2020d0', '#20b020', '#e0e020'], density: 1.2, viscosity: 0.5, tags: ['organic'],
      flamm: 0.15, burnTime: 100, burnInto: '', desc: 'Multicolored and mildly flammable.' });
  d({ name: 'Ink', cat: 'liquid', colors: ['#101018', '#181820'], density: 1.08, tags: ['organic'], desc: 'Blackens everything it touches.' });
  d({ name: 'Molten Iron', cat: 'liquid', colors: ['#ff9030', '#ffa040', '#f08020'], density: 7, viscosity: 0.5, glow: true,
      tags: ['hot', 'magma', 'metal', 'heavy'], rest: { after: 160, into: 'iron' },
      reactions: [{ with: '#wet', p: 0.5, self: 'iron', other: 'steam' }], desc: '1538°C. Cools back into iron.' });
  d({ name: 'Molten Copper', cat: 'liquid', colors: ['#ff8850', '#ff9058'], density: 8, viscosity: 0.5, glow: true,
      tags: ['hot', 'magma', 'metal', 'heavy'], rest: { after: 150, into: 'copper' },
      reactions: [{ with: '#wet', p: 0.5, self: 'copper', other: 'steam' }], desc: 'Glowing liquid copper.' });
  d({ name: 'Molten Gold', cat: 'liquid', colors: ['#ffc040', '#ffc848'], density: 17, viscosity: 0.5, glow: true,
      tags: ['hot', 'magma', 'metal', 'heavy'], rest: { after: 150, into: 'gold' },
      reactions: [{ with: '#wet', p: 0.5, self: 'gold', other: 'steam' }], desc: 'Liquid treasure.' });
  d({ name: 'Molten Aluminum', cat: 'liquid', colors: ['#e8d8b0', '#f0e0b8'], density: 2.4, viscosity: 0.4, glow: true,
      tags: ['hot', 'magma', 'metal'], rest: { after: 140, into: 'aluminum' },
      reactions: [{ with: '#wet', p: 0.5, self: 'aluminum', other: 'steam' }], desc: 'Melts at only 660°C.' });
  d({ name: 'Molten Lead', cat: 'liquid', colors: ['#c0a888', '#c8b090'], density: 10.6, viscosity: 0.5, glow: true,
      tags: ['hot', 'metal', 'heavy', 'toxic'], tox: 0.2, rest: { after: 130, into: 'lead' },
      reactions: [{ with: '#wet', p: 0.5, self: 'lead', other: 'steam' }], desc: 'Melts on a stovetop.' });
  d({ name: 'Molten Metal', cat: 'liquid', colors: ['#ff9848', '#ffa050'], density: 6, viscosity: 0.5, glow: true,
      tags: ['hot', 'magma', 'metal', 'heavy'], rest: { after: 150, into: 'slag' },
      reactions: [{ with: '#wet', p: 0.5, self: 'slag', other: 'steam' }], desc: 'Generic glowing melt; cools to slag.' });
  d({ name: 'Molten Salt', cat: 'liquid', colors: ['#ffb878', '#ffc080'], density: 1.6, glow: true, tags: ['hot', 'salty'],
      rest: { after: 120, into: 'salt' }, desc: 'Used in solar plants; freezes back to salt.' });
  d({ name: 'Molten Plastic', cat: 'liquid', colors: ['#c8b8d8', '#d0c0e0'], density: 1.0, viscosity: 0.7, tags: ['hot', 'organic', 'sticky'],
      flamm: 0.3, burnTime: 200, burnInto: '', burnSmoke: 0.9, rest: { after: 150, into: 'plastic' }, desc: 'Drippy, smoky when lit.' });

  // ======================================================== POWDERS (44)
  d({ name: 'Dust', cat: 'powder', colors: ['#b0a890', '#b8b098'], density: 0.4, tags: ['organic', 'light'],
      flamm: 0.5, burnTime: 10, burnInto: '', desc: 'Light and surprisingly flammable.' });
  d({ name: 'Soot', cat: 'powder', colors: ['#282828', '#303030'], density: 0.3, tags: ['organic', 'light'],
      flamm: 0.2, burnTime: 30, burnInto: '', desc: 'Chimney black.' });
  d({ name: 'Flour', cat: 'powder', colors: ['#f0ead8', '#f8f2e0'], density: 0.6, tags: ['organic', 'food'],
      flamm: 0.6, burnTime: 6, burnInto: '', explosive: { r: 4, byFire: true },
      dissolve: [{ in: 'water', into: 'dough', otherInto: '', p: 0.15 }],
      desc: 'Dust explosion hazard! Makes dough with water.' });
  d({ name: 'Cornstarch', cat: 'powder', colors: ['#f4f0e0', '#fcf8e8'], density: 0.55, tags: ['organic', 'food'],
      flamm: 0.6, burnTime: 6, burnInto: '', explosive: { r: 4, byFire: true }, desc: 'Fine, flammable powder.' });
  d({ name: 'Sugar', cat: 'powder', colors: ['#f8f4f0', '#fffaf6'], density: 0.85, tags: ['organic', 'food', 'sweet'],
      flamm: 0.25, burnTime: 40, burnInto: 'ash', hotInto: 'caramel', hotP: 0.12,
      dissolve: [{ in: 'water', into: '', otherInto: 'sugar water', p: 0.25 }],
      desc: 'Dissolves in water, caramelizes near heat.' });
  d({ name: 'Sugar Water', cat: 'liquid', colors: ['#dce8f4', '#e4f0fc'], density: 1.08, tags: ['wet', 'sweet', 'food'],
      hotInto: 'steam', hotP: 0.06, reactions: [{ with: '#hot', p: 0.02, self: 'steam', spawn: 'sugar' }], desc: 'Sweetened water.' });
  d({ name: 'Baking Soda', cat: 'powder', colors: ['#f0f0ec', '#f8f8f4'], density: 1.1, tags: ['base'],
      reactions: [{ with: '#acid', p: 0.5, self: '', other: '', spawn: 'carbon dioxide' }],
      desc: 'Fizzes CO2 on any acid; neutralizes it.' });
  d({ name: 'Cement', cat: 'powder', colors: ['#b4b0a8', '#bcb8b0'], density: 1.5, tags: ['stone'],
      reactions: [{ with: '#wet', p: 0.3, self: 'concrete', other: '' }], desc: 'Add water, get concrete.' });
  d({ name: 'Sawdust', cat: 'powder', colors: ['#c8a868', '#d0b070'], density: 0.4, tags: ['organic', 'light'],
      flamm: 0.6, burnTime: 40, burnInto: 'ash', desc: 'Wood shavings; catches easily.' });
  d({ name: 'Coal Dust', cat: 'powder', colors: ['#242424', '#2c2c2c'], density: 0.75, tags: ['organic'],
      flamm: 0.5, burnTime: 20, burnInto: 'ash', explosive: { r: 5, byFire: true }, desc: 'Mine explosion fuel.' });
  d({ name: 'Gravel', cat: 'powder', colors: ['#8c8884', '#948c88', '#847c78'], density: 2.6, slide: false, tags: ['stone', 'heavy'],
      desc: 'Coarse rock; stacks steeply.' });
  d({ name: 'Dirt', cat: 'powder', colors: ['#6c4c2c', '#745434', '#644424'], density: 1.3, tags: ['stone'],
      dissolve: [{ in: 'water', into: 'mud', otherInto: '', p: 0.04 }], desc: 'Good clean earth. Makes mud, grows plants.' });
  d({ name: 'Clay', cat: 'powder', colors: ['#b08060', '#b88868'], density: 1.8, tags: ['stone'],
      hotInto: 'ceramic', hotP: 0.02, desc: 'Fires into ceramic in a kiln (or lava).' });
  d({ name: 'Silt', cat: 'powder', colors: ['#a89878', '#b0a080'], density: 1.2, tags: ['stone'], desc: 'Fine river sediment.' });
  d({ name: 'Red Sand', cat: 'powder', colors: ['#c86838', '#d07040', '#c06030'], density: 1.6, tags: ['stone'],
      magmaInto: 'glass', magmaP: 0.02, desc: 'Iron-rich desert sand.' });
  d({ name: 'Black Sand', cat: 'powder', colors: ['#383430', '#403c38'], density: 2.0, tags: ['stone'],
      magmaInto: 'glass', magmaP: 0.02, desc: 'Volcanic beach sand.' });
  d({ name: 'Snow', cat: 'powder', colors: ['#f4f8ff', '#ffffff', '#ecf4fc'], density: 0.3, tags: ['cold', 'wet', 'light'],
      hotInto: 'water', hotP: 0.3, reactions: [{ with: '#salty', p: 0.08, self: 'water' }], desc: 'Melts near warmth or salt.' });
  d({ name: 'Glass Shards', cat: 'powder', colors: ['#c8dce4', '#d0e4ec'], density: 2.5, tags: ['glassy', 'acidproof'],
      magmaInto: 'molten glass', magmaP: 0.02, desc: 'Careful, sharp. Re-melts into glass.' });
  d({ name: 'Rust', cat: 'powder', colors: ['#a05024', '#a8582c', '#98481c'], density: 2.5, tags: ['stone'],
      desc: 'Oxidized iron flakes.' });
  d({ name: 'Graphite', cat: 'powder', colors: ['#3c3c44', '#44444c'], density: 2.2, tags: ['conductive'],
      desc: 'Conductive carbon; pencil lead.' });
  d({ name: 'Charcoal', cat: 'powder', colors: ['#201c1c', '#282424'], density: 0.9, tags: ['organic'],
      flamm: 0.15, burnTime: 600, burnInto: 'ash', burnSmoke: 0.1,
      reactions: [{ with: 'saltpeter', p: 0.02, self: 'gunpowder', other: 'gunpowder' }],
      desc: 'Burns long and steady. Mix with saltpeter...' });
  d({ name: 'Thermite', cat: 'powder', colors: ['#8c5c3c', '#946444', '#845434'], density: 3.5,
      reactions: [{ with: '#hot', p: 0.25, self: 'molten iron', spawn: 'fire' }, { with: '#magma', p: 0.5, self: 'molten iron', spawn: 'fire' }],
      desc: 'Rust + aluminum. Needs serious heat, then melts through anything.' });
  d({ name: 'Fertilizer', cat: 'powder', colors: ['#d8cca0', '#e0d4a8'], density: 0.9, tags: ['organic'],
      flamm: 0.2, burnTime: 8, burnInto: '', explosive: { r: 5, byFire: true },
      reactions: [{ with: 'plant', p: 0.05, self: 'plant' }, { with: 'grass', p: 0.05, self: 'grass' }],
      desc: 'Feeds plants. Also, ammonium nitrate explodes.' });
  d({ name: 'Pollen', cat: 'powder', colors: ['#e8d048', '#f0d850'], density: 0.15, tags: ['organic', 'light', 'sweet'],
      flamm: 0.4, burnTime: 10, burnInto: '', desc: 'Achoo. Bees love it.' });
  d({ name: 'Spores', cat: 'powder', colors: ['#907848', '#988050'], density: 0.12, tags: ['organic', 'life', 'light'],
      reactions: [{ with: '#organic', p: 0.02, self: 'mold' }], desc: 'Lands on anything organic and grows mold.' });
  d({ name: 'Yeast', cat: 'powder', colors: ['#d8c8a0', '#e0d0a8'], density: 0.7, tags: ['organic', 'life'],
      reactions: [{ with: 'sugar', p: 0.05, spawn: 'carbon dioxide' }, { with: 'sugar water', p: 0.05, spawn: 'carbon dioxide' }],
      desc: 'Eats sugar, burps CO2.' });
  d({ name: 'Pepper', cat: 'powder', colors: ['#3c3428', '#443c30'], density: 0.5, tags: ['organic', 'food'], tox: 0.05,
      desc: 'Spicy irritant.' });
  d({ name: 'Chalk', cat: 'powder', colors: ['#f4f4f0', '#fcfcf8'], density: 1.1, tags: ['stone', 'base'],
      reactions: [{ with: '#acid', p: 0.4, self: '', spawn: 'carbon dioxide' }], desc: 'Calcium carbonate; fizzes in acid.' });
  d({ name: 'Quicklime', cat: 'powder', colors: ['#ece8dc', '#f4f0e4'], density: 1.2, tags: ['base'],
      reactions: [{ with: '#wet', p: 0.3, self: 'slaked lime', spawn: 'steam' }],
      desc: 'Gets scalding hot when wet.' });
  d({ name: 'Slaked Lime', cat: 'powder', colors: ['#e0dcd0', '#e8e4d8'], density: 1.15, tags: ['base'], desc: 'Spent lime.' });
  d({ name: 'Borax', cat: 'powder', colors: ['#e8e8e0', '#f0f0e8'], density: 0.85, tags: ['base', 'clean'],
      desc: 'Cleaning mineral.' });
  d({ name: 'Sulfur', cat: 'powder', colors: ['#e8d820', '#f0e028', '#e0d018'], density: 2.0,
      flamm: 0.4, burnTime: 80, burnInto: 'sulfur dioxide', burnSmoke: 0.1,
      desc: 'Brimstone. Burns blue into choking gas.' });
  d({ name: 'Red Phosphorus', cat: 'powder', colors: ['#a83828', '#b04030'], density: 2.3,
      flamm: 0.7, burnTime: 30, burnInto: '', desc: 'Matchbox striker material.' });
  d({ name: 'White Phosphorus', cat: 'powder', colors: ['#e8e4c8', '#f0ecd0'], density: 1.8, glow: true,
      flamm: 1, burnTime: 60, burnInto: '', emit: { what: 'fire', rate: 0.01, dir: 'all' },
      desc: 'Ignites itself in air. Handle never.' });
  d({ name: 'Saltpeter', cat: 'powder', colors: ['#e4e4dc', '#ecece4'], density: 1.1,
      desc: 'Potassium nitrate: the oxidizer in gunpowder.' });
  d({ name: 'Iron Filings', cat: 'powder', colors: ['#585c64', '#60646c'], density: 7, tags: ['metal', 'conductive', 'heavy'],
      reactions: [{ with: '#wet', p: 0.004, self: 'rust' }], magmaInto: 'molten iron', magmaP: 0.05,
      desc: 'Heavy metal powder; rusts when wet.' });
  d({ name: 'Talc', cat: 'powder', colors: ['#f0ece8', '#f8f4f0'], density: 0.8, tags: ['stone'], desc: 'Softest mineral.' });
  d({ name: 'Gypsum', cat: 'powder', colors: ['#e8e0d8', '#f0e8e0'], density: 1.2, tags: ['stone'], desc: 'Plaster powder.' });
  d({ name: 'Bone Meal', cat: 'powder', colors: ['#e8e0cc', '#f0e8d4'], density: 0.9, tags: ['organic'],
      reactions: [{ with: 'plant', p: 0.04, self: 'plant' }], desc: 'Ground bone; great fertilizer.' });
  d({ name: 'Coffee Grounds', cat: 'powder', colors: ['#40281c', '#483024'], density: 0.6, tags: ['organic'], desc: 'Used grounds.' });
  d({ name: 'Cocoa', cat: 'powder', colors: ['#583824', '#60402c'], density: 0.55, tags: ['organic', 'food', 'sweet'],
      flamm: 0.3, burnTime: 15, burnInto: '', desc: 'Chocolate dust.' });
  d({ name: 'Cinnamon', cat: 'powder', colors: ['#a05828', '#a86030'], density: 0.5, tags: ['organic', 'food'],
      flamm: 0.5, burnTime: 10, burnInto: '', desc: 'Flammable spice (do not snort).' });
  d({ name: 'Detergent', cat: 'powder', colors: ['#d8e8f0', '#e0f0f8'], density: 0.7, tags: ['base', 'clean'],
      reactions: [{ with: '#toxic', p: 0.1, other: '' }], desc: 'Scrubbing bubbles.' });
  d({ name: 'Dry Ice', cat: 'powder', colors: ['#dce8f0', '#e4f0f8'], density: 1.5, tags: ['cold', 'cryo'],
      decay: { life: [200, 500], into: 'carbon dioxide' }, desc: 'Frozen CO2; sublimates into fog.' });
  d({ name: 'Rice', cat: 'powder', colors: ['#f0ecdc', '#f8f4e4'], density: 0.85, tags: ['organic', 'food'],
      flamm: 0.15, burnTime: 30, burnInto: 'ash', desc: 'Uncooked grains.' });

  // ======================================================== METALS (46)
  const metal = (name, colors, opts = {}) => d({
    name, cat: opts.cat || 'static', colors,
    density: opts.density ?? 7,
    tags: ['metal', 'conductive', ...(opts.tags || [])],
    magmaInto: opts.molten === null ? null : (opts.molten ?? 'molten metal'),
    magmaP: opts.molten === null ? 0 : (opts.magmaP ?? 0.02),
    ...opts.extra, desc: opts.desc || ''
  });

  metal('Iron', ['#787c84', '#80848c', '#70747c'], { molten: 'molten iron',
    extra: { reactions: [{ with: '#wet', p: 0.0012, self: 'rust' }] }, desc: 'Strong but rusts when wet.' });
  metal('Steel', ['#9ba4ac', '#a3acb4', '#939ca4'], { molten: 'molten iron',
    extra: { reactions: [{ with: '#wet', p: 0.0003, self: 'rust' }] }, desc: 'Refined iron; rusts slowly.' });
  metal('Copper', ['#c87038', '#d07840', '#c06830'], { molten: 'molten copper', desc: 'Best conductor for the price.' });
  metal('Bronze', ['#b08048', '#b88850'], { desc: 'Copper + tin; the first alloy.' });
  metal('Brass', ['#c8a040', '#d0a848'], { desc: 'Copper + zinc; shiny.' });
  metal('Gold', ['#f0c020', '#f8c828', '#e8b818'], { molten: 'molten gold', density: 19.3, tags: ['acidproof', 'heavy'],
    desc: 'Never corrodes. Only aqua regia touches it.' });
  metal('Silver', ['#d8dce0', '#e0e4e8'], { density: 10.5, desc: 'Best conductor, tarnishes.' });
  metal('Platinum', ['#c8ccd4', '#d0d4dc'], { density: 21.4, tags: ['acidproof', 'heavy'], desc: 'Nobler than gold.' });
  metal('Aluminum', ['#c4c8cc', '#ccd0d4'], { molten: 'molten aluminum', density: 2.7, desc: 'Light, corrosion-resistant.' });
  metal('Zinc', ['#a8b0b8', '#b0b8c0'], { extra: { reactions: [{ with: '#acid', p: 0.1, self: '', spawn: 'hydrogen' }] },
    desc: 'Fizzes hydrogen in acid.' });
  metal('Tin', ['#c0c4c8', '#c8ccd0'], { desc: 'Soft, low-melting.' });
  metal('Lead', ['#686c74', '#70747c'], { molten: 'molten lead', density: 11.3, tags: ['toxic', 'heavy'],
    extra: { tox: 0.1 }, desc: 'Dense and toxic.' });
  metal('Nickel', ['#b0b4ac', '#b8bcb4'], { desc: 'Coin metal.' });
  metal('Titanium', ['#9ca8b0', '#a4b0b8'], { tags: ['acidproof'], magmaP: 0.005, desc: 'Light, strong, corrosion-proof.' });
  metal('Tungsten', ['#5c6068', '#646870'], { molten: null, tags: ['fireproof'], desc: 'Highest melting point: lava cannot touch it.' });
  metal('Chromium', ['#c0c8d0', '#c8d0d8'], { desc: 'Shiny plating.' });
  metal('Cobalt', ['#4868a8', '#5070b0'], { desc: 'Blue-tinged magnet metal.' });
  metal('Magnesium', ['#d0d4d8', '#d8dce0'], { density: 1.7,
    extra: { flamm: 0.15, burnTime: 220, burnInto: 'ash', burnSmoke: 0.02, glow: true },
    desc: 'Burns blinding white; water will not put it out.' });
  metal('Sodium', ['#d8d8c8', '#e0e0d0'], { cat: 'solid', density: 0.97,
    extra: { reactions: [{ with: '#wet', p: 0.7, explode: 5 }] }, desc: 'Explodes on contact with water.' });
  metal('Potassium', ['#ccccb8', '#d4d4c0'], { cat: 'solid', density: 0.86,
    extra: { reactions: [{ with: '#wet', p: 0.8, explode: 6 }] }, desc: 'Even angrier in water than sodium.' });
  metal('Lithium', ['#d4d4cc', '#dcdcd4'], { cat: 'solid', density: 0.53,
    extra: { reactions: [{ with: '#wet', p: 0.4, self: '', spawn: 'hydrogen' }, { with: '#wet', p: 0.2, spawn: 'fire' }] },
    desc: 'Fizzes and flames in water.' });
  metal('Cesium', ['#e8d090', '#f0d898'], { cat: 'solid', density: 1.9,
    extra: { reactions: [{ with: '#wet', p: 0.9, explode: 8 }] }, desc: 'Detonates instantly in water.' });
  metal('Calcium', ['#e0e0d4', '#e8e8dc'], { cat: 'solid', density: 1.55,
    extra: { reactions: [{ with: '#wet', p: 0.15, self: 'slaked lime', spawn: 'hydrogen' }] }, desc: 'Bubbles hydrogen in water.' });
  metal('Gallium', ['#c8d0dc', '#d0d8e4'], { extra: { hotInto: 'molten metal', hotP: 0.5 },
    desc: 'Melts in your hand (30°C).' });
  metal('Uranium', ['#788858', '#809060'], { density: 19, tags: ['radioactive', 'heavy'], desc: 'Faintly warm, very radioactive.' });
  metal('Plutonium', ['#889078', '#909880'], { density: 19.8, tags: ['radioactive', 'heavy'], desc: 'Reactor fuel.' });
  metal('Thorium', ['#98a088', '#a0a890'], { density: 11.7, tags: ['radioactive'], desc: 'Alternative nuclear fuel.' });
  metal('Radium', ['#c8e8b8', '#d0f0c0'], { density: 5.5, tags: ['radioactive'], extra: { glow: true },
    desc: 'Glows in the dark. That glow is bad for you.' });
  metal('Bismuth', ['#c890c0', '#88b0c8', '#c8b088'], { density: 9.8, desc: 'Grows rainbow staircase crystals.' });
  metal('Antimony', ['#a0a4b0', '#a8acb8'], { tags: ['toxic'], extra: { tox: 0.1 }, desc: 'Brittle metalloid.' });
  metal('Manganese', ['#98949c', '#a09ca4'], { desc: 'Steel hardener.' });
  metal('Molybdenum', ['#8c949c', '#949ca4'], { magmaP: 0.005, desc: 'High-temperature alloy metal.' });
  metal('Palladium', ['#c4c8cc', '#ccd0d4'], { density: 12, tags: ['acidproof'], desc: 'Catalytic converter metal.' });
  metal('Iridium', ['#d0d4dc', '#d8dce4'], { density: 22.6, tags: ['acidproof', 'heavy'], magmaP: 0.003,
    desc: 'Meteorite metal; nearly indestructible.' });
  metal('Osmium', ['#a8b0c0', '#b0b8c8'], { density: 22.6, tags: ['heavy'], desc: 'Densest element there is.' });
  metal('Beryllium', ['#b8c0b8', '#c0c8c0'], { density: 1.85, tags: ['toxic'], extra: { tox: 0.2 }, desc: 'Light, stiff, toxic dust.' });
  metal('Cadmium', ['#b0b8c8', '#b8c0d0'], { tags: ['toxic'], extra: { tox: 0.3 }, desc: 'Battery metal; nasty stuff.' });
  metal('Vanadium', ['#94a0a8', '#9ca8b0'], { desc: 'Spring-steel additive.' });
  metal('Zirconium', ['#b4b8bc', '#bcc0c4'], { desc: 'Reactor cladding.' });
  metal('Niobium', ['#a0a8b8', '#a8b0c0'], { desc: 'Superconducting alloys.' });
  metal('Tantalum', ['#8c94a4', '#949cac'], { tags: ['acidproof'], desc: 'Capacitor metal.' });
  metal('Indium', ['#c8ccd8', '#d0d4e0'], { extra: { hotInto: 'molten metal', hotP: 0.15 }, desc: 'Soft; melts easily.' });
  metal('Silicon', ['#5c6470', '#646c78'], { tags: ['stone'], extra: { conductive: false }, desc: 'Semiconductor. Sand, refined.' });
  metal('Germanium', ['#787c88', '#808490'], { extra: { conductive: false }, desc: 'The first transistor material.' });
  metal('Arsenic', ['#909088', '#989890'], { tags: ['toxic'], extra: { tox: 0.6 }, desc: 'Classic poison.' });
  metal('Boron', ['#4c4440', '#544c48'], { extra: { conductive: false }, desc: 'Hard metalloid.' });

  // ======================================================== STRUCTURAL & MINERALS (39)
  d({ name: 'Wood', cat: 'static', colors: ['#8a5c2c', '#946434', '#7e5426'], tags: ['organic'],
      flamm: 0.12, burnTime: 420, burnInto: 'ash', burnSmoke: 0.35, desc: 'Builds anything; burns steadily.' });
  d({ name: 'Leaf', cat: 'static', colors: ['#3c8c24', '#44942c', '#34841c'], tags: ['organic', 'life', 'food'],
      flamm: 0.6, burnTime: 30, burnInto: 'ash', desc: 'Crisp and quick to catch.' });
  d({ name: 'Brick', cat: 'static', colors: ['#a04430', '#a84c38', '#984028'], tags: ['stone', 'fireproof'], desc: 'Fired clay block.' });
  d({ name: 'Obsidian', cat: 'static', colors: ['#241c2c', '#2c2434'], tags: ['stone', 'glassy', 'fireproof'], desc: 'Volcanic glass.' });
  d({ name: 'Granite', cat: 'static', colors: ['#8c8488', '#948c90', '#847c80'], tags: ['stone', 'fireproof'],
      magmaInto: 'lava', magmaP: 0.001, desc: 'Hard igneous rock.' });
  d({ name: 'Marble', cat: 'static', colors: ['#e4e0dc', '#ece8e4'], tags: ['stone'],
      reactions: [{ with: '#acid', p: 0.08, self: '', spawn: 'carbon dioxide' }], desc: 'Beautiful, but acid rain eats it.' });
  d({ name: 'Limestone', cat: 'static', colors: ['#d0c8b0', '#d8d0b8'], tags: ['stone'],
      reactions: [{ with: '#acid', p: 0.12, self: '', spawn: 'carbon dioxide' }],
      hotInto: 'quicklime', hotP: 0.008, desc: 'Fizzes in acid; kilns into quicklime.' });
  d({ name: 'Basalt', cat: 'static', colors: ['#3c3c40', '#444448'], tags: ['stone', 'fireproof'],
      magmaInto: 'lava', magmaP: 0.001, desc: 'Cooled lava rock.' });
  d({ name: 'Slate', cat: 'static', colors: ['#4c545c', '#545c64'], tags: ['stone'], desc: 'Splits into roof tiles.' });
  d({ name: 'Sandstone', cat: 'static', colors: ['#d0a868', '#d8b070'], tags: ['stone'], desc: 'Compressed ancient dunes.' });
  d({ name: 'Flint', cat: 'static', colors: ['#54504c', '#5c5854'], tags: ['stone'],
      reactions: [{ with: 'steel', p: 0.004, spawn: 'fire' }], desc: 'Sparks against steel.' });
  d({ name: 'Quartz', cat: 'static', colors: ['#e8e4ec', '#f0ecf4'], tags: ['stone', 'glassy', 'acidproof'], desc: 'Crystal silica.' });
  d({ name: 'Diamond', cat: 'static', colors: ['#d8f0f8', '#e0f8ff', '#c8e8f0'], tags: ['glassy', 'acidproof', 'fireproof'],
      indestructible: true, desc: 'Hardest natural material. Survives everything.' });
  d({ name: 'Ruby', cat: 'static', colors: ['#c02040', '#c82848'], tags: ['glassy', 'acidproof'], desc: 'Red corundum.' });
  d({ name: 'Emerald', cat: 'static', colors: ['#20a058', '#28a860'], tags: ['glassy', 'acidproof'], desc: 'Green beryl.' });
  d({ name: 'Sapphire', cat: 'static', colors: ['#2048b0', '#2850b8'], tags: ['glassy', 'acidproof'], desc: 'Blue corundum.' });
  d({ name: 'Coal', cat: 'static', colors: ['#1c1c1c', '#242424', '#141414'], tags: ['organic'],
      flamm: 0.08, burnTime: 800, burnInto: 'ash', burnSmoke: 0.4, desc: 'Fossil fuel; burns forever.' });
  d({ name: 'Iron Ore', cat: 'static', colors: ['#7c5c4c', '#846454'], tags: ['stone'],
      magmaInto: 'molten iron', magmaP: 0.01, desc: 'Smelts into iron under lava heat.' });
  d({ name: 'Copper Ore', cat: 'static', colors: ['#548464', '#5c8c6c'], tags: ['stone'],
      magmaInto: 'molten copper', magmaP: 0.01, desc: 'Green-streaked rock.' });
  d({ name: 'Gold Ore', cat: 'static', colors: ['#8c7c4c', '#c8a838', '#948454'], tags: ['stone'],
      magmaInto: 'molten gold', magmaP: 0.01, desc: 'Glittering veins.' });
  d({ name: 'Rubber', cat: 'static', colors: ['#2c2c34', '#34343c'], tags: ['organic'],
      flamm: 0.2, burnTime: 300, burnInto: '', burnSmoke: 0.95, desc: 'Insulator; burns with filthy smoke.' });
  d({ name: 'Plastic', cat: 'static', colors: ['#b8c4dc', '#c0cce4'], tags: ['organic'],
      flamm: 0.18, burnTime: 200, burnInto: '', burnSmoke: 0.8, hotInto: 'molten plastic', hotP: 0.08,
      desc: 'Melts and drips before it burns.' });
  d({ name: 'Styrofoam', cat: 'static', colors: ['#f0f0f4', '#f8f8fc'], tags: ['organic', 'light'],
      flamm: 0.55, burnTime: 40, burnInto: '', burnSmoke: 0.9,
      reactions: [{ with: 'acetone', p: 0.5, self: '' }], desc: 'Vanishes in acetone. Awful smoke.' });
  d({ name: 'Foam', cat: 'static', colors: ['#e8e4d8', '#f0ece0'], tags: ['organic', 'light'],
      flamm: 0.4, burnTime: 60, burnInto: '', desc: 'Squishy padding.' });
  d({ name: 'Sponge', cat: 'static', colors: ['#e0c860', '#e8d068'], tags: ['organic'],
      flamm: 0.3, burnTime: 80, burnInto: 'ash', reactions: [{ with: '#wet', p: 0.5, other: '' }],
      desc: 'Drinks any liquid that touches it.' });
  d({ name: 'Cork', cat: 'static', colors: ['#c09868', '#c8a070'], tags: ['organic', 'light'],
      flamm: 0.3, burnTime: 100, burnInto: 'ash', desc: 'Bark that floats.' });
  d({ name: 'Paper', cat: 'static', colors: ['#f0ecdc', '#f8f4e4'], tags: ['organic'],
      flamm: 0.8, burnTime: 25, burnInto: 'ash', desc: 'Fahrenheit 451.' });
  d({ name: 'Cardboard', cat: 'static', colors: ['#b89058', '#c09860'], tags: ['organic'],
      flamm: 0.6, burnTime: 60, burnInto: 'ash', desc: 'Box material.' });
  d({ name: 'Cloth', cat: 'static', colors: ['#c8b8d8', '#d0c0e0'], tags: ['organic'],
      flamm: 0.55, burnTime: 50, burnInto: 'ash', desc: 'Woven fabric.' });
  d({ name: 'Wool', cat: 'static', colors: ['#e8e0d0', '#f0e8d8'], tags: ['organic'],
      flamm: 0.12, burnTime: 80, burnInto: 'ash', desc: 'Naturally flame-resistant.' });
  d({ name: 'Leather', cat: 'static', colors: ['#8c5834', '#94603c'], tags: ['organic'],
      flamm: 0.15, burnTime: 150, burnInto: 'ash', desc: 'Tough hide.' });
  d({ name: 'Bone', cat: 'static', colors: ['#ece4d0', '#f4ecd8'], tags: ['organic'],
      flamm: 0.03, burnTime: 300, burnInto: 'bone meal', desc: 'Calcium scaffold; acid dissolves it.' });
  d({ name: 'Coral', cat: 'static', colors: ['#f08068', '#f88870', '#e87860'], tags: ['stone', 'life'],
      reactions: [{ with: '#acid', p: 0.15, self: '' }], desc: 'A living reef; acid bleaches it away.' });
  d({ name: 'Amber', cat: 'static', colors: ['#d89020', '#e09828'], tags: ['organic', 'glassy'],
      flamm: 0.08, burnTime: 200, burnInto: '', desc: 'Fossilized resin.' });
  d({ name: 'Pumice', cat: 'powder', colors: ['#b8b4a8', '#c0bcb0'], density: 0.5, tags: ['stone', 'light'],
      desc: 'The rock that floats on water.' });
  d({ name: 'Asphalt', cat: 'static', colors: ['#2c2c2c', '#343434'], tags: ['organic', 'sticky'],
      flamm: 0.06, burnTime: 300, burnInto: 'tar', burnSmoke: 0.9, hotInto: 'tar', hotP: 0.03,
      desc: 'Road surface; softens in heat.' });
  d({ name: 'Ceramic', cat: 'static', colors: ['#d8ccc0', '#e0d4c8'], tags: ['stone', 'acidproof', 'fireproof'], desc: 'Kiln-fired and tough.' });
  d({ name: 'Drywall', cat: 'static', colors: ['#e4e0dc', '#ecE8e4'], tags: ['stone'],
      reactions: [{ with: '#wet', p: 0.015, self: 'gypsum' }], desc: 'Crumbles to gypsum when soaked.' });
  d({ name: 'Slag', cat: 'static', colors: ['#5c544c', '#645c54'], tags: ['stone'], desc: 'Smelting leftovers.' });

  // ======================================================== PLANT LIFE (16)
  d({ name: 'Vine', cat: 'static', colors: ['#2c7c1c', '#348424'], tags: ['organic', 'life'],
      flamm: 0.5, burnTime: 40, burnInto: '', grow: { on: ['water'], p: 0.25 }, desc: 'Creeps through any water it finds.' });
  d({ name: 'Moss', cat: 'static', colors: ['#4c7434', '#547c3c'], tags: ['organic', 'life'],
      flamm: 0.35, burnTime: 30, burnInto: '', grow: { on: ['#stone'], p: 0.0015 }, desc: 'Slowly carpets bare stone.' });
  d({ name: 'Algae', cat: 'static', colors: ['#207848', '#288050'], tags: ['organic', 'life', 'food'],
      grow: { on: ['water'], p: 0.008 }, desc: 'Green bloom that spreads through water.' });
  d({ name: 'Fungus', cat: 'static', colors: ['#b09878', '#b8a080'], tags: ['organic', 'life'],
      flamm: 0.3, burnTime: 40, burnInto: '', grow: { on: ['wood', 'leaf'], p: 0.004 }, desc: 'Rots wood slowly.' });
  d({ name: 'Mold', cat: 'static', colors: ['#748444', '#7c8c4c', '#6c7c3c'], tags: ['organic', 'life', 'toxic'], tox: 0.1,
      flamm: 0.3, burnTime: 30, burnInto: '', grow: { on: ['#food'], p: 0.01 },
      reactions: [{ with: '#clean', p: 0.6, self: '' }], desc: 'Devours food; bleach kills it.' });
  d({ name: 'Bacteria', cat: 'static', colors: ['#c8b458', '#d0bc60'], tags: ['organic', 'life'], tox: 0.15,
      grow: { on: ['#food', '#organic'], p: 0.004 }, hotInto: '', hotP: 0.5,
      reactions: [{ with: '#clean', p: 0.8, self: '' }], desc: 'Microbial creep. Heat or soap stops it.' });
  d({ name: 'Virus', cat: 'static', colors: ['#c04898', '#c850a0'], tags: ['life', 'toxic'], tox: 0.6,
      grow: { on: ['#life'], p: 0.03 }, decay: { life: [500, 900], into: '' },
      reactions: [{ with: '#clean', p: 0.7, self: '' }], desc: 'Infects anything alive, then burns out.' });
  d({ name: 'Seed', cat: 'powder', colors: ['#a08040', '#a88848'], density: 0.7, tags: ['organic', 'food'],
      flamm: 0.3, burnTime: 15, burnInto: '',
      reactions: [{ with: 'dirt', p: 0.08, self: 'plant' }, { with: 'mud', p: 0.08, self: 'plant' }, { with: 'water', p: 0.03, self: 'plant' }],
      desc: 'Sprouts on dirt or water.' });
  d({ name: 'Grass', cat: 'static', colors: ['#48a428', '#50ac30', '#409c20'], tags: ['organic', 'life', 'food'],
      flamm: 0.5, burnTime: 20, burnInto: 'ash', grow: { on: ['dirt'], p: 0.002 }, desc: 'Spreads across soil.' });
  d({ name: 'Flower', cat: 'static', colors: ['#e858a0', '#f060a8', '#e8d048'], tags: ['organic', 'life', 'sweet'],
      flamm: 0.45, burnTime: 25, burnInto: 'ash', desc: 'Pretty. Bees approve.' });
  d({ name: 'Cactus', cat: 'static', colors: ['#48884c', '#509054'], tags: ['organic', 'life', 'food'],
      flamm: 0.15, burnTime: 60, burnInto: 'ash', desc: 'Stores water; hard to burn.' });
  d({ name: 'Mushroom', cat: 'static', colors: ['#c87858', '#d08060', '#e8e0d0'], tags: ['organic', 'life', 'food'],
      flamm: 0.3, burnTime: 30, burnInto: 'ash', desc: 'Fruit of the fungus.' });
  d({ name: 'Bamboo', cat: 'static', colors: ['#88a838', '#90b040'], tags: ['organic', 'life'],
      flamm: 0.4, burnTime: 60, burnInto: 'ash', grow: { on: ['water'], p: 0.12 }, desc: 'Fastest growing plant alive.' });
  d({ name: 'Ivy', cat: 'static', colors: ['#286428', '#306c30'], tags: ['organic', 'life'],
      flamm: 0.4, burnTime: 35, burnInto: '', grow: { on: ['#stone'], p: 0.003 }, desc: 'Climbs walls, given time.' });
  d({ name: 'Lichen', cat: 'static', colors: ['#a8b088', '#b0b890'], tags: ['organic', 'life'],
      grow: { on: ['#stone'], p: 0.0008 }, desc: 'Half fungus, half algae; slower than moss.' });
  d({ name: 'Kelp', cat: 'static', colors: ['#487038', '#507840'], tags: ['organic', 'life', 'food'],
      grow: { on: ['salt water'], p: 0.03 }, desc: 'Seaweed forest; needs salt water.' });

  // ======================================================== CREATURES (18)
  d({ name: 'Cat', colors: ['#d08830', '#c07820', '#e0a040'], tags: ['organic', 'life'],
      creature: { body: 'quadruped', size: 'small', speed: 0.7, hp: 90, fears: ['hot', 'wet', 'toxic'], eats: ['food'] },
      desc: 'Lands on its feet, hates water, flees fire.' });
  d({ name: 'Dog', colors: ['#8a6238', '#946c40', '#806030'], tags: ['organic', 'life'],
      creature: { body: 'quadruped', size: 'small', speed: 0.85, hp: 100, canSwim: true, fears: ['hot', 'toxic'], eats: ['food'] },
      desc: 'Loyal, can swim, still flammable.' });
  d({ name: 'Mouse', colors: ['#9a9490', '#a49e9a'], tags: ['organic', 'life'],
      creature: { body: 'bug', size: 'tiny', speed: 1.1, hp: 20, fears: ['hot', 'toxic'], eats: ['food', 'sweet'] },
      desc: 'Small, fast, always hungry.' });
  d({ name: 'Bird', colors: ['#4878c8', '#5080d0'], tags: ['organic', 'life'],
      creature: { body: 'bird', size: 'tiny', speed: 0.9, hp: 30, canFly: true, fears: ['hot', 'toxic'] },
      desc: 'Flits around above the chaos.' });
  d({ name: 'Fish', colors: ['#e87838', '#f08040', '#d0d8e0'], tags: ['organic', 'life', 'food'],
      creature: { body: 'fish', size: 'tiny', speed: 0.8, hp: 30, aquatic: true, canSwim: true, fears: ['hot', 'toxic'] },
      desc: 'Happy in water, doomed on land.' });
  d({ name: 'Snake', colors: ['#508030', '#588838'], tags: ['organic', 'life'],
      creature: { body: 'snake', size: 'small', speed: 0.5, hp: 45, canSwim: true, fears: ['hot', 'cold'] },
      desc: 'Slithers along the ground.' });
  d({ name: 'Spider', colors: ['#302824', '#38302c'], tags: ['organic', 'life'],
      creature: { body: 'bug', size: 'tiny', speed: 0.8, hp: 15, fears: ['hot', 'wet'] },
      desc: 'Scuttles and climbs.' });
  d({ name: 'Ant', colors: ['#402818', '#482c1c'], tags: ['organic', 'life'],
      creature: { body: 'bug', size: 'tiny', speed: 0.95, hp: 8, fears: ['hot', 'wet'], eats: ['food', 'sweet'] },
      desc: 'Tireless crumb hauler.' });
  d({ name: 'Bee', colors: ['#e8b820', '#302820'], tags: ['organic', 'life'],
      creature: { body: 'bug', size: 'tiny', speed: 1.0, hp: 10, canFly: true, fears: ['hot', 'wet', 'toxic'], eats: ['sweet'] },
      desc: 'Seeks anything sweet.' });
  d({ name: 'Butterfly', colors: ['#e86830', '#f07038', '#f8d048'], tags: ['organic', 'life'],
      creature: { body: 'bird', size: 'tiny', speed: 0.6, hp: 6, canFly: true, fears: ['hot', 'wet'] },
      desc: 'Fragile and beautiful.' });
  d({ name: 'Firefly', colors: ['#d8e838', '#e0f040'], tags: ['organic', 'life'],
      creature: { body: 'bug', size: 'tiny', speed: 0.7, hp: 6, canFly: true, fears: ['hot', 'wet'] },
      desc: 'A drifting speck of light.' });
  d({ name: 'Frog', colors: ['#48a040', '#50a848'], tags: ['organic', 'life'],
      creature: { body: 'blob', size: 'tiny', speed: 0.7, hp: 30, canSwim: true, fears: ['hot', 'toxic'] },
      desc: 'At home in and out of the pond.' });
  d({ name: 'Worm', colors: ['#c88088', '#d08890'], tags: ['organic', 'life', 'food'],
      creature: { body: 'snake', size: 'tiny', speed: 0.25, hp: 12, fears: ['hot', 'salty'] },
      desc: 'Wriggles slowly. Salt is its nightmare.' });
  d({ name: 'Human', colors: ['#e0a878', '#3858a0', '#282828'], tags: ['organic', 'life'],
      creature: { body: 'humanoid', size: 'medium', speed: 0.5, hp: 140, canSwim: true, fears: ['hot', 'toxic', 'acid', 'radioactive'], eats: ['food'] },
      desc: 'Fragile, flammable, keeps walking into things.' });
  d({ name: 'Penguin', colors: ['#282830', '#e8e8f0', '#e8a020'], tags: ['organic', 'life'],
      creature: { body: 'humanoid', size: 'small', speed: 0.45, hp: 60, canSwim: true, fears: ['hot'], eats: ['food'] },
      desc: 'Waddles; loves the cold.' });
  d({ name: 'Turtle', colors: ['#588048', '#608850', '#907848'], tags: ['organic', 'life'],
      creature: { body: 'blob', size: 'small', speed: 0.15, hp: 160, canSwim: true, fears: ['hot'] },
      desc: 'Slow, but that shell takes a beating.' });
  d({ name: 'Rabbit', colors: ['#c8b8a8', '#d0c0b0'], tags: ['organic', 'life'],
      creature: { body: 'quadruped', size: 'tiny', speed: 1.2, hp: 35, fears: ['hot', 'toxic'], eats: ['food'] },
      desc: 'Quick and jumpy.' });
  d({ name: 'Fox', colors: ['#d06828', '#d87030', '#f0f0f0'], tags: ['organic', 'life'],
      creature: { body: 'quadruped', size: 'small', speed: 0.95, hp: 80, fears: ['hot'], eats: ['food'] },
      desc: 'Sly woodland hunter.' });

  // ======================================================== FOOD (15)
  d({ name: 'Chocolate', cat: 'static', colors: ['#4c2c18', '#543420'], tags: ['organic', 'food', 'sweet'],
      flamm: 0.1, burnTime: 80, burnInto: 'ash', hotInto: 'melted chocolate', hotP: 0.2, desc: 'Melts at body temperature.' });
  d({ name: 'Melted Chocolate', cat: 'liquid', colors: ['#583622', '#60402a'], density: 1.25, viscosity: 0.75,
      tags: ['organic', 'food', 'sweet', 'sticky'], rest: { after: 300, into: 'chocolate' }, desc: 'Warm and gooey.' });
  d({ name: 'Butter', cat: 'static', colors: ['#f0d868', '#f8e070'], tags: ['organic', 'food'],
      flamm: 0.1, burnTime: 120, burnInto: '', hotInto: 'melted butter', hotP: 0.25, desc: 'Melts in a warm pan.' });
  d({ name: 'Melted Butter', cat: 'liquid', colors: ['#f0d048', '#f8d850'], density: 0.91, viscosity: 0.3,
      tags: ['organic', 'food'], flamm: 0.3, burnTime: 150, burnInto: '', burnSmoke: 0.6,
      rest: { after: 400, into: 'butter' }, desc: 'Careful: grease fires hate water.' });
  d({ name: 'Cheese', cat: 'static', colors: ['#f0c040', '#f8c848'], tags: ['organic', 'food'],
      flamm: 0.15, burnTime: 100, burnInto: 'ash', hotInto: 'melted butter', hotP: 0.03, desc: 'Mice incoming.' });
  d({ name: 'Dough', cat: 'liquid', colors: ['#e8dcc0', '#f0e4c8'], density: 1.2, viscosity: 0.9,
      tags: ['organic', 'food'], hotInto: 'bread', hotP: 0.15, desc: 'Bakes into bread near heat.' });
  d({ name: 'Bread', cat: 'static', colors: ['#c89050', '#d09858'], tags: ['organic', 'food'],
      flamm: 0.3, burnTime: 60, burnInto: 'ash', desc: 'Fresh from the oven.' });
  d({ name: 'Meat', cat: 'static', colors: ['#c04848', '#c85050'], tags: ['organic', 'food'],
      flamm: 0.12, burnTime: 150, burnInto: 'ash', hotInto: 'cooked meat', hotP: 0.06, desc: 'Cooks near fire — or chars in it.' });
  d({ name: 'Cooked Meat', cat: 'static', colors: ['#8a4c2c', '#945434'], tags: ['organic', 'food'],
      flamm: 0.15, burnTime: 100, burnInto: 'ash', desc: 'Well done.' });
  d({ name: 'Gelatin', cat: 'static', colors: ['#d84868', '#e05070'], tags: ['organic', 'food', 'sweet'],
      hotInto: 'sugar water', hotP: 0.1, desc: 'Wobbles; melts back to liquid.' });
  d({ name: 'Ice Cream', cat: 'static', colors: ['#f4e8d8', '#f8d8e0', '#e8d0b8'], tags: ['organic', 'food', 'sweet', 'cold'],
      hotInto: 'milk', hotP: 0.25, desc: 'Eat it before it melts.' });
  d({ name: 'Caramel', cat: 'liquid', colors: ['#b06818', '#b87020'], density: 1.35, viscosity: 0.85,
      tags: ['organic', 'food', 'sweet', 'sticky'], rest: { after: 500, into: 'candy' },
      flamm: 0.1, burnTime: 60, burnInto: 'ash', desc: 'Burnt sugar; hardens into candy.' });
  d({ name: 'Candy', cat: 'static', colors: ['#e83858', '#38a0e8', '#e8d038'], tags: ['organic', 'food', 'sweet'],
      dissolve: [{ in: 'water', into: '', otherInto: 'sugar water', p: 0.05 }],
      hotInto: 'caramel', hotP: 0.08, desc: 'Dissolves in water; drop it in soda.' });
  d({ name: 'Ketchup', cat: 'liquid', colors: ['#b82818', '#c03020'], density: 1.14, viscosity: 0.8,
      tags: ['organic', 'food'], desc: 'Refuses to leave the bottle.' });
  d({ name: 'Jam', cat: 'liquid', colors: ['#902848', '#983050'], density: 1.3, viscosity: 0.85,
      tags: ['organic', 'food', 'sweet', 'sticky'], desc: 'Sticky fruit goo.' });

  // ======================================================== ENERGY & DEVICES (10)
  d({ name: 'Electricity', cat: 'energy', colors: ['#ffff80', '#ffffff', '#c0e0ff'], density: 0.00001, glow: true,
      spark: true, tags: ['conductive'], decay: { life: [16, 40], into: '' },
      desc: 'Arcs along metal and water; ignites and detonates.' });
  d({ name: 'Ember', cat: 'powder', colors: ['#ff7020', '#e05810', '#c04808'], density: 0.8, glow: true,
      tags: ['hot'], decay: { life: [80, 200], into: 'ash' }, desc: 'Glowing coals; still plenty hot.' });
  d({ name: 'Dynamite', cat: 'static', colors: ['#c03020', '#c83828'], tags: ['explosive'],
      flamm: 0.5, burnTime: 30, burnInto: '', explosive: { r: 10, byFire: true, byShock: true },
      desc: 'Nitroglycerin, stabilized. Mostly.' });
  d({ name: 'TNT', cat: 'static', colors: ['#b82818', '#c03020', '#f0d048'], tags: ['explosive'],
      flamm: 0.3, burnTime: 20, burnInto: '', explosive: { r: 12, byFire: true, byShock: true },
      desc: 'Bigger badda boom.' });
  d({ name: 'Firework', cat: 'solid', colors: ['#d04898', '#48a0d0', '#e8d048'], tags: ['explosive'], density: 1.5,
      flamm: 0.6, burnTime: 15, burnInto: '', explosive: { r: 6, byFire: true },
      desc: 'Light the fuse and stand back.' });
  d({ name: 'Match', cat: 'static', colors: ['#e0c8a0', '#c03020'], tags: ['organic'],
      flamm: 1, burnTime: 120, burnInto: 'ash', desc: 'Strikes at the slightest heat.' });
  d({ name: 'Glow Stick Fluid', cat: 'liquid', colors: ['#68f048', '#70f850'], density: 1.1, glow: true,
      tags: [], desc: 'Harmless chemiluminescence.' });
  d({ name: 'Antimatter', cat: 'solid', colors: ['#e048e0', '#f050f0', '#c838c8'], density: 2, glow: true,
      reactions: [
        { with: '#stone', p: 0.8, explode: 8 }, { with: '#metal', p: 0.8, explode: 8 },
        { with: '#organic', p: 0.8, explode: 8 }, { with: '#wet', p: 0.8, explode: 8 }
      ], corrosive: 1,
      desc: 'Annihilates ordinary matter on contact.' });
  d({ name: 'Gas Burner', cat: 'static', colors: ['#606870', '#687078'], tags: ['fireproof'],
      emit: { what: 'methane', rate: 0.15, dir: 'up' }, desc: 'A steady leak of flammable gas.' });
  d({ name: 'Snow Machine', cat: 'static', colors: ['#a0c0d8', '#a8c8e0'], tags: ['fireproof', 'cold'],
      emit: { what: 'snow', rate: 0.2, dir: 'down' }, desc: 'Endless winter.' });

  reg.resolveAll();
}
